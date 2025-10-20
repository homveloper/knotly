# Markdown Split Editor with Mind Map - 구현 계획

## 기술 스택

- **마크다운 파서**: `marked` 또는 `remark` (토큰 스트림 기반 파싱, AST 순회)
- **Split Pane**: `react-split-pane` 또는 직접 구현 (resizable divider)
- **코드 하이라이팅** (선택): `prism.js` 또는 `highlight.js`
- **마크다운 에디터** (선택): `@codemirror/basic-setup` (고급) 또는 `<textarea>` (간단)
- **기존 스택**: React 18, TypeScript 5.x strict mode, Zustand, rough.js, Tailwind CSS 3.x

## 아키텍처 개요

기존 3계층(UI → Application → File)에 Repository Layer를 추가하여 4계층 구조로 확장한다. Repository Layer는 애플리케이션 모델(Node[], Edge[])과 파일 포맷(순수 마크다운) 간 변환을 담당하며, MarkdownParser와 MarkdownSerializer로 구성된다. UI Layer는 좌우 분할 화면(SplitLayout)으로 구성되고, 좌측에 MarkdownEditor, 우측에 기존 MindMapCanvas를 배치한다. Application Layer의 Zustand canvasStore는 변경 없이 유지되며, 에디터와 캔버스 모두 이 스토어를 구독한다.

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
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   File Format (.md)                 │
│   - 순수 마크다운 (YAML 제거)      │
└─────────────────────────────────────┘
```

## Node 타입 정의 확장

기존 Node 타입에 `type`, `level`, `language`, `imageUrl`, `altText`, `groupId` 필드를 추가한다.

```typescript
interface Node {
  id: string;
  type: 'text' | 'header' | 'code' | 'image'; // NEW
  content: string;

  // 계층 정보
  level?: number; // NEW: 헤더 1-6, 리스트 들여쓰기 깊이

  // 코드 블록 메타데이터
  language?: string; // NEW: 'javascript', 'python', etc.

  // 이미지 메타데이터
  imageUrl?: string; // NEW
  altText?: string; // NEW

  // 그룹 정보
  groupId?: string; // NEW: --- 구분자로 묶인 그룹

  // 기존 필드
  style: string; // "color-red h3 neat"
  position: { x: number; y: number };
  measuredSize?: { width: number; height: number };
}
```

## MarkdownParser 구현

`src/repository/markdownParser.ts` 파일에 구현한다. `marked` 라이브러리를 사용하여 마크다운을 토큰 스트림으로 파싱하고, 각 토큰을 Node로 변환한다.

### 0. 레이아웃 메타데이터 파싱

```typescript
export type LayoutType = 'radial' | 'horizontal';

export function parseMarkdown(text: string): {
  nodes: Node[];
  edges: Edge[];
  layout: LayoutType;
} {
  // 1. HTML 주석에서 레이아웃 추출
  const layoutMatch = text.match(/<!--\s*knotly-layout:\s*(\w+)\s*-->/);
  const layout: LayoutType = layoutMatch?.[1] === 'horizontal'
    ? 'horizontal'
    : 'radial'; // default

  // 2. 마크다운 파싱
  const tokens = marked.lexer(text);
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let currentGroupId: string | undefined;
  const nodeStack: string[] = [];
  let lastParentId: string | null = null; // 코드/이미지의 부모 추적

  // ... 토큰 파싱 로직 (아래 섹션들)

  // 3. 레이아웃 적용
  applyLayout(nodes, edges, layout);

  return { nodes, edges, layout };
}
```

### 1. 헤더 파싱

```typescript
if (token.type === 'heading') {
  const { text, depth } = token;
  const { content, style } = extractStyleTokens(text);
  const nodeId = generateId();

  nodes.push({
    id: nodeId,
    type: 'header',
    content,
    level: depth,
    style,
    position: estimatePosition(nodes.length),
    groupId: currentGroupId,
  });

  // 부모-자식 엣지 생성
  const parentId = findParentHeader(nodeStack, depth);
  if (parentId) {
    edges.push({ sourceId: parentId, targetId: nodeId });
  }

  // 스택 업데이트 (현재 레벨 이상 제거 후 추가)
  while (nodeStack.length >= depth) {
    nodeStack.pop();
  }
  nodeStack.push(nodeId);

  // 코드/이미지의 부모로 설정
  lastParentId = nodeId;
}
```

### 2. 리스트 파싱

리스트는 들여쓰기 레벨을 `level`로 저장하고, 부모 추적 스택으로 엣지를 생성한다.

```typescript
if (token.type === 'list') {
  const listStack: string[] = [];

  function parseListItem(item: any, depth: number) {
    const { text } = item;
    const { content, style } = extractStyleTokens(text);
    const nodeId = generateId();

    nodes.push({
      id: nodeId,
      type: 'text',
      content,
      level: depth,
      style,
      position: estimatePosition(nodes.length),
      groupId: currentGroupId,
    });

    // 부모 엣지 생성
    const parentId = listStack[depth - 1];
    if (parentId) {
      edges.push({ sourceId: parentId, targetId: nodeId });
    }

    listStack[depth] = nodeId;

    // 코드/이미지의 부모로 설정 (가장 마지막 리스트 항목)
    lastParentId = nodeId;

    // 중첩 리스트 처리
    if (item.items) {
      for (const subItem of item.items) {
        parseListItem(subItem, depth + 1);
      }
    }
  }

  for (const item of token.items) {
    parseListItem(item, 0);
  }
}
```

### 3. 코드 블록 파싱

코드 블록은 바로 위에 있는 헤더 또는 리스트 항목의 자식으로 연결된다.

```typescript
if (token.type === 'code') {
  const { lang, text } = token;
  const { style } = extractStyleTokens(token.raw); // 원본에서 {.token} 추출
  const nodeId = generateId();

  nodes.push({
    id: nodeId,
    type: 'code',
    content: text,
    language: lang || 'plaintext',
    style,
    position: estimatePosition(nodes.length),
    groupId: currentGroupId,
  });

  // 컨텍스트 기반 부모 연결
  if (lastParentId) {
    edges.push({ sourceId: lastParentId, targetId: nodeId });
  }
  // 부모가 없으면 루트 노드 (엣지 생성 안 함)
}
```

**컨텍스트 기반 계층 관계**:
- 헤더 바로 아래 → 헤더의 자식
- 리스트 바로 아래 → 마지막 리스트 항목의 자식
- 파일 최상단 → 부모 없는 루트 노드

### 4. 이미지 파싱

이미지도 코드 블록과 동일하게 컨텍스트 기반으로 부모에 연결된다.

```typescript
if (token.type === 'image') {
  const { href, text } = token; // href = URL, text = alt text
  const { style } = extractStyleTokens(token.raw);
  const nodeId = generateId();

  nodes.push({
    id: nodeId,
    type: 'image',
    content: text,
    imageUrl: href,
    altText: text,
    style,
    position: estimatePosition(nodes.length),
    groupId: currentGroupId,
  });

  // 컨텍스트 기반 부모 연결
  if (lastParentId) {
    edges.push({ sourceId: lastParentId, targetId: nodeId });
  }
  // 부모가 없으면 루트 노드
}
```

### 5. 스타일 토큰 추출

```typescript
/**
 * 텍스트에서 {.token1 .token2} 추출
 * @returns { content: 순수 텍스트, style: "token1 token2" }
 */
function extractStyleTokens(text: string) {
  const styleMatch = text.match(/\{(\.[\w-]+(?:\s+\.[\w-]+)*)\}/);
  const style = styleMatch
    ? styleMatch[1].replace(/\./g, '').replace(/\s+/g, ' ')
    : '';

  const content = text
    .replace(/\{\.[\w-]+(?:\s+\.[\w-]+)*\}/g, '') // 스타일 토큰 제거
    .trim();

  return { content, style };
}
```

### 6. 그룹 파싱

```typescript
if (token.type === 'hr') {
  // 수평선 만나면 새 그룹 시작
  currentGroupId = generateId();
}
```

## LayoutEngine 구현

`src/repository/layoutEngine.ts` 파일에 구현한다. 노드의 계층 구조를 분석하고 레이아웃 알고리즘에 따라 위치를 자동 계산한다.

### 1. BFS 레벨 계산

```typescript
/**
 * BFS로 각 노드의 레벨 계산
 * @returns Map<nodeId, level>
 */
export function computeLevels(nodes: Node[], edges: Edge[]): Map<string, number> {
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  // 루트 노드 찾기 (부모가 없는 노드)
  const rootNodes = nodes.filter(n =>
    !edges.some(e => e.targetId === n.id)
  );

  // BFS 큐
  const queue: Array<{ id: string; level: number }> = rootNodes.map(n => ({
    id: n.id,
    level: 0
  }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;

    visited.add(id);
    levels.set(id, level);

    // 자식 노드 찾기
    const children = edges
      .filter(e => e.sourceId === id)
      .map(e => e.targetId);

    for (const childId of children) {
      queue.push({ id: childId, level: level + 1 });
    }
  }

  return levels;
}
```

### 2. Radial 레이아웃 (충돌 방지)

```typescript
export function applyRadialLayout(nodes: Node[], edges: Edge[]) {
  const CENTER_X = 500;
  const CENTER_Y = 500;
  const LEVEL_PADDING = 40; // 레벨 간 여유
  const NODE_PADDING = 20;  // 노드 간 여유

  const levels = computeLevels(nodes, edges);

  // 레벨별로 노드 그룹화
  const nodesByLevel = new Map<number, Node[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
    nodesByLevel.get(level)!.push(node);
  }

  // 1. 레벨별 최대 노드 높이 계산
  const maxHeightPerLevel = new Map<number, number>();
  for (const [level, levelNodes] of nodesByLevel) {
    const maxHeight = Math.max(
      ...levelNodes.map(n => n.measuredSize?.height || 80)
    );
    maxHeightPerLevel.set(level, maxHeight);
  }

  // 2. 레벨별 반지름 누적 계산
  const levelRadii = new Map<number, number>();
  let cumulativeRadius = 0;
  const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);

  for (const level of sortedLevels) {
    if (level === 0) {
      levelRadii.set(0, 0); // 루트는 중심
    } else {
      const maxHeight = maxHeightPerLevel.get(level) || 80;
      cumulativeRadius += maxHeight + LEVEL_PADDING;
      levelRadii.set(level, cumulativeRadius);
    }
  }

  // 3. 레벨별 원형 배치 (원주 길이 고려)
  for (const [level, levelNodes] of nodesByLevel) {
    if (level === 0) {
      // 루트 노드는 중심에
      levelNodes.forEach(node => {
        node.position = { x: CENTER_X, y: CENTER_Y };
      });
      continue;
    }

    let radius = levelRadii.get(level)!;

    // 원주에 노드가 모두 들어가는지 확인
    const totalNodesWidth = levelNodes.reduce(
      (sum, n) => sum + (n.measuredSize?.width || 100) + NODE_PADDING,
      0
    );
    const circumference = 2 * Math.PI * radius;

    // 원주가 부족하면 반지름 증가
    if (totalNodesWidth > circumference) {
      radius = totalNodesWidth / (2 * Math.PI);
      levelRadii.set(level, radius); // 업데이트
    }

    // 각도 균등 분할로 배치
    const angleStep = (2 * Math.PI) / levelNodes.length;
    levelNodes.forEach((node, index) => {
      const angle = index * angleStep;
      node.position = {
        x: CENTER_X + radius * Math.cos(angle),
        y: CENTER_Y + radius * Math.sin(angle),
      };
    });
  }
}
```

**충돌 방지 원리**:
1. 레벨 간 간격 = 실제 최대 노드 높이 + 여유 (수직 충돌 방지)
2. 원주 길이 확인 후 반지름 조정 (수평 충돌 방지)
3. 결과: 수학적으로 충돌 불가능

### 3. Horizontal 레이아웃 (충돌 방지)

```typescript
export function applyHorizontalLayout(nodes: Node[], edges: Edge[]) {
  const START_X = 100;
  const START_Y = 100;
  const LEVEL_PADDING_X = 50; // 레벨 간 X축 여유
  const NODE_PADDING_Y = 20;  // 노드 간 Y축 여유

  const levels = computeLevels(nodes, edges);

  // 레벨별로 노드 그룹화
  const nodesByLevel = new Map<number, Node[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
    nodesByLevel.get(level)!.push(node);
  }

  // 1. 레벨별 최대 노드 너비 계산
  const maxWidthPerLevel = new Map<number, number>();
  for (const [level, levelNodes] of nodesByLevel) {
    const maxWidth = Math.max(
      ...levelNodes.map(n => n.measuredSize?.width || 200)
    );
    maxWidthPerLevel.set(level, maxWidth);
  }

  // 2. 레벨별 X축 누적 위치 계산
  const levelXPositions = new Map<number, number>();
  let cumulativeX = START_X;
  const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);

  for (const level of sortedLevels) {
    levelXPositions.set(level, cumulativeX);
    const maxWidth = maxWidthPerLevel.get(level) || 200;
    cumulativeX += maxWidth + LEVEL_PADDING_X;
  }

  // 3. 레벨별로 Y축 누적 배치
  for (const [level, levelNodes] of nodesByLevel) {
    const x = levelXPositions.get(level)!;
    let currentY = START_Y;

    for (const node of levelNodes) {
      node.position = { x, y: currentY };

      // 다음 노드 Y 위치 = 현재 노드 높이 + 여유
      const nodeHeight = node.measuredSize?.height || 80;
      currentY += nodeHeight + NODE_PADDING_Y;
    }
  }
}
```

**충돌 방지 원리**:
1. X축: 레벨별 최대 너비 기반 누적 (수평 충돌 방지)
2. Y축: 각 노드의 실제 높이 누적 (수직 충돌 방지)
3. 결과: 그리드 형태로 충돌 없이 배치

### 4. 레이아웃 적용 함수

```typescript
export function applyLayout(nodes: Node[], edges: Edge[], layout: LayoutType) {
  if (layout === 'radial') {
    applyRadialLayout(nodes, edges);
  } else {
    applyHorizontalLayout(nodes, edges);
  }
}
```

## MarkdownSerializer 구현

`src/repository/markdownSerializer.ts` 파일에 구현한다. Node[]와 Edge[]를 마크다운 텍스트로 변환한다.

### 0. 레이아웃 메타데이터 삽입

```typescript
export function serializeToMarkdown(
  nodes: Node[],
  edges: Edge[],
  layout: LayoutType
): string {
  const lines: string[] = [];

  // 1. 레이아웃 메타데이터 추가
  lines.push(`<!-- knotly-layout: ${layout} -->`);
  lines.push('');

  // 2. 노드/엣지를 마크다운으로 변환
  // ... (아래 섹션 로직)

  return lines.join('\n');
}
```

### 1. 계층 구조 재구성

```typescript
export function serializeToMarkdown(nodes: Node[], edges: Edge[]): string {
  // 그룹별로 노드 분류
  const groupMap = new Map<string | undefined, Node[]>();
  for (const node of nodes) {
    const key = node.groupId || 'default';
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(node);
  }

  const lines: string[] = [];
  let isFirstGroup = true;

  for (const [groupId, groupNodes] of groupMap) {
    // 그룹 구분자
    if (!isFirstGroup && groupId !== 'default') {
      lines.push('---');
      lines.push('');
    }
    isFirstGroup = false;

    // 헤더 노드 먼저 처리 (레벨 순)
    const headers = groupNodes.filter((n) => n.type === 'header').sort((a, b) => (a.level || 0) - (b.level || 0));
    const others = groupNodes.filter((n) => n.type !== 'header');

    for (const node of headers) {
      lines.push(serializeNode(node, edges));
    }

    for (const node of others) {
      lines.push(serializeNode(node, edges));
    }

    lines.push('');
  }

  return lines.join('\n');
}
```

### 2. 노드별 직렬화

```typescript
function serializeNode(node: Node, edges: Edge[]): string {
  const styleToken = node.style ? ` {.${node.style.split(' ').join(' .')}}` : '';

  if (node.type === 'header') {
    const hashes = '#'.repeat(node.level || 1);
    return `${hashes} ${node.content}${styleToken}`.trim();
  }

  if (node.type === 'code') {
    return `\`\`\`${node.language || ''}${styleToken}\n${node.content}\n\`\`\``;
  }

  if (node.type === 'image') {
    return `![${node.altText || ''}](${node.imageUrl || ''})${styleToken}`;
  }

  // text 타입은 리스트로 변환 (들여쓰기는 level 기반)
  const indent = '  '.repeat(node.level || 0);
  return `${indent}- ${node.content}${styleToken}`.trim();
}
```

**참고**: 계층 관계 외 자유 연결은 마크다운에 저장하지 않고, 별도 메타데이터(위치 정보처럼)로 관리합니다. Canvas에서 링크 버튼(🔗)으로 생성한 엣지는 마크다운 직렬화 시 제외됩니다.

## LayoutSelector 구현

`src/components/LayoutSelector.tsx` 파일에 구현한다. Canvas 상단에 레이아웃 전환 버튼을 제공한다.

```typescript
import { useCanvasStore } from '../store/canvasStore';
import type { LayoutType } from '../repository/markdownParser';

export function LayoutSelector() {
  const layout = useCanvasStore(state => state.layout);
  const setLayout = useCanvasStore(state => state.setLayout);
  const nodes = useCanvasStore(state => state.nodes);
  const edges = useCanvasStore(state => state.edges);

  const handleLayoutChange = (newLayout: LayoutType) => {
    // 1. 레이아웃 타입 업데이트
    setLayout(newLayout);

    // 2. 모든 노드 위치 재계산
    applyLayout(nodes, edges, newLayout);

    // 3. 노드 위치 업데이트 (canvasStore.updateNodes 호출)
    // ... (Zustand action 호출)
  };

  return (
    <div className="flex gap-2 p-2 bg-gray-100 border-b">
      <button
        onClick={() => handleLayoutChange('radial')}
        className={`px-3 py-1 rounded transition-colors ${
          layout === 'radial'
            ? 'bg-blue-500 text-white'
            : 'bg-white hover:bg-gray-200'
        }`}
      >
        🌟 Radial
      </button>
      <button
        onClick={() => handleLayoutChange('horizontal')}
        className={`px-3 py-1 rounded transition-colors ${
          layout === 'horizontal'
            ? 'bg-blue-500 text-white'
            : 'bg-white hover:bg-gray-200'
        }`}
      >
        ➡️ Horizontal
      </button>
    </div>
  );
}
```

## SplitLayout 구현

`src/components/SplitLayout.tsx` 파일에 구현한다.

```typescript
import { useState, useEffect } from 'react';

export function SplitLayout() {
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem('split-width');
    return saved ? parseFloat(saved) : 50; // default 50%
  });

  const handleDrag = (e: React.MouseEvent) => {
    const newWidth = (e.clientX / window.innerWidth) * 100;
    const clamped = Math.max(30, Math.min(70, newWidth)); // 30%-70%
    setLeftWidth(clamped);
  };

  useEffect(() => {
    localStorage.setItem('split-width', leftWidth.toString());
  }, [leftWidth]);

  return (
    <div className="flex h-screen">
      <div style={{ width: `${leftWidth}%` }} className="border-r">
        <MarkdownEditor />
      </div>
      <div
        className="w-1 bg-gray-300 cursor-col-resize hover:bg-blue-500"
        onMouseDown={(e) => {
          const onMouseMove = (e: MouseEvent) => handleDrag(e as any);
          const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          };
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        }}
      />
      <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col">
        <LayoutSelector />
        <Canvas />
      </div>
    </div>
  );
}
```

## MarkdownEditor 구현

`src/components/MarkdownEditor.tsx` 파일에 구현한다.

```typescript
import { useState, useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { parseMarkdown } from '../repository/markdownParser';

export function MarkdownEditor() {
  const [text, setText] = useState('');
  const updateStore = useCanvasStore((state) => state.setNodesAndEdges);
  const isDirtyRef = useRef(false);

  // 에디터 → 캔버스 동기화 (debounce)
  useEffect(() => {
    if (isDirtyRef.current) {
      isDirtyRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const { nodes, edges } = parseMarkdown(text);
      isDirtyRef.current = true;
      updateStore(nodes, edges);
    }, 300);

    return () => clearTimeout(timer);
  }, [text, updateStore]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 bg-gray-100 border-b">
        <span className="font-semibold">Markdown Editor</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
        placeholder="# 제목 입력&#10;&#10;- 리스트 항목 [[링크]] {.color-blue}"
      />
    </div>
  );
}
```

## 캔버스 → 에디터 동기화

Zustand store를 구독하여 노드/엣지 변경 시 에디터 업데이트.

```typescript
import { serializeToMarkdown } from '../repository/markdownSerializer';

export function MarkdownEditor() {
  const [text, setText] = useState('');
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const isDirtyRef = useRef(false);

  // 캔버스 → 에디터 동기화
  useEffect(() => {
    if (isDirtyRef.current) {
      isDirtyRef.current = false;
      return;
    }

    const newText = serializeToMarkdown(nodes, edges);
    isDirtyRef.current = true;
    setText(newText);
  }, [nodes, edges]);

  // ... 에디터 → 캔버스 동기화 (이전 코드)
}
```

## 캔버스 노드 타입별 렌더링

기존 `NodeComponent.tsx`를 수정하여 타입별 분기 처리.

```typescript
export function NodeComponent({ node }: { node: Node }) {
  if (node.type === 'code') {
    return <CodeNode node={node} />;
  }
  if (node.type === 'image') {
    return <ImageNode node={node} />;
  }
  if (node.type === 'header') {
    return <HeaderNode node={node} />;
  }
  return <TextNode node={node} />;
}
```

### CodeNode (미리보기 + 확장)

```typescript
function CodeNode({ node }: { node: Node }) {
  const [expanded, setExpanded] = useState(false);
  const preview = node.content.split('\n')[0] + '...';

  return (
    <g onClick={() => setExpanded(!expanded)}>
      <RoughRect {...} />
      <text className="font-mono text-xs">
        📄 {node.language || 'code'} {expanded ? '▲' : '▼'}
      </text>
      <text className="font-mono text-xs">
        {expanded ? node.content : preview}
      </text>
    </g>
  );
}
```

### ImageNode

```typescript
function ImageNode({ node }: { node: Node }) {
  return (
    <g>
      <RoughRect {...} />
      <image href={node.imageUrl} width={100} height={100} />
      <text className="text-xs text-gray-600">Alt: {node.altText}</text>
    </g>
  );
}
```

## 파일 I/O 업데이트

`src/utils/fileIO.ts` 수정: YAML frontmatter 제거, 순수 마크다운 읽기/쓰기.

```typescript
export async function loadMarkdownFile(fileHandle: FileSystemFileHandle | File) {
  const text = await readFileAsText(fileHandle);
  const { nodes, edges } = parseMarkdown(text);
  return { nodes, edges };
}

export async function saveMarkdownFile(fileHandle: FileSystemFileHandle | null, nodes: Node[], edges: Edge[]) {
  const text = serializeToMarkdown(nodes, edges);
  await writeTextToFile(fileHandle, text, '.md');
}
```

## 기술적 제약사항

- **Debounce 필수**: 에디터 입력마다 파싱하면 성능 저하 발생. 300ms debounce 적용.
- **Dirty Flag 패턴**: `isDirtyRef`로 순환 업데이트 방지. 한쪽에서 업데이트 시 다른 쪽 useEffect 스킵.
- **커서 위치 보존**: 에디터 업데이트 시 `selectionStart`, `selectionEnd` 저장 후 복원.
- **파싱 오류 처리**: 잘못된 마크다운 입력 시 에러 메시지 표시하고, 이전 상태 유지.
- **리스트 중첩 제한**: 들여쓰기 5레벨 이상은 성능 이슈로 제한 고려.
- **레이아웃 자동 적용**: 노드 위치는 마크다운에 저장되지 않음. 파일 로드 시 항상 레이아웃 알고리즘 적용.
- **레이아웃 전환 성능**: 레이아웃 전환 시 모든 노드 위치 재계산. 노드 수가 많으면 애니메이션 생략 고려.

## Zustand Store 확장

`src/store/canvasStore.ts`에 레이아웃 상태 추가:

```typescript
interface CanvasState {
  // 기존 필드
  nodes: Node[];
  edges: Edge[];
  // ... 기타 필드

  // NEW: 레이아웃 타입
  layout: LayoutType;

  // 기존 액션
  updateNode: (id: string, updates: Partial<Node>) => void;
  // ... 기타 액션

  // NEW: 레이아웃 액션
  setLayout: (layout: LayoutType) => void;
  applyCurrentLayout: () => void; // 현재 레이아웃 재적용
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // 기존 상태
  nodes: [],
  edges: [],
  layout: 'radial', // default

  // 기존 액션
  // ...

  // NEW: 레이아웃 액션
  setLayout: (layout) => set({ layout }),

  applyCurrentLayout: () => {
    const { nodes, edges, layout } = get();
    applyLayout(nodes, edges, layout);
    set({ nodes: [...nodes] }); // 재렌더링 트리거
  },
}));
```

## 참고 자료

- **marked.js 문서**: https://marked.js.org/
- **remark 문서**: https://remark.js.org/
- **react-split-pane**: https://github.com/tomkp/react-split-pane
- **Obsidian 마크다운 문법**: https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax
- **D3.js Force Layout** (참고용): https://d3js.org/d3-force
- **HTML 주석 in Markdown**: CommonMark spec allows HTML comments
