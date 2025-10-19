# Prototype v2: 마크다운 파일 기반 마인드맵 노트앱

## 📋 개요

**목표**: 손글씨 노트 감성을 살린 마크다운 파일 기반 마인드맵 노트앱 프로토타입 구현

## 💡 비즈니스 가치

### 왜 이 기능이 필요한가?

기존 마인드맵 도구들은 **클라우드 종속**, **복잡한 UI**, **벤더 락인** 문제를 가지고 있습니다. Knotly v2는 이러한 문제를 해결하기 위해:

1. **파일 기반**: 로컬 마크다운 파일로 저장 → 완전한 소유권
2. **텍스트 편집 가능**: 어떤 에디터로든 직접 편집 가능
3. **미니멀 UX**: 아날로그 노트 감성, 텍스트 위주
4. **조합형 스타일**: Tailwind 스타일 토큰 시스템

### 핵심 차별점

1. **`.knotly.md` 파일 포맷**: YAML frontmatter + 마크다운 조합
2. **조합형 토큰 시스템**:
   - 직접 조합: `"color-blue h3 bold sketchy"`
   - 완성형 토큰: tokens 섹션에서 테마 정의 (A + B = C)
3. **손글씨 감성**: rough.js로 아날로그 노트 느낌 유지
4. **서버 불필요**: 100% 클라이언트 사이드, 로컬 파일 I/O

## 📄 데이터 포맷

### 파일 구조: `.knotly.md`

```markdown
---
# 스타일 토큰 정의 (Tailwind 스타일 + 조합형)
tokens:
  # 원자적 토큰
  color-magenta: { stroke: '#db2777', fill: '#fce7f3' }
  color-blue: { stroke: '#2563eb', fill: '#dbeafe' }
  h1: { width: 320, height: 200, fontSize: 24 }
  h3: { width: 240, height: 160, fontSize: 18 }
  h5: { width: 180, height: 120, fontSize: 14 }
  bold: { strokeWidth: 3 }
  sketchy: { roughness: 2.5 }
  smooth: { roughness: 0.8 }
  thick: { strokeWidth: 4 }

  # 완성형 조합 토큰 (테마)
  main-heading: "color-blue h3 bold sketchy"
  sub-note: "color-magenta h5 smooth"

# 노드 정의 (위치 + 스타일)
nodes:
  - id: n1
    pos: [100, 200]
    style: "sub-note"               # 완성형 토큰

  - id: n2
    pos: [400, 200]
    style: "main-heading"           # 완성형 토큰

  - id: n3
    pos: [250, 400]
    style: "color-magenta h5 thick" # 직접 조합

# 연결 정의
edges:
  - [n1, n2]
  - [n1, n3]
---

[n1]
프로젝트 아이디어
마인드맵 노트앱

[n2]
핵심 기능
- 파일 기반
- 조합형 스타일

[n3]
기술 스택
React + rough.js
```

### 토큰 카테고리

#### 1. 색상 토큰 (`color-*`)
- `color-blue`, `color-red`, `color-mint`, `color-yellow`, `color-gray`
- 각 토큰은 `stroke`(테두리)와 `fill`(배경) 색상 포함

#### 2. 크기 토큰 (`h1`~`h6`)
- HTML 헤딩 스타일 차용
- `width`, `height`, `fontSize` 속성 포함

#### 3. 손글씨 느낌 (`roughness`)
- `smooth`, `neat`, `rough`, `sketchy`, `messy`
- rough.js의 `roughness` 값 제어 (0.5 ~ 2.5)

#### 4. 테두리 토큰
- `thin`, `normal`, `thick`, `bold` (strokeWidth)
- `dashed`, `solid` (strokeStyle)

### 조합 방식

#### 방법 1: 노드에서 직접 조합
```yaml
nodes:
  - id: n1
    style: "color-blue h3 bold sketchy"
```

파싱 결과:
```typescript
{
  stroke: '#2563eb',      // color-blue
  fill: '#dbeafe',        // color-blue
  width: 240,             // h3
  height: 160,            // h3
  fontSize: 18,           // h3
  fontWeight: 700,        // bold
  roughness: 2.0          // sketchy
}
```

#### 방법 2: tokens 안에서 완성형 토큰 정의

**A 조합 + B 조합 = C 조합 가능!**

```yaml
tokens:
  # 원자적 토큰 (atomic tokens)
  color-blue: { stroke: '#2563eb', fill: '#dbeafe' }
  color-purple: { stroke: '#7c3aed', fill: '#ede9fe' }
  h3: { width: 240, height: 160, fontSize: 18 }
  h4: { width: 200, height: 140, fontSize: 16 }
  bold: { strokeWidth: 3 }
  neat: { roughness: 1.0 }

  # 조합형 완성 토큰 (composite tokens) - 문자열 조합 방식
  heading-primary: "color-blue h3 bold neat"
  heading-secondary: "color-purple h4 neat"

  # 조합형 완성 토큰 - 병합된 속성 방식
  important-note:
    stroke: '#dc2626'
    fill: '#fee2e2'
    width: 280
    height: 180
    fontSize: 20
    strokeWidth: 4
    roughness: 2.5

nodes:
  - id: n1
    style: "heading-primary"        # 완성형 토큰 사용

  - id: n2
    style: "heading-secondary"      # 또 다른 완성형 토큰

  - id: n3
    style: "important-note"         # 속성 병합 방식
```

**장점**:
- **재사용성**: 자주 쓰는 조합을 이름으로 저장
- **일관성**: 파일 내에서 통일된 스타일 팔레트
- **테마 시스템**: tokens 섹션이 테마 정의의 역할
- **유연성**: 원자적 조합과 완성형 토큰을 혼용 가능

**예시: 프로젝트별 테마**
```yaml
tokens:
  # 회사 브랜드 색상
  brand-primary: { stroke: '#FF6B35', fill: '#FFE5DD' }
  brand-accent: { stroke: '#004E89', fill: '#D4E9F7' }

  # 프로젝트 스타일 정의
  title: "brand-primary h2 bold neat"
  content: "brand-accent h4 neat"
  note:
    stroke: '#64748b'
    fill: '#f1f5f9'
    width: 150
    height: 100
    fontSize: 12
    roughness: 0.8
```

**충돌 해결**: 마지막 토큰이 우선순위

## 📖 사용자 스토리

### Story 1: 파일 열기/새로 만들기
```
As a 사용자
I want to 마크다운 파일을 열거나 새로 만들 수 있어야
So that 내 노트를 로컬 파일로 관리할 수 있다
```

**수용 기준**:
- 시작 화면에서 "새 노트 만들기" 버튼 클릭 시 빈 캔버스 생성
- "파일 열기" 버튼으로 `.knotly.md` 파일 선택 가능
- 드래그 앤 드롭으로 파일 로드 가능
- 최근 파일 목록 표시 (로컬스토리지)

### Story 2: 노드 생성 및 텍스트 입력
```
As a 사용자
I want to 캔버스 아무 곳이나 더블클릭/터치하여 노드를 생성하고 텍스트를 입력할 수 있어야
So that 화이트보드처럼 직관적으로 아이디어를 기록할 수 있다
```

**수용 기준**:
- 캔버스 빈 공간을 더블클릭/더블터치하면 해당 지점에 노드 생성
- 노드 생성 즉시 텍스트 입력 모드로 전환
- 여러 줄 텍스트 입력 가능
- 크기는 자동 계산 (토큰 기반)

### Story 3: 스타일 변경
```
As a 사용자
I want to 노드 스타일을 조합형 토큰으로 변경할 수 있어야
So that 노드를 시각적으로 구분할 수 있다
```

**수용 기준**:
- 노드 우클릭 → "스타일 변경" 메뉴
- 색상, 크기, 느낌, 테두리 카테고리별 버튼
- 실시간 미리보기
- 현재 조합 문자열 표시 (예: `"color-blue h4 neat"`)

### Story 4: 연결 만들기
```
As a 사용자
I want to 노드 간 연결을 직관적으로 만들 수 있어야
So that 아이디어 간 관계를 빠르게 표현할 수 있다
```

**수용 기준 (시나리오 1: 새 노드 생성 시 자동 연결)**:
- 노드 A가 선택된 상태에서 빈 공간 더블클릭/터치
- 새 노드 B 생성 + A→B 자동 연결 + 포커스 이동
- 연속으로 노드를 확장하며 마인드맵 작성 가능

**수용 기준 (시나리오 2: 기존 노드 연결)**:
- **데스크톱**: 노드 A 가장자리 드래그 → 노드 B 드롭 → 연결 생성
- **모바일**: 노드 A 롱프레스 → 연결 대기 상태 → 노드 B 탭 → 연결 생성
- rough.js 스타일 점선
- 중복 연결 방지

### Story 5: 파일 저장
```
As a 사용자
I want to 현재 상태를 마크다운 파일로 저장할 수 있어야
So that 나중에 다시 열 수 있다
```

**수용 기준**:
- Cmd/Ctrl + S 단축키
- Zustand store → 마크다운 변환
- File System Access API로 파일 저장
- 파일명 + 저장 상태 표시 (변경됨/저장됨)

### Story 6: 텍스트 에디터로 편집
```
As a 고급 사용자
I want to 텍스트 에디터에서 파일을 직접 편집할 수 있어야
So that 대량 수정이나 토큰 추가를 빠르게 할 수 있다
```

**수용 기준**:
- `.knotly.md` 파일을 VS Code/Vim 등에서 열기
- YAML frontmatter에서 토큰 정의 수정
- 노드 내용 직접 편집
- 앱에서 다시 로드 시 변경사항 반영

## ✅ 성공 지표

### 완료 조건
- [ ] 마크다운 파일 파싱 (YAML → Zustand)
- [ ] Zustand → 마크다운 직렬화
- [ ] 조합형 토큰 파서 구현
- [ ] 스타일 선택 UI 구현
- [ ] File System Access API 연동
- [ ] 드래그 앤 드롭 파일 로드
- [ ] 시작 화면 구현
- [ ] 파일명 + 저장 상태 표시

### 데모 시나리오
1. 앱 실행 → 시작 화면
2. "새 노트 만들기" → 빈 캔버스
3. 캔버스를 더블클릭하여 첫 노드 생성 (자동으로 텍스트 입력 모드)
4. 첫 노드 선택된 상태에서 빈 공간 더블클릭 → 두 번째 노드 생성 + 자동 연결
5. 두 번째 노드에서 다시 빈 공간 더블클릭 → 세 번째 노드 생성 + 자동 연결
6. 노드 우클릭 → 스타일 변경 (조합 선택)
7. 기존 노드 가장자리 드래그 → 다른 노드로 연결 (추가 연결)
8. Cmd+S → `my-note.knotly.md` 저장
9. 텍스트 에디터로 파일 열어서 토큰 추가
10. 앱에서 파일 다시 열기 → 변경사항 반영

## 🎨 UI/UX 요구사항

### 시작 화면
```
┌─────────────────────────────┐
│   Knotly - 마인드맵 노트    │
├─────────────────────────────┤
│                             │
│   [📄 새 노트 만들기]       │
│                             │
│   [📂 파일 열기]            │
│                             │
│   최근 파일:                │
│   • project-ideas.knotly.md │
│   • study-plan.knotly.md    │
│                             │
│   또는 파일을 드래그하세요   │
│                             │
└─────────────────────────────┘
```

### 캔버스 화면
- 상단: 파일명 + 저장 상태 (● 변경됨 / ✓ 저장됨)
- 좌측 상단: 설정 버튼 (그리드, 스냅)
- 캔버스: 더블클릭/터치로 노드 생성, 드래그로 연결

### 스타일 선택 패널
```
┌──────────────────────────────┐
│  스타일 선택                 │
├──────────────────────────────┤
│ Colors:                      │
│ [blue] [red] [mint] [yellow] │
│                              │
│ Sizes:                       │
│ [h2] [h3] [h4] [h5] [h6]     │
│                              │
│ Feel:                        │
│ [smooth] [neat] [sketchy]    │
│                              │
│ Border:                      │
│ [thin] [normal] [thick]      │
│                              │
│ 현재: color-blue h4 neat     │
└──────────────────────────────┘
```

### 반응형
- 데스크톱 우선 (1440px+)
- 모바일은 추후 고려

## 🚫 제약사항

### 이 단계에서 제외되는 것
- ❌ 복잡한 텍스트 서식 (볼드, 이탤릭)
- ❌ 이미지/첨부파일
- ❌ 실시간 협업
- ❌ 클라우드 동기화
- ❌ 검색/필터 기능
- ❌ 무한 되돌리기/다시하기
- ❌ 노드 그룹화
- ❌ 멀티 선택
- ❌ 커스텀 테마 편집기 (토큰은 텍스트로 편집)

### 기술적 제약
- 프론트엔드만 작업 (백엔드 없음)
- File System Access API (Chromium 기반 브라우저만)
- 로컬 파일 저장만 지원 (클라우드 X)

## 📦 기술 스택

### 유지
- React 18 + TypeScript 5.x
- Vite 5.x
- rough.js ^4.6.6
- Zustand 5.x (메모리 상태)
- @use-gesture/react
- Tailwind CSS 4.x

### 추가
- `js-yaml` - YAML frontmatter 파싱
- File System Access API - 브라우저 네이티브 파일 I/O

## 📊 KPI

### 정량적 지표
- **파일 로딩 시간**: < 100ms (10KB 파일 기준)
- **저장 시간**: < 50ms
- **렌더링 성능**: 60fps 유지
- **토큰 파싱 시간**: < 10ms

### 정성적 지표
- 마크다운 파일이 **인간이 읽을 수 있는가**
- 텍스트 에디터로 **편집이 쉬운가**
- 스타일 조합이 **직관적인가**
- 손글씨 감성이 **유지되는가**

## 📁 파일 예시

### 완성된 `.knotly.md` 파일 (조합형 토큰 활용)

```markdown
---
tokens:
  # 원자적 토큰 (기본 빌딩 블록)
  color-blue: { stroke: '#2563eb', fill: '#dbeafe' }
  color-mint: { stroke: '#059669', fill: '#d1fae5' }
  color-yellow: { stroke: '#ca8a04', fill: '#fef9c3' }
  h3: { width: 240, height: 160, fontSize: 18 }
  h4: { width: 200, height: 140, fontSize: 16 }
  h5: { width: 180, height: 120, fontSize: 14 }
  bold: { strokeWidth: 3 }
  neat: { roughness: 1.0 }

  # 완성형 토큰 (프로젝트 테마)
  main-idea: "color-blue h3 bold neat"
  sub-idea: "color-mint h4 neat"
  tech-note:
    stroke: '#ca8a04'
    fill: '#fef9c3'
    width: 180
    height: 120
    fontSize: 14
    roughness: 1.0

nodes:
  - id: n1
    pos: [300, 200]
    style: "main-idea"          # 완성형 토큰 사용

  - id: n2
    pos: [600, 200]
    style: "sub-idea"           # 완성형 토큰 사용

  - id: n3
    pos: [450, 400]
    style: "tech-note"          # 완성형 토큰 사용

edges:
  - [n1, n2]
  - [n1, n3]
---

[n1]
프로젝트 아이디어
마인드맵 노트앱 만들기

[n2]
핵심 기능
- 파일 기반
- 조합형 스타일
- 손글씨 감성

[n3]
기술 스택
React + TypeScript
rough.js + Zustand
```

### 다른 예시: 직접 조합 vs 완성형 토큰 혼용

```markdown
---
tokens:
  # 기본 토큰
  color-red: { stroke: '#dc2626', fill: '#fee2e2' }
  h2: { width: 280, height: 180, fontSize: 20 }
  sketchy: { roughness: 2.5 }

  # 완성형 테마
  urgent: "color-red h2 sketchy"

nodes:
  - id: n1
    style: "urgent"                   # 완성형 토큰

  - id: n2
    style: "color-blue h4 neat"       # 직접 조합
---
```

## 🎯 MVP 핵심 작업

### Phase 1: 파일 I/O 시스템
1. YAML frontmatter 파서 구현
2. 마크다운 → Zustand store 변환
3. Zustand store → 마크다운 직렬화
4. File System Access API 통합
5. 드래그 앤 드롭 핸들러

### Phase 2: 조합형 토큰 시스템
1. 토큰 정의 타입 (`TokenDefinition`)
2. 토큰 파서 (`"color-blue h3"` → 스타일 객체)
3. 토큰 병합 알고리즘
4. 기본 토큰 라이브러리 (8 colors, 6 sizes, 5 feels)
5. 노드 렌더링에 토큰 스타일 적용

### Phase 3: 스타일 편집 UI
1. 스타일 선택 패널 컴포넌트
2. 카테고리별 버튼 렌더링
3. 실시간 미리보기
4. 조합 문자열 표시

### Phase 4: 파일 관리 UX
1. 시작 화면 컴포넌트
2. 새 노트 / 파일 열기 플로우
3. 파일명 + 저장 상태 표시
4. 최근 파일 목록 (로컬스토리지)
5. Cmd+S 단축키

### Phase 5: 기존 기능 유지 및 연결 방식 개선
1. 노드 CRUD (생성, 편집, 삭제)
2. 드래그 앤 드롭 이동
3. 노드 연결 (자동 연결 + 드래그 방식)
4. 캔버스 줌/팬
5. rough.js 렌더링

## 🚀 다음 단계

이 프로토타입이 완성되면:
1. **사용자 테스트**: 10명에게 사용해보게 하고 피드백 수집
2. **파일 포맷 검증**: 다양한 에디터에서 편집 가능한지 확인
3. **토큰 시스템 개선**: 부족한 토큰 추가, 명명 규칙 정리
4. **다음 기능 결정**: 검색, 태그, 폴더 구조 등
