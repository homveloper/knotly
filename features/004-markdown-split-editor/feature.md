# Feature: Markdown Split Editor with Mind Map

## 개요

마크다운 에디터와 마인드맵 캔버스를 분할 화면으로 제공하여, 사용자가 키보드로 빠르게 입력하면서도 시각적으로 구조를 파악할 수 있는 하이브리드 노트 도구.

## 핵심 동기

> "사용자에게 가장 빠른 수단은 키보드를 통한 텍스트 입력이다"

- 기존 마인드맵은 마우스/터치 중심으로 속도가 느림
- 마크다운 텍스트 입력이 가장 효율적
- 순수 마크다운 문법 호환으로 다른 도구와 연동 가능
- 에디터와 마인드맵을 동시에 보면서 작업

---

## 아키텍처 설계

### 레이어 구조

```
┌─────────────────────────────────────┐
│   UI Layer (React Components)       │
│   - MarkdownEditor (left 30-70%)    │
│   - MindMapCanvas (right 30-70%)    │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Application Layer                 │
│   - canvasStore (Zustand)           │
│   - Node[], Edge[] objects          │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Repository Layer (NEW)            │
│   - MarkdownParser                  │
│   - MarkdownSerializer              │
│   - 양방향 변환 로직                │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   File Format (.md)                 │
│   - 순수 마크다운 (YAML 제거)      │
└─────────────────────────────────────┘
```

---

## 마크다운 포맷 설계

### 기본 구조

```markdown
<!-- knotly-layout: radial -->

# 프로젝트 계획 {.color-blue .h2}

## 백엔드 개발 {.color-yellow}

- API 설계
  - REST API 구조
  - GraphQL 검토

```javascript
// 샘플 코드 {.color-green}
function hello() {
  console.log("world");
}
```

![아키텍처 다이어그램](./diagram.png) {.color-purple}

---

## 프론트엔드 개발

- UI 디자인
  - Figma 프로토타입
  - 컴포넌트 라이브러리
```

### 문법 규칙

1. **계층 관계**
   - 헤더 레벨: `#` → `##` → `###` (부모-자식)
   - 리스트 들여쓰기: 2 spaces per level (부모-자식)
   - 헤더 아래 리스트: 헤더가 부모, 리스트가 자식
   - **코드/이미지**: 바로 위에 있는 헤더 또는 리스트 항목의 자식 (컨텍스트 기반)
     - 헤더 바로 아래 코드 블록 → 헤더의 자식
     - 리스트 바로 아래 코드 블록 → 가장 가까운 리스트 항목의 자식
     - 파일 최상단 코드 블록 → 부모 없는 루트 노드

2. **스타일 토큰**
   - `{.token1 .token2}` 형식 (마크다운 속성 확장 문법)
   - 예: `{.color-red .h3 .neat}`

3. **노드 타입**
   - **텍스트**: 일반 리스트 항목
   - **헤더**: `#` ~ `######`
   - **코드**: ` ```언어 ` 멀티라인 코드 블록
   - **이미지**: `![alt](url)` 이미지

4. **그룹핑**
   - `---` (수평선) 구분자로 섹션 그룹화
   - 같은 구분자 사이 노드들은 groupId 공유

5. **추가 연결**
   - 계층 관계 외 자유로운 연결은 Canvas에서 링크 버튼(🔗)으로 생성
   - 마크다운 파일에는 저장되지 않고, 메타데이터(위치 정보처럼)로 관리

6. **레이아웃 메타데이터**
   - `<!-- knotly-layout: radial -->` 또는 `<!-- knotly-layout: horizontal -->`
   - HTML 주석으로 파일 최상단에 배치
   - 생략 시 기본값: `radial`
   - 다른 마크다운 도구에서는 무시됨

---

## Node 타입 정의

```typescript
interface Node {
  id: string;
  type: 'text' | 'header' | 'code' | 'image';
  content: string;

  // 계층 정보
  level?: number; // 헤더: 1-6, 리스트: 들여쓰기 깊이

  // 코드 블록 메타데이터
  language?: string; // 'javascript', 'python', etc.

  // 이미지 메타데이터
  imageUrl?: string;
  altText?: string;

  // 그룹 정보
  groupId?: string; // --- 구분자로 묶인 그룹

  // 스타일 토큰
  style: string; // "color-red h3 neat"

  // 위치 정보
  position: { x: number; y: number };
  measuredSize?: { width: number; height: number };
}
```

---

## 파싱 규칙 상세

### 1. 헤더 → 노드 변환

**입력:**
```markdown
# Level 1 {.color-blue}
## Level 2
### Level 3
```

**출력:**
- 노드 3개 생성 (type: 'header')
- level: 1, 2, 3
- 부모-자식 엣지: # → ## → ###
- style 파싱: "color-blue"

### 2. 리스트 → 노드 변환

**입력:**
```markdown
- 부모 항목
  - 자식 항목 1
  - 자식 항목 2
    - 손자 항목
```

**출력:**
- 노드 4개 생성 (type: 'text')
- level: 0, 1, 1, 2
- 부모-자식 엣지: 들여쓰기 기반
- 리스트 스택으로 부모 추적

### 3. 코드 블록 → 노드 변환

**입력:**
````markdown
```javascript {.color-green}
function hello() {
  console.log("world");
}
```
````

**출력:**
- 노드 1개 생성 (type: 'code')
- language: 'javascript'
- content: 코드 전체 (원본 보존)
- style: 'color-green'

**계층 관계 예시:**

**예시 1: 헤더 아래 코드**
```markdown
## 백엔드 API

```javascript
app.get('/api')
```
```
→ 코드 블록은 "백엔드 API" 헤더의 자식 노드

**예시 2: 리스트 아래 코드**
```markdown
- 인증 로직

```javascript
auth.verify()
```
```
→ 코드 블록은 "인증 로직" 리스트 항목의 자식 노드

**예시 3: 파일 최상단 코드**
```markdown
```javascript
// 설정 파일
const config = {}
```

## 메인 섹션
```
→ 코드 블록은 부모 없는 루트 노드

### 4. 이미지 → 노드 변환

**입력:**
```markdown
![다이어그램](./image.png) {.color-purple}
```

**출력:**
- 노드 1개 생성 (type: 'image')
- imageUrl: './image.png'
- altText: '다이어그램'
- content: '다이어그램' (표시용)
- style: 'color-purple'

### 5. 그룹 파싱

**입력:**
```markdown
---
# 섹션 1
- 항목 A
- 항목 B
---
```

**출력:**
- groupId 생성 (UUID)
- `---` 사이 모든 노드에 같은 groupId 부여
- 캔버스에서 시각적으로 그룹 표시 가능

### 6. 레이아웃 메타데이터 파싱

**입력:**
```markdown
<!-- knotly-layout: horizontal -->

# 메인 주제
```

**출력:**
- 레이아웃 타입: `'horizontal'` 추출
- 기본값: `'radial'` (주석 없거나 인식 불가 시)

---

## 자동 레이아웃 시스템

### 레이아웃 타입

순수 마크다운에는 위치 정보가 없으므로, 파싱 시 자동으로 노드 위치를 계산한다.

#### 1. Radial Layout (방사형 트리) - 기본값

```
        ┌─────┐
        │Root │
        └─────┘
       ╱   │   ╲
   ┌──┐  ┌──┐  ┌──┐
   │L1│  │L1│  │L1│
   └──┘  └──┘  └──┘
```

**특징:**
- 중앙에 루트 노드
- 레벨별로 원형 배치 (반지름 증가)
- 각도를 형제 수로 균등 분할

**적용 시나리오:**
- 계층이 명확한 구조
- 루트에서 방사형으로 확장되는 아이디어
- 브레인스토밍, 개념 맵

#### 2. Horizontal Layout (좌우 트리)

```
┌────┐
│Root│───┬─── Level 1
└────┘   │
         ├─── Level 1
         │
         └─── Level 1
                ├─── Level 2
                └─── Level 2
```

**특징:**
- 왼쪽에서 오른쪽으로 레벨 증가
- 같은 레벨은 세로로 정렬
- 전통적인 조직도 스타일

**적용 시나리오:**
- 순차적 프로세스
- 시간순 플로우
- 조직 구조, 의사결정 트리

### 레이아웃 알고리즘 개요

```typescript
type LayoutType = 'radial' | 'horizontal';

function applyLayout(nodes: Node[], edges: Edge[], layout: LayoutType) {
  // 1. BFS로 레벨 계산
  const levels = computeLevels(nodes, edges);

  // 2. 레이아웃 타입별 분기
  if (layout === 'radial') {
    applyRadialLayout(nodes, levels);
  } else {
    applyHorizontalLayout(nodes, levels);
  }
}
```

**Radial 알고리즘:**
- 중심점: (500, 500)
- 레벨 0 반지름: 0 (중심)
- 레벨당 반지름: 해당 레벨 최대 노드 높이 + 40px 여유 (누적)
- 형제 간 각도: 360° / 형제 수 (원주 길이 vs 노드 너비 합계 비교하여 반지름 조정)

**Horizontal 알고리즘:**
- 시작점: (100, 100)
- 레벨 간 X축 간격: 해당 레벨 최대 노드 너비 + 50px 여유 (누적)
- 형제 간 Y축 간격: 각 노드 실제 height + 20px 여유 (누적)

### 충돌 방지 전략

노드 간 충돌을 **사전에 방지**하기 위해 각 노드의 실제 크기(`measuredSize`)를 기반으로 간격을 동적으로 계산한다.

#### 핵심 원리

1. **측정 우선**: 파싱 후 모든 노드의 width/height 측정
2. **동적 간격**: 고정 간격 대신 실제 크기 기반 계산
3. **누적 배치**: 이전 노드 크기를 고려하여 다음 노드 위치 결정
4. **수학적 보장**: 충돌이 수학적으로 불가능하도록 설계

#### Radial Layout 충돌 방지

```typescript
// 1. 레벨별 최대 노드 높이 계산
const maxHeightPerLevel = new Map<number, number>();
for (const node of nodes) {
  const level = levels.get(node.id);
  const height = node.measuredSize?.height || 80;
  maxHeightPerLevel.set(level, Math.max(
    maxHeightPerLevel.get(level) || 0,
    height
  ));
}

// 2. 레벨별 반지름 누적 계산
let radius = 0;
const levelRadii = new Map<number, number>();
for (const [level, maxHeight] of maxHeightPerLevel) {
  radius += maxHeight + 40; // 레벨 간 여유 40px
  levelRadii.set(level, radius);
}

// 3. 원주에 노드가 겹치지 않도록 반지름 조정
const circumference = 2 * Math.PI * radius;
const totalNodesWidth = sum(levelNodes.map(n => n.measuredSize.width + 20));
if (totalNodesWidth > circumference) {
  radius = totalNodesWidth / (2 * Math.PI);
}
```

**결과**: 같은 레벨의 노드들이 원주 위에서 절대 겹치지 않음.

#### Horizontal Layout 충돌 방지

```typescript
// Y축: 형제 노드들의 실제 높이 누적
let currentY = START_Y;
for (const node of levelNodes) {
  node.position.y = currentY;
  currentY += (node.measuredSize?.height || 80) + 20; // 여유 20px
}

// X축: 레벨별 최대 노드 너비 기반
const maxWidthPerLevel = new Map<number, number>();
// ... 각 레벨의 최대 width 계산
let currentX = START_X;
for (const level of sortedLevels) {
  const maxWidth = maxWidthPerLevel.get(level) || 200;
  // 이 레벨의 모든 노드를 currentX에 배치
  currentX += maxWidth + 50; // 다음 레벨로 이동
}
```

**결과**: 모든 노드가 겹치지 않는 그리드 형태로 배치됨.

#### 성능 특성

- **시간 복잡도**: O(n) - 노드 순회 1회
- **단일 패스**: 조정 루프 불필요
- **측정 비용**: DOM 렌더링 후 getBoundingClientRect() 1회/노드
- **대용량**: 노드 100개 기준 <50ms 예상

### 사용자 레이아웃 전환

Canvas 상단에 레이아웃 선택 버튼 제공:
- 🌟 Radial
- ➡️ Horizontal

레이아웃 변경 시:
1. 자동으로 모든 노드 위치 재계산
2. 애니메이션으로 부드럽게 이동 (선택)
3. 마크다운 파일에 `<!-- knotly-layout: ... -->` 업데이트
4. 자동 저장

---

## UI/UX 설계

### 분할 화면 레이아웃

```
┌────────────────────────────────────────────┐
│         Title Bar (File name, Save)       │
├──────────────────┬─────────────────────────┤
│                  │  🌟 Radial  ➡️ Horiz.  │← Layout Selector
│   Markdown       ├─────────────────────────┤
│   Editor         │     Mind Map            │
│                  │     Canvas              │
│  - Syntax HL     │                         │
│  - Line numbers  │  - Nodes/Edges          │
│  - Auto-save     │  - Zoom/Pan             │
│                  │  - Auto-layout          │
│                  │  - Edit on double-click │
│  (30-70%)        │  (30-70%)               │
│                  │                         │
└──────────────────┴─────────────────────────┘
    ↕ Resizable Divider
```

### 캔버스 노드 타입별 렌더링

#### 1. TextNode / HeaderNode
- 기존과 동일 (손글씨 스타일)
- 헤더는 fontSize 자동 확대

#### 2. CodeNode (미리보기 + 확장)
```
┌────────────────────────┐
│ 📄 javascript         ▼│ ← 언어 뱃지 + 확장 버튼
│ function hello() {...  │ ← 첫 줄 미리보기
│ [Click to expand]      │
└────────────────────────┘

[확장 시]
┌────────────────────────┐
│ 📄 javascript         ▲│
│ function hello() {     │
│   console.log("hi");   │
│ }                      │
└────────────────────────┘
```

#### 3. ImageNode
```
┌────────────────────────┐
│  [이미지 썸네일]        │
│  Alt: 다이어그램        │
└────────────────────────┘
```

---

## 양방향 동기화

### 에디터 → 캔버스

**트리거**: 텍스트 변경 (300ms debounce)

**플로우**:
1. 마크다운 텍스트 변경 감지
2. `MarkdownParser.parse(text)` 실행
3. `{nodes, edges}` 생성
4. Zustand store 업데이트
5. 캔버스 자동 재렌더링

### 캔버스 → 에디터

**트리거**: 노드/엣지 변경 (드래그, 편집, 삭제 등)

**플로우**:
1. canvasStore 변경 감지 (Zustand subscribe)
2. `MarkdownSerializer.serialize(nodes, edges)` 실행
3. 마크다운 텍스트 생성
4. 에디터 텍스트 업데이트
5. 커서 위치 보존 (현재 편집 줄 기억)

### 순환 업데이트 방지

```typescript
let isDirty = false; // 동기화 플래그

// 에디터 → 캔버스
function handleEditorChange(text: string) {
  if (isDirty) return;
  isDirty = true;

  const {nodes, edges} = parseMarkdown(text);
  updateStore(nodes, edges);

  isDirty = false;
}

// 캔버스 → 에디터
function handleCanvasChange(nodes, edges) {
  if (isDirty) return;
  isDirty = true;

  const text = serializeToMarkdown(nodes, edges);
  updateEditor(text);

  isDirty = false;
}
```

---

## 기술 스택

### 필수 라이브러리

1. **마크다운 파서**
   - `marked` 또는 `remark`
   - 토큰 스트림 기반 파싱

2. **Split Pane**
   - `react-split-pane` 또는 직접 구현
   - Resizable divider

3. **코드 하이라이팅** (선택)
   - `prism.js` 또는 `highlight.js`
   - 코드 블록 구문 강조

4. **마크다운 에디터** (선택)
   - `@codemirror/basic-setup` (고급)
   - `<textarea>` (간단)

---

## 구현 단계

### Phase 1: Repository Layer (2.5일)
**파일**: `src/repository/markdownParser.ts`, `markdownSerializer.ts`, `layoutEngine.ts`

- MarkdownParser 구현
  - 헤더 파싱
  - 리스트 파싱 (들여쓰기 계층)
  - 코드 블록 파싱
  - 이미지 파싱
  - 그룹 파싱 (---)
  - {.token} 스타일 파싱
  - 레이아웃 메타데이터 파싱

- MarkdownSerializer 구현
  - Node[] → 마크다운 변환
  - 계층 구조 재구성
  - 들여쓰기 생성
  - 스타일 토큰 복원
  - 레이아웃 메타데이터 삽입

- LayoutEngine 구현
  - BFS 레벨 계산
  - Radial 레이아웃 알고리즘
  - Horizontal 레이아웃 알고리즘

### Phase 2: Split Layout (1일)
**파일**: `src/components/SplitLayout.tsx`, `LayoutSelector.tsx`

- Resizable split pane 구현
- 좌측: MarkdownEditor 영역
- 우측: Canvas 영역 + LayoutSelector
- LocalStorage에 비율 저장
- LayoutSelector UI (Radial/Horizontal 버튼)

### Phase 3: Markdown Editor (1일)
**파일**: `src/components/MarkdownEditor.tsx`

- 기본 textarea 또는 CodeMirror
- 실시간 입력 처리 (debounce)
- 구문 하이라이팅 (선택)
- 자동 저장

### Phase 4: Canvas 노드 타입 확장 (2일)
**파일**: `src/components/nodes/`

- CodeNode 컴포넌트 (미리보기 + 확장)
- ImageNode 컴포넌트
- HeaderNode 스타일 개선
- NodeComponent 타입별 분기

### Phase 5: 양방향 동기화 (2일)
**파일**: Zustand store, 에디터/캔버스 연결

- 에디터 → 캔버스 동기화
- 캔버스 → 에디터 동기화
- 순환 업데이트 방지
- 커서 위치 보존

### Phase 6: 파일 I/O 업데이트 (1일)
**파일**: `src/utils/fileIO.ts`

- YAML frontmatter 제거
- 순수 마크다운 읽기/쓰기
- .md 확장자 전환
- 기존 .knotly 파일 자동 변환 (마이그레이션)

---

## 예상 효과

### 장점

1. ✅ **키보드 중심 워크플로우**
   - 텍스트 입력이 가장 빠름
   - 마크다운 익숙한 사용자 친화적

2. ✅ **표준 마크다운 호환**
   - 다른 도구와 연동 가능
   - Git diff/merge 가능
   - Obsidian, Notion 등과 호환

3. ✅ **리치 콘텐츠 지원**
   - 코드 블록 (구문 강조)
   - 이미지 임베딩
   - 이모지, 인라인 코드

4. ✅ **유지보수성**
   - Repository Layer로 포맷 변경 용이
   - 파서/시리얼라이저 분리로 테스트 가능

5. ✅ **하이브리드 편집**
   - 에디터: 빠른 입력
   - 캔버스: 시각적 구조 파악
   - 양방향 동시 사용

### 단점

1. ⚠️ **복잡도 증가**
   - 양방향 동기화 로직 필요
   - 순환 업데이트 방지 필요

2. ⚠️ **파싱 오버헤드**
   - 실시간 파싱 성능 고려
   - Debounce로 완화

3. ⚠️ **마크다운 제약**
   - 순수 마크다운으로 표현 가능한 구조만 지원
   - 복잡한 레이아웃은 제한적

---

## 성공 지표

### MVP 기준

1. ✅ 마크다운 텍스트 입력 → 마인드맵 렌더링
2. ✅ 마인드맵 편집 → 마크다운 텍스트 업데이트
3. ✅ 헤더, 리스트, 코드, 이미지 모든 타입 지원
4. ✅ 분할 화면 레이아웃 (resizable)
5. ✅ 파일 저장/로드 (.md 포맷)

### 확장 기능

1. 🔮 실시간 협업 (이후 milestone)
2. 🔮 버전 히스토리 (Git 통합)
3. 🔮 플러그인 시스템
4. 🔮 커스텀 테마

---

## 참고 사례

- **Obsidian**: 마크다운 기반, 그래프 뷰
- **Logseq**: 아웃라이너 + 그래프
- **Notion**: 블록 기반 에디터
- **Roam Research**: 양방향 링크

---

## 다음 단계

1. **프로토타입 검증**: MarkdownParser 기본 구현 테스트
2. **UI 목업**: Figma로 레이아웃 디자인
3. **기술 선택**: 마크다운 파서 라이브러리 평가
4. **개발 시작**: Phase 1부터 순차 구현
