# Data Model: Markdown Mind Map Editor

**Feature**: 004-markdown-mindmap-editor
**Date**: 2025-10-20
**Phase**: Phase 1 (Design)

## Overview

This document defines the data entities, schemas, validation rules, and state transitions for the markdown mind map editor feature. The model extends the existing Node/Edge system to support multiple node types (text, header, code, image) with a repository layer for markdown parsing and serialization.

---

## Entities

### 1. Node (Extended with Type Discrimination)

**Description**: Represents a markdown element in the mind map graph. Uses discriminated unions to support multiple node types while maintaining type safety.

**Base Properties** (shared by all node types):
```typescript
interface BaseNode {
  id: string;                     // UUID v4
  content: string;                // Display text (cleaned, no style tokens)
  style: string;                  // Space-separated style classes (e.g., "color-red h3")
  position: { x: number; y: number }; // Canvas coordinates
  measuredSize?: {                // Size measured after rendering
    width: number;                // px
    height: number;               // px
  };
  groupId?: string;               // Optional group identifier (from --- separator)
}
```

**Discriminated Union**:
```typescript
type Node = TextNode | HeaderNode | CodeNode | ImageNode;
```

**Node Type Variants**:

#### TextNode (List Items)
```typescript
interface TextNode extends BaseNode {
  type: 'text';
  level: number;                  // List indentation depth (1-5)
}
```
- Represents markdown list items (`- Item`, `  - Nested`)
- `level` determines hierarchy: 1 = root list, 2 = first indent, etc.

#### HeaderNode (Markdown Headers)
```typescript
interface HeaderNode extends BaseNode {
  type: 'header';
  level: number;                  // Header depth (1-6 for h1-h6)
}
```
- Represents markdown headers (`#`, `##`, `###`, etc.)
- `level` determines font size and hierarchy
- Rendered larger than text nodes

#### CodeNode (Code Blocks)
```typescript
interface CodeNode extends BaseNode {
  type: 'code';
  language: string;               // Syntax language (e.g., 'javascript', 'python')
  expanded?: boolean;             // UI state: preview (false) or full (true)
}
```
- Represents fenced code blocks (` ```language `)
- `content` contains the actual code
- `language` used for syntax highlighting metadata
- `expanded` is UI-only state (not persisted to markdown)

#### ImageNode (Images)
```typescript
interface ImageNode extends BaseNode {
  type: 'image';
  imageUrl: string;               // Image source URL
  altText: string;                // Alternative text
}
```
- Represents markdown images (`![alt](url)`)
- `content` is typically empty or same as `altText`
- `imageUrl` is the href from markdown syntax
- Rendered as thumbnail in canvas

**Creation**: All nodes MUST be created via factory functions (Constitution Principle IV):
```typescript
// Factory functions return Result types (Constitution Principle I)
function createTextNode(content: string, level: number, style: string): Result<TextNode, ValidationError>
function createHeaderNode(content: string, level: number, style: string): Result<HeaderNode, ValidationError>
function createCodeNode(content: string, language: string, style: string): Result<CodeNode, ValidationError>
function createImageNode(altText: string, imageUrl: string, style: string): Result<ImageNode, ValidationError>
```

---

### 2. Edge (Hierarchical Relationship)

**Description**: Represents parent-child relationship between nodes. Created automatically based on markdown structure.

**Schema**:
```typescript
interface Edge {
  id: string;                     // UUID v4
  sourceId: string;               // Parent node ID
  targetId: string;               // Child node ID
}
```

**Hierarchy Rules**:
1. **Headers**: Child of most recent header with `level - 1`
   - `# H1` → `## H2` creates edge `H1 → H2`
   - `## H2` → `#### H4` creates edge `H2 → H4` (skipped levels allowed)

2. **List Items**: Child of parent at `level - 1` indentation
   - `- Item` → `  - Nested` creates edge `Item → Nested`
   - Bullet type (`-`, `*`, `+`) doesn't affect hierarchy

3. **Code/Image**: Child of immediately preceding header or list item
   - If no preceding element, becomes root node (no incoming edge)

4. **Groups** (via `---` separator): Do NOT create edges
   - `groupId` is for visual organization only
   - Nodes in different groups can still have edges if hierarchy dictates

**Edge Direction**: Always parent → child (source → target)

---

### 3. LayoutState

**Description**: Determines node positioning algorithm.

**Schema**:
```typescript
type LayoutType = 'radial' | 'horizontal';
```

**Algorithms**:
- **radial**: Center-out circular layout, nodes radiate from root
  - Level 0 (roots) at center (x: 500, y: 500)
  - Level 1 at radius R1, evenly spaced around circle
  - Level 2 at radius R2 > R1, etc.
  - Radius increases by `maxHeightPerLevel + LEVEL_PADDING (40px)`

- **horizontal**: Left-to-right tree layout
  - Level 0 (roots) at left (x: 100)
  - Level 1 at x: 100 + maxWidth[0] + LEVEL_PADDING_X (50px)
  - Nodes stacked vertically within level
  - Y increases by `node.measuredSize.height + NODE_PADDING_Y (20px)`

**Persistence**: Saved as layout comment at top of markdown file:
```markdown
<!-- knotly-layout: radial -->
```

---

### 4. SplitRatio

**Description**: Percentage division between editor and canvas panels.

**Schema**:
```typescript
interface SplitRatio {
  editor: number;                 // 30-70 (percent)
  canvas: number;                 // 30-70 (percent, always 100 - editor)
}
```

**Constraints**:
- `editor + canvas === 100`
- `editor >= 30 && editor <= 70`
- `canvas >= 30 && canvas <= 70`

**Persistence**: Stored in `localStorage` as `'split-sizes'` key:
```json
[50, 50]  // [editor, canvas]
```

---

### 5. MarkdownFile (Conceptual)

**Description**: Input/output artifact. Not a runtime entity, but defines the file format contract.

**Format**:
```markdown
<!-- knotly-layout: radial -->

# Header 1 {.color-blue .h1}

- List item {.color-red}
  - Nested item

## Header 2

\`\`\`javascript {.rough}
console.log('code');
\`\`\`

![Alt text](https://example.com/image.png) {.color-mint}

---

# Group 2 Header
```

**Structure**:
1. **Line 1**: Layout comment (optional, defaults to `radial`)
2. **Body**: Standard markdown with optional style tokens `{.class}`
3. **Separators**: `---` creates new `groupId` (visual only, no hierarchy change)
4. **Style Tokens**: Appear at end of element, format `{.token1 .token2}`

**Compatibility**: Must parse correctly in:
- Git (diffs, merges)
- Obsidian
- Notion
- GitHub markdown preview
- CommonMark parsers

---

## Validation Rules

### Node Validation

| Field | Rule | Error Type |
|-------|------|-----------|
| `id` | UUID v4 format | `ValidationError` |
| `content` | Non-empty string (after trimming) | `ValidationError` |
| `TextNode.level` | 1-5 inclusive | `ValidationError` |
| `HeaderNode.level` | 1-6 inclusive | `ValidationError` |
| `CodeNode.language` | Non-empty string | `ValidationError` |
| `ImageNode.imageUrl` | Valid URL format (http/https) | `ValidationError` |
| `position.x` | Finite number | `ValidationError` |
| `position.y` | Finite number | `ValidationError` |
| `measuredSize.width` | Positive number > 0 | `ValidationError` |
| `measuredSize.height` | Positive number > 0 | `ValidationError` |
| `style` | String (can be empty) | - |

### Edge Validation

| Field | Rule | Error Type |
|-------|------|-----------|
| `id` | UUID v4 format | `ValidationError` |
| `sourceId` | Exists in `nodes` array | `ValidationError` |
| `targetId` | Exists in `nodes` array | `ValidationError` |
| `sourceId !== targetId` | No self-loops | `ValidationError` |

### Layout Validation

| Field | Rule | Error Type |
|-------|------|-----------|
| `layout` | 'radial' or 'horizontal' only | `ValidationError` |

### Split Ratio Validation

| Field | Rule | Error Type |
|-------|------|-----------|
| `editor` | 30 <= value <= 70 | `ValidationError` |
| `canvas` | 30 <= value <= 70 | `ValidationError` |
| `editor + canvas` | Sum equals 100 | `ValidationError` |

---

## State Transitions

### 1. Editor → Canvas (User Types Markdown)

**Trigger**: User types in textarea
**Debounce**: 300ms

```
User types "# Hello"
  ↓ (wait 300ms)
parseMarkdown(text)
  ↓ (success)
Result.ok({ nodes: [HeaderNode], edges: [], layout: 'radial' })
  ↓
useCanvasStore.setState({ nodes, edges, layout })
  ↓
Canvas re-renders with new nodes
```

**Error Handling**: If `parseMarkdown` returns `Result.error(ParseError)`:
1. Keep previous canvas state (don't clear nodes)
2. Show error notification to user
3. Log error details for debugging

### 2. Canvas → Editor (User Edits Node)

**Trigger**: User edits node text in canvas
**Timing**: Immediate (< 100ms)

```
User edits HeaderNode.content: "Hello" → "World"
  ↓
updateNode(nodeId, { content: "World" })
  ↓
useCanvasStore.setState({ nodes: updatedNodes })
  ↓
serializeToMarkdown(nodes, edges, layout)
  ↓ (success)
Result.ok("# World\n...")
  ↓
isUpdatingFromCanvas.current = true
  ↓
setMarkdown(text)
  ↓
Textarea updates, cursor preserved via useLayoutEffect
```

**Error Handling**: If `serializeToMarkdown` returns `Result.error(SerializeError)`:
1. Keep current editor text (don't update)
2. Show error notification
3. Revert canvas change if inconsistent

### 3. Layout Switch (User Clicks Button)

**Trigger**: User clicks "🌟 Radial" or "➡️ Horizontal" button
**Timing**: Synchronous (< 1s for 100 nodes)

```
User clicks "➡️ Horizontal"
  ↓
setLayout('horizontal')
  ↓
applyLayout(nodes, edges, 'horizontal')
  ↓
computeLevels(nodes, edges) // BFS
  ↓
calculatePositions(nodes, levels, 'horizontal')
  ↓
Result.ok(nodesWithNewPositions)
  ↓
useCanvasStore.setState({ nodes: updatedNodes, layout: 'horizontal' })
  ↓
Canvas re-renders with new positions
  ↓
serializeToMarkdown() // Update layout comment
  ↓
setMarkdown(newText)
```

**Error Handling**: If `applyLayout` returns `Result.error(LayoutError)`:
1. Keep previous layout and positions
2. Show error notification
3. Revert layout selector UI

### 4. Split Ratio Adjustment (User Drags Divider)

**Trigger**: User drags divider
**Timing**: Real-time (< 16ms per frame)

```
User drags divider left (50% → 40%)
  ↓
onDrag([40, 60])
  ↓
clamp(40, 30, 70) // Ensure 30-70 range
  ↓
setSizes([40, 60])
  ↓
localStorage.setItem('split-sizes', '[40,60]')
  ↓
Split component re-renders with new sizes
```

**Edge Case**: If localStorage is full or disabled:
- Silently fail storage
- Ratio persists for session only
- No error shown to user

### 5. File Load (User Opens Markdown File)

**Trigger**: User selects file via File System Access API
**Timing**: Depends on file size

```
User selects "notes.md"
  ↓
readFileAsText(handle)
  ↓
parseMarkdown(text)
  ↓ (success)
Result.ok({ nodes, edges, layout })
  ↓
useCanvasStore.setState({ nodes, edges, layout })
  ↓
setMarkdown(text) // Populate editor
  ↓
applyLayout(nodes, edges, layout) // Apply loaded layout
```

**Error Handling**:
- File read error: Show file picker again
- Parse error: Show error, load as plain text in editor

### 6. File Save (User Saves Changes)

**Trigger**: User clicks Save button (Cmd/Ctrl+S)
**Timing**: Depends on file size

```
User presses Cmd+S
  ↓
serializeToMarkdown(nodes, edges, layout)
  ↓ (success)
Result.ok(markdownText)
  ↓
writeTextToFile(handle, text, '.md')
  ↓
Show "Saved" notification
```

**Error Handling**:
- Serialize error: Show error, don't write file
- Write error: Show error, retry or save as new file

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│                  User Actions                    │
└───────┬────────────────────────┬─────────────────┘
        │                        │
        │ Types Markdown         │ Edits Canvas
        ↓                        ↓
┌──────────────┐          ┌──────────────┐
│MarkdownEditor│          │  Canvas      │
│  (Textarea)  │          │  (Nodes)     │
└───────┬──────┘          └────┬─────────┘
        │                      │
        │ 300ms debounce       │ immediate
        ↓                      ↓
┌────────────────────────────────────────┐
│       Repository Layer                  │
│  ┌────────────┐  ┌──────────────────┐ │
│  │ Parser     │  │ Serializer       │ │
│  │ (MD → Node)│  │ (Node → MD)      │ │
│  └────────────┘  └──────────────────┘ │
│  ┌────────────┐                        │
│  │ LayoutEngine│                        │
│  │ (BFS + Pos)│                        │
│  └────────────┘                        │
└────────┬──────────────┬────────────────┘
         │              │
         ↓              ↓
┌────────────────────────────────────────┐
│        Zustand Store (canvasStore)     │
│  nodes: Node[]                         │
│  edges: Edge[]                         │
│  layout: LayoutType                    │
│  markdown: string                      │
└────────┬──────────────┬────────────────┘
         │              │
         ↓              ↓
┌──────────────┐  ┌──────────────┐
│Editor Updates│  │Canvas Renders│
└──────────────┘  └──────────────┘
```

---

## Store Schema (Zustand)

```typescript
interface CanvasState {
  // Data
  nodes: Node[];
  edges: Edge[];
  layout: LayoutType;
  markdown: string;

  // UI State
  splitRatio: number;           // 30-70
  selectedNodeId: string | null;
  isLinkMode: boolean;

  // Actions (CRUD)
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (id: string) => void;

  // Layout Actions
  setLayout: (layout: LayoutType) => void;
  applyCurrentLayout: () => void;

  // Markdown Sync
  setMarkdown: (text: string) => void;
  parseAndUpdateNodes: (text: string) => void;
  serializeAndUpdateMarkdown: () => void;

  // Split Ratio
  setSplitRatio: (ratio: number) => void;
}
```

---

## Summary

This data model extends the existing node/edge system with:
1. **Discriminated union nodes** (text, header, code, image)
2. **Repository layer** for markdown ↔ graph conversion
3. **Layout state** (radial, horizontal)
4. **Split ratio** (30-70% constraint)
5. **Result types** for error handling (Constitution compliance)
6. **Clear state transitions** with timing guarantees

All entities follow Constitution principles:
- Error as value (Result types)
- Composition over inheritance (discriminated unions)
- Explicit dependencies (no hidden state)
- Factory functions (no constructors)

Next: Generate API contracts (`contracts/markdown-api.ts`)
