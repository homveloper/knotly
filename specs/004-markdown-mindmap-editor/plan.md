# Implementation Plan: Markdown Mind Map Editor

**Branch**: `004-markdown-mindmap-editor` | **Date**: 2025-10-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-markdown-mindmap-editor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature adds a split-pane markdown editor with real-time bidirectional synchronization to a visual mind map canvas. Users type standard markdown (headers, lists, code blocks, images) in the left panel and see nodes appear instantly in the right canvas with rough.js hand-drawn styling. Conversely, editing nodes in the canvas updates the markdown text. The system parses markdown into a graph structure (nodes + edges), supports two layout algorithms (radial and horizontal), and persists pure `.md` files compatible with standard markdown tools (Git, Obsidian, Notion).

**Technical Approach**: Add a Repository Layer between the UI and file system containing MarkdownParser (marked.js lexer), MarkdownSerializer (graph → markdown), and LayoutEngine (BFS + position calculation). Use dirty flags to prevent circular updates between editor and canvas. Implement resizable split pane with LocalStorage persistence. Extend Node type to support header/code/image variants.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled
**Primary Dependencies**:
- **marked** ^15.0.0 (markdown lexer) - NEW for this feature
- **React** 19.1.1 (UI framework)
- **Zustand** 5.0.8 (state management)
- **rough.js** 4.6.6 (hand-drawn rendering)
- **@use-gesture/react** 10.3.1 (touch/drag gestures)
- **Vite** 7.1.7 (build tool)
- **Tailwind CSS** 4.1.14 (styling)

**Storage**:
- Browser File System Access API (Chromium) with fallback to file input/Blob download (Safari/Firefox)
- LocalStorage for UI preferences (split ratio, recent files)
- No backend persistence - client-side only

**Testing**:
- Vitest (unit tests for parser, serializer, layout engine)
- React Testing Library (component tests)
- Manual E2E (bidirectional sync, layout switching)
- Target: 80% test coverage per constitution

**Target Platform**: Modern browsers (Chrome, Firefox, Safari) with ES2020+ support
**Project Type**: Single-page web application (frontend only)
**Performance Goals**:
- 60fps canvas rendering with up to 100 nodes (per constitution Principle VIII)
- 300ms debounce for editor → canvas parsing (per spec FR-001)
- <100ms for canvas → editor updates (per spec SC-002)
- <1s layout switching for 100 nodes (per spec SC-005)

**Constraints**:
- Pure markdown output (no proprietary format) for Git/Obsidian/Notion compatibility (per spec FR-020)
- No circular updates between editor and canvas (per spec FR-007)
- Cursor position preservation during updates (per spec FR-006)
- 30%-70% split ratio range (per spec FR-012)
- 500-node recommended maximum (per spec edge case)

**Scale/Scope**:
- Single-user, local-first tool
- Typical documents: 10-100 nodes
- Support up to 500 nodes with performance warnings
- No real-time collaboration (per assumptions)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Error Handling (Error as Value)
**Status**: ✅ PASS
**Rationale**: MarkdownParser and MarkdownSerializer will return Result types with explicit error states:
- `parseMarkdown(text: string): Result<{ nodes: Node[], edges: Edge[] }, ParseError>`
- `serializeToMarkdown(nodes: Node[], edges: Edge[]): Result<string, SerializeError>`
- All parsing errors (syntax errors, invalid tokens) returned as values, not thrown
- UI handles errors by displaying previous state + user notification

### Principle II: Object Composition (Composition over Inheritance)
**Status**: ✅ PASS
**Rationale**: No class hierarchies planned. Node type variants (text/header/code/image) use discriminated unions:
```typescript
type Node = TextNode | HeaderNode | CodeNode | ImageNode
interface TextNode { type: 'text'; content: string; ... }
interface HeaderNode { type: 'header'; content: string; level: number; ... }
// etc.
```
- Layout algorithms are pure functions, not classes
- React components use composition (NodeComponent wraps TextNode/CodeNode/etc.)

### Principle III: Dependency Injection (Explicit Dependencies)
**Status**: ✅ PASS
**Rationale**: All dependencies passed explicitly:
- MarkdownEditor component consumes Zustand store actions (`parseAndUpdateNodes`, `serializeAndUpdateMarkdown`) which internally use `parseMarkdown` and `serializeToMarkdown` functions passed via closure
- LayoutEngine functions receive `nodes`, `edges`, `layout` as arguments (pure functions)
- Zustand store actions receive repository functions via closure (no hidden globals)
- No singleton instances or implicit imports

### Principle IV: Object Creation (Factory Functions)
**Status**: ✅ PASS
**Rationale**: All nodes created via factory functions:
- `createTextNode(content: string, style: string): Result<Node, ValidationError>`
- `createHeaderNode(content: string, level: number): Result<Node, ValidationError>`
- Factory functions validate inputs (e.g., level must be 1-6) and return Result types
- No direct constructor calls

### Principle V: Code Quality Standards
**Status**: ✅ PASS
**Rationale**:
- TypeScript strict mode enabled (per package.json)
- ESLint configured with no warnings (per package.json scripts)
- Repository layer isolates parsing/serialization from UI (DDD pattern)
- Pure functions for layout algorithms (no side effects)
- Functions kept small (single responsibility)

### Principle VI: Testing Standards
**Status**: ✅ PASS
**Rationale**:
- Unit tests for MarkdownParser (15+ test cases for headers, lists, code, images, style tokens)
- Unit tests for LayoutEngine (radial, horizontal collision prevention)
- Integration tests for MarkdownEditor (editor → canvas → editor round-trip)
- Test pyramid: 60% unit (parser/layout), 30% integration (components), 10% E2E (manual)
- Given-When-Then structure for all tests
- 80% coverage target per constitution

### Principle VII: User Experience Consistency
**Status**: ✅ PASS
**Rationale**:
- 60fps target enforced via performance monitoring (per spec SC-005)
- Keyboard navigation: Tab through split pane divider, editor, canvas toolbar
- WCAG 2.1 AA: Color contrast verified, screen reader labels on buttons
- Mobile-first: Touch gestures already implemented (003-markdown-file-tokens)
- <100ms feedback for canvas edits (per spec SC-002)

### Principle VIII: Performance Requirements
**Status**: ✅ PASS
**Rationale**:
- 60fps rendering target with 100 nodes (measured via Chrome DevTools)
- 300ms debounce prevents excessive parsing (per spec FR-001)
- Layout algorithms O(n) time complexity (BFS + single position pass)
- Memory: ~1KB per node × 100 nodes = 100KB typical usage (well under 50MB mobile limit)
- Performance warning at 500 nodes (per spec edge case)

**GATE RESULT**: ✅ ALL GATES PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```
specs/004-markdown-mindmap-editor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── markdown-api.ts  # TypeScript interfaces for parser/serializer
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
knotly-frontend/
├── src/
│   ├── components/
│   │   ├── Canvas.tsx                     # Existing canvas component
│   │   ├── NodeComponent.tsx              # MODIFIED: Add type-based rendering
│   │   ├── TextNode.tsx                   # MODIFIED: Extract from NodeComponent
│   │   ├── HeaderNode.tsx                 # NEW: Larger font for headers
│   │   ├── CodeNode.tsx                   # NEW: Preview + expand toggle
│   │   ├── ImageNode.tsx                  # NEW: Thumbnail + alt text
│   │   ├── MarkdownEditor.tsx             # NEW: Textarea + debounce + dirty flag
│   │   ├── SplitLayout.tsx                # NEW: Resizable divider
│   │   └── LayoutSelector.tsx             # NEW: Radial/Horizontal buttons
│   │
│   ├── repository/                        # NEW: Repository layer
│   │   ├── markdownParser.ts              # NEW: marked.js lexer wrapper
│   │   ├── markdownSerializer.ts          # NEW: Graph → markdown
│   │   └── layoutEngine.ts                # NEW: BFS + radial/horizontal
│   │
│   ├── store/
│   │   └── canvasStore.ts                 # MODIFIED: Add layout field + actions
│   │
│   ├── types/
│   │   └── canvas.ts                      # MODIFIED: Extend Node with type/level/language/imageUrl
│   │
│   ├── utils/
│   │   └── fileIO.ts                      # MODIFIED: Remove YAML frontmatter, use .md
│   │
│   └── App.tsx                            # MODIFIED: Wrap in <SplitLayout>
│
└── tests/
    ├── unit/
    │   ├── markdownParser.test.ts         # NEW: 15+ parser test cases
    │   ├── markdownSerializer.test.ts     # NEW: 10+ serializer test cases
    │   └── layoutEngine.test.ts           # NEW: Collision prevention tests
    │
    └── integration/
        └── MarkdownEditor.test.tsx        # NEW: Round-trip sync tests
```

**Structure Decision**: This is a single-page web application frontend. We use the existing `knotly-frontend/` directory structure and add a new `repository/` layer to separate markdown parsing/serialization logic from UI components. This follows DDD principles by isolating domain logic (markdown ↔ graph conversion) from infrastructure (React components, Zustand store).

**Key Additions**:
- **repository/**: New layer for markdown parsing, serialization, and layout algorithms
- **components/**: 4 new components (MarkdownEditor, SplitLayout, LayoutSelector, type-specific nodes)
- **types/canvas.ts**: Extended Node interface with discriminated union for type variants
- **tests/**: Unit tests for repository layer, integration tests for bidirectional sync

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**Status**: No violations. Constitution Check passed all gates.

---

## Phase 0: Research Plan

**Objective**: Resolve all "NEEDS CLARIFICATION" items from Technical Context and gather best practices for new dependencies.

### Research Tasks

1. **Markdown Parser Selection** (marked vs remark)
   - **Unknown**: Which parser provides better lexer access for header/list/code/image tokens?
   - **Research**: Compare marked.lexer() vs remark unified pipeline for token extraction
   - **Decision criteria**: Token access API, bundle size, TypeScript support
   - **Output**: Decision in research.md with code examples

2. **Split Pane Implementation** (library vs custom)
   - **Unknown**: Should we use `react-split-pane` or implement custom divider with mouse events?
   - **Research**: Check bundle size, accessibility, touch support
   - **Decision criteria**: Bundle size <10KB, WCAG 2.1 keyboard nav, mobile touch
   - **Output**: Decision in research.md with tradeoffs

3. **Dirty Flag Pattern** (preventing circular updates)
   - **Unknown**: Best pattern for preventing editor ↔ canvas circular updates with React hooks?
   - **Research**: useRef vs useState vs Zustand for dirty tracking, React 19 implications
   - **Decision criteria**: No race conditions, cursor preservation, simple API
   - **Output**: Pattern recommendation in research.md with code example

4. **Cursor Position Preservation**
   - **Unknown**: How to preserve textarea selectionStart/selectionEnd after React re-render?
   - **Research**: React useEffect timing, selectionStart restoration after setText
   - **Decision criteria**: No cursor jumps, works across browsers
   - **Output**: Implementation guide in research.md

5. **Layout Algorithm Performance**
   - **Unknown**: Can BFS + position calculation handle 500 nodes in <1s?
   - **Research**: Big-O analysis, benchmark with synthetic data
   - **Decision criteria**: O(n) time complexity, <1s for 500 nodes
   - **Output**: Performance analysis in research.md with benchmarks

6. **marked.js Best Practices**
   - **Unknown**: How to extract style tokens `{.class}` from token.raw?
   - **Research**: Custom renderer vs regex on token.raw vs marked extensions
   - **Decision criteria**: Simplicity, no performance penalty
   - **Output**: Token extraction pattern in research.md

### Research Agents

I will dispatch research agents in parallel for each task:

- **Agent 1**: "Research marked.js vs remark for markdown lexer API with TypeScript support and bundle size comparison"
- **Agent 2**: "Research react-split-pane vs custom divider implementation for accessibility and bundle size"
- **Agent 3**: "Research React dirty flag patterns to prevent circular updates between controlled textarea and external state"
- **Agent 4**: "Research cursor position preservation in React textarea after programmatic setState updates"
- **Agent 5**: "Research BFS performance for 500-node graph layout calculation and position updates"
- **Agent 6**: "Research marked.js custom token extraction patterns for style metadata in markdown"

**Output**: `research.md` with decisions, rationales, and code examples for each task.

---

## Phase 1: Design Plan

**Objective**: Generate data model, API contracts, and quickstart guide based on research findings.

### 1.1 Data Model (`data-model.md`)

Extract entities from spec and extend existing Node/Edge types:

**Entities**:
- **Node** (extended with type discrimination)
- **Edge** (existing)
- **LayoutState** (new)
- **SplitRatio** (new)
- **MarkdownFile** (conceptual)

**Schema** (TypeScript discriminated unions):
```typescript
// Base node properties
interface BaseNode {
  id: string;
  content: string;
  style: string;
  position: { x: number; y: number };
  measuredSize?: { width: number; height: number };
  groupId?: string;
}

// Discriminated union for node types
type Node = TextNode | HeaderNode | CodeNode | ImageNode;

interface TextNode extends BaseNode {
  type: 'text';
  level: number; // List indentation depth
}

interface HeaderNode extends BaseNode {
  type: 'header';
  level: number; // 1-6 for h1-h6
}

interface CodeNode extends BaseNode {
  type: 'code';
  language: string;
}

interface ImageNode extends BaseNode {
  type: 'image';
  imageUrl: string;
  altText: string;
}

// Edge remains unchanged
interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

// Layout state
type LayoutType = 'radial' | 'horizontal';

// Store state
interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  layout: LayoutType;
  splitRatio: number; // 30-70
  setLayout: (layout: LayoutType) => void;
  applyCurrentLayout: () => void;
}
```

**Validation Rules** (from spec):
- Node.level: 1-6 for headers, 1-5 for lists
- SplitRatio: 30-70 range
- LayoutType: 'radial' | 'horizontal' only
- Node.measuredSize required before layout calculation

**State Transitions**:
- Editor text change → 300ms debounce → parseMarkdown → updateStore → canvas renders
- Canvas node edit → immediate serializeToMarkdown → editor text update
- Layout button click → recalculate positions → update all nodes

### 1.2 API Contracts (`contracts/markdown-api.ts`)

Define TypeScript interfaces for repository layer functions:

```typescript
// contracts/markdown-api.ts

// Result type for error as value pattern (Constitution Principle I)
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Error types
export interface ParseError {
  type: 'syntax_error' | 'token_extraction_error';
  message: string;
  line?: number;
}

export interface SerializeError {
  type: 'invalid_node' | 'invalid_edge';
  message: string;
  nodeId?: string;
}

export interface LayoutError {
  type: 'missing_measured_size' | 'circular_dependency';
  message: string;
}

// Parser API
export interface IMarkdownParser {
  parse(text: string): Result<{ nodes: Node[], edges: Edge[], layout: LayoutType }, ParseError>;
}

// Serializer API
export interface IMarkdownSerializer {
  serialize(nodes: Node[], edges: Edge[], layout: LayoutType): Result<string, SerializeError>;
}

// Layout Engine API
export interface ILayoutEngine {
  applyLayout(
    nodes: Node[],
    edges: Edge[],
    layout: LayoutType
  ): Result<Node[], LayoutError>;
}

// Helper: Extract style tokens from text
export function extractStyleTokens(text: string): { content: string; style: string };

// Helper: Compute BFS levels
export function computeLevels(nodes: Node[], edges: Edge[]): Map<string, number>;
```

**API Patterns**:
- All functions return Result types (error as value)
- No mutations - return new arrays
- Pure functions - no side effects
- Explicit dependencies - no hidden globals

### 1.3 Quickstart Guide (`quickstart.md`)

**User Flow**:
1. Open app → Default 50-50 split (editor left, canvas right)
2. Type markdown in editor → Nodes appear in canvas after 300ms
3. Edit node in canvas → Markdown text updates instantly
4. Click layout button → Nodes reposition
5. Drag divider → Split ratio adjusts (30-70% range)
6. Save file → Pure .md output

**Developer Setup**:
```bash
cd knotly-frontend
pnpm install marked@^15.0.0
pnpm test  # Run parser/layout tests
pnpm dev   # Start dev server
```

**API Usage Example**:
```typescript
// Parse markdown
const result = parseMarkdown('# Hello\n- World');
if (result.ok) {
  const { nodes, edges, layout } = result.value;
  // Use nodes/edges
} else {
  console.error(result.error.message);
}

// Serialize back
const serializeResult = serializeToMarkdown(nodes, edges, layout);
if (serializeResult.ok) {
  const markdown = serializeResult.value;
  await saveFile(markdown);
}
```

### 1.4 Update Agent Context

Run `.specify/scripts/bash/update-agent-context.sh claude` to add new technologies:
- marked@^15.0.0 (markdown parser)
- Repository layer pattern (DDD)

### 1.5 Re-evaluate Constitution Check

After design, verify:
- ✅ Error as value: All APIs use Result types
- ✅ Composition: Node uses discriminated union, not inheritance
- ✅ Dependency injection: Parser/serializer passed as props
- ✅ Factory functions: createTextNode/createHeaderNode return Result
- ✅ Testing: Unit + integration tests planned

**Post-Design Gate Result**: ✅ ALL GATES PASS - Proceed to Phase 2

---

## Stop Point

**Command ends here**. Phase 2 (task generation) is handled by `/speckit.tasks`.

**Deliverables**:
- ✅ plan.md (this file)
- ⏳ research.md (Phase 0 output)
- ⏳ data-model.md (Phase 1 output)
- ⏳ contracts/markdown-api.ts (Phase 1 output)
- ⏳ quickstart.md (Phase 1 output)
- ⏳ Updated CLAUDE.md (Phase 1 output)

**Branch**: `004-markdown-mindmap-editor`
**Next Command**: `/speckit.tasks` to generate tasks.md from this plan
