# Markdown Split Editor with Mind Map - 구현 계획

## 기술 스택

- **마크다운 파서**: `marked` 또는 `remark`
- **Split Pane**: `react-split-pane` 또는 직접 구현
- **코드 하이라이팅** (선택): `prism.js` / `highlight.js`
- **에디터** (선택): `@codemirror/basic-setup` / `<textarea>`
- **기존**: React 18, TypeScript 5.x strict, Zustand, rough.js, Tailwind 3.x

## 아키텍처 개요

기존 3계층에 **Repository Layer** 추가 → 4계층 구조:
```
UI (SplitLayout: Editor 30-70% | Canvas 30-70%)
 ↓
Application (Zustand canvasStore: nodes[], edges[])
 ↓
Repository (MarkdownParser, MarkdownSerializer, LayoutEngine) ← NEW
 ↓
File (.md 순수 마크다운)
```

## Node 타입 정의 확장

```typescript
interface Node {
  id: string;
  type: 'text' | 'header' | 'code' | 'image'; // NEW
  content: string;
  level?: number; // NEW: 헤더 1-6, 리스트 깊이
  language?: string; // NEW: 코드 언어
  imageUrl?: string; // NEW
  altText?: string; // NEW
  groupId?: string; // NEW: --- 구분자
  style: string;
  position: { x: number; y: number };
  measuredSize?: { width: number; height: number };
}
```

## MarkdownParser 구현

**파일**: `src/repository/markdownParser.ts`

### 핵심 구조

```typescript
export type LayoutType = 'radial' | 'horizontal';

export function parseMarkdown(text: string): {
  nodes: Node[]; edges: Edge[]; layout: LayoutType;
} {
  // 1. 레이아웃 메타데이터 파싱
  const layoutMatch = text.match(/<!--\s*knotly-layout:\s*(\w+)\s*-->/);
  const layout: LayoutType = layoutMatch?.[1] === 'horizontal' ? 'horizontal' : 'radial';

  // 2. marked.lexer()로 토큰 파싱
  const tokens = marked.lexer(text);
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let currentGroupId: string | undefined;
  const nodeStack: string[] = []; // 헤더 계층 추적
  let lastParentId: string | null = null; // 코드/이미지 부모

  // 3. 토큰별 파싱 (아래 패턴)
  for (const token of tokens) { /* ... */ }

  // 4. 레이아웃 적용
  applyLayout(nodes, edges, layout);
  return { nodes, edges, layout };
}
```

### 파싱 공통 패턴

**모든 토큰 타입 공통 플로우**:
1. 토큰 → Node 변환 (`type`, `content`, `level`, `style`)
2. 부모 찾기 (nodeStack / lastParentId)
3. Edge 생성
4. 스택 업데이트

#### 헤더 (`token.type === 'heading'`)
- `level = depth` (1-6)
- 부모: `nodeStack`에서 `depth - 1` 찾기
- Edge: `parentId → nodeId`
- 스택: 현재 레벨 이상 제거 후 `nodeId` 추가
- `lastParentId = nodeId` (코드/이미지 부모로 설정)

#### 리스트 (`token.type === 'list'`)
- `level = 들여쓰기 깊이`
- 부모: `listStack[depth - 1]`
- 재귀: `item.items` 순회하며 중첩 리스트 처리
- `lastParentId = nodeId` (마지막 항목)

#### 코드 블록 (`token.type === 'code'`)
- `type: 'code'`, `language: lang`, `content: text`
- 스타일: `token.raw`에서 `{.token}` regex 추출
- **컨텍스트 기반 부모**: `if (lastParentId) edge 생성`
- 부모 없으면 루트 노드

#### 이미지 (`token.type === 'image'`)
- `type: 'image'`, `imageUrl: href`, `altText: text`
- 코드 블록과 동일: `lastParentId` 사용

#### 그룹 (`token.type === 'hr'`)
- `currentGroupId = generateId()` (새 그룹 시작)

#### 스타일 토큰 추출
```typescript
function extractStyleTokens(text: string) {
  const styleMatch = text.match(/\{(\.[\w-]+(?:\s+\.[\w-]+)*)\}/);
  const style = styleMatch ? styleMatch[1].replace(/\./g, '').replace(/\s+/g, ' ') : '';
  const content = text.replace(/\{\.[\w-]+(?:\s+\.[\w-]+)*\}/g, '').trim();
  return { content, style };
}
```

## LayoutEngine 구현

**파일**: `src/repository/layoutEngine.ts`

### BFS 레벨 계산

```typescript
export function computeLevels(nodes: Node[], edges: Edge[]): Map<string, number> {
  // 1. 루트 노드 찾기: edges에서 targetId가 아닌 노드
  // 2. BFS 큐: { id, level } 초기화
  // 3. 방문하며 levels.set(id, level)
  // 4. 자식 enqueue: edges.filter(e => e.sourceId === id)
}
```

### Radial 레이아웃 (충돌 방지)

**핵심 로직**:
```typescript
// 1. 레벨별 최대 높이
maxHeightPerLevel[level] = max(nodes.map(n => n.measuredSize.height))

// 2. 레벨별 반지름 누적
levelRadii[i] = sum(maxHeightPerLevel[0..i]) + LEVEL_PADDING * i

// 3. 원주 길이 확인
circumference = 2 * π * radius
totalNodesWidth = sum(nodes.map(n => n.width + NODE_PADDING))
if (totalNodesWidth > circumference) {
  radius = totalNodesWidth / (2 * π)
}

// 4. 각도 균등 배치
angleStep = 2π / levelNodes.length
position = { x: CENTER_X + radius * cos(angle), y: CENTER_Y + radius * sin(angle) }
```

**파라미터**:
- `CENTER: (500, 500)`
- `LEVEL_PADDING: 40px`
- `NODE_PADDING: 20px`

### Horizontal 레이아웃 (충돌 방지)

**핵심 로직**:
```typescript
// 1. 레벨별 최대 너비
maxWidthPerLevel[level] = max(nodes.map(n => n.measuredSize.width))

// 2. X축 누적
levelX[i] = sum(maxWidthPerLevel[0..i-1]) + LEVEL_PADDING_X * i

// 3. Y축 누적 (레벨 내)
currentY = START_Y
for (node of levelNodes) {
  node.position.y = currentY
  currentY += node.measuredSize.height + NODE_PADDING_Y
}
```

**파라미터**:
- `START: (100, 100)`
- `LEVEL_PADDING_X: 50px`
- `NODE_PADDING_Y: 20px`

**충돌 방지 보장**: measuredSize 기반 누적이므로 수학적으로 충돌 불가능.

## MarkdownSerializer 구현

**파일**: `src/repository/markdownSerializer.ts`

### 역변환 규칙

```typescript
export function serializeToMarkdown(nodes: Node[], edges: Edge[], layout: LayoutType): string {
  // 1. 레이아웃 메타데이터
  lines.push(`<!-- knotly-layout: ${layout} -->`);

  // 2. 그룹별 노드 분류 (groupId)
  // 3. 그룹 구분자 ---
  // 4. 노드 타입별 직렬화:
  //    - header: '#'.repeat(level) + content + styleToken
  //    - code: ```language styleToken\ncontent\n```
  //    - image: ![altText](imageUrl) styleToken
  //    - text: '  '.repeat(level) + '- ' + content + styleToken
  // 5. 스타일 토큰 복원: style.split(' ').join(' .')
}
```

**참고**: 자유 연결(링크 버튼 🔗)은 마크다운에 저장 안 함.

## UI 컴포넌트 구현

### LayoutSelector

**파일**: `src/components/LayoutSelector.tsx`

```typescript
export function LayoutSelector() {
  const layout = useCanvasStore(state => state.layout);
  const setLayout = useCanvasStore(state => state.setLayout);

  const handleLayoutChange = (newLayout: LayoutType) => {
    setLayout(newLayout);
    applyLayout(nodes, edges, newLayout); // 전체 재계산
  };

  // UI: 🌟 Radial / ➡️ Horizontal 버튼
}
```

### SplitLayout

**파일**: `src/components/SplitLayout.tsx`

```typescript
export function SplitLayout() {
  const [leftWidth, setLeftWidth] = useState(50); // LocalStorage 복원

  // Resizable divider: onMouseDown → onMouseMove (30-70% clamp)
  // Layout: <Editor> | <Divider> | <LayoutSelector + Canvas>
}
```

### MarkdownEditor

**파일**: `src/components/MarkdownEditor.tsx`

```typescript
export function MarkdownEditor() {
  const [text, setText] = useState('');
  const isDirtyRef = useRef(false);

  // 에디터 → 캔버스 (300ms debounce)
  useEffect(() => {
    if (isDirtyRef.current) { isDirtyRef.current = false; return; }
    const timer = setTimeout(() => {
      const { nodes, edges } = parseMarkdown(text);
      updateStore(nodes, edges);
      isDirtyRef.current = true;
    }, 300);
  }, [text]);

  // 캔버스 → 에디터
  useEffect(() => {
    if (isDirtyRef.current) { isDirtyRef.current = false; return; }
    const newText = serializeToMarkdown(nodes, edges);
    setText(newText);
    isDirtyRef.current = true;
  }, [nodes, edges]);
}
```

**dirty flag**: 순환 업데이트 방지

### 캔버스 노드 타입별 렌더링

**파일**: `src/components/NodeComponent.tsx` 수정

```typescript
export function NodeComponent({ node }: { node: Node }) {
  switch (node.type) {
    case 'code': return <CodeNode node={node} />;
    case 'image': return <ImageNode node={node} />;
    case 'header': return <HeaderNode node={node} />; // fontSize 확대
    default: return <TextNode node={node} />;
  }
}
```

**CodeNode**: 미리보기 + 확장 토글 (`useState(expanded)`)
**ImageNode**: 썸네일 + alt text

## 파일 I/O 업데이트

**파일**: `src/utils/fileIO.ts`

```typescript
// YAML frontmatter 제거, 순수 .md

export async function loadMarkdownFile(handle) {
  const text = await readFileAsText(handle);
  return parseMarkdown(text);
}

export async function saveMarkdownFile(handle, nodes, edges, layout) {
  const text = serializeToMarkdown(nodes, edges, layout);
  await writeTextToFile(handle, text, '.md');
}
```

## Zustand Store 확장

**파일**: `src/store/canvasStore.ts`

```typescript
interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  layout: LayoutType; // NEW: 'radial' | 'horizontal'
  setLayout: (layout: LayoutType) => void; // NEW
  applyCurrentLayout: () => void; // NEW: 현재 레이아웃 재적용
}

// default layout: 'radial'
```

## 기술적 제약사항

- **300ms debounce**: 에디터 입력마다 파싱 → 성능 저하
- **dirty flag**: 순환 업데이트 방지 (`isDirtyRef`)
- **커서 보존**: `selectionStart`, `selectionEnd` 저장/복원
- **파싱 오류**: 에러 시 이전 상태 유지 + 사용자 알림
- **리스트 제한**: 5레벨 이상 성능 고려
- **레이아웃 성능**: 노드 많으면 애니메이션 생략

## 참고 자료

- **marked.js**: https://marked.js.org/
- **remark**: https://remark.js.org/
- **react-split-pane**: https://github.com/tomkp/react-split-pane
- **Obsidian 마크다운**: https://help.obsidian.md/
- **CommonMark**: HTML 주석 허용
