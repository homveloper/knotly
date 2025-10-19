# Data Model: Markdown File-Based Mind Map with Token System

**Feature**: 003-markdown-file-tokens
**Date**: 2025-10-19
**Status**: Phase 1 Design

## Core Entities

### 1. KnotlyFile

**Purpose**: Represents a complete mind map document persisted as a .knotly.md file

**Structure**:
```typescript
interface KnotlyFile {
  // File metadata (not stored in file, maintained by app)
  readonly filePath: string;           // Full file path (for display and recent files list)
  readonly fileHandle: FileSystemFileHandle | null;  // Browser API handle for re-saving
  readonly lastModified: Date;         // File system timestamp

  // File content (serialized to YAML frontmatter)
  tokens: TokenDefinitions;            // Token library (atomic + composite)
  nodes: NodeMetadata[];               // Node metadata (position, style)
  edges: EdgeTuple[];                  // Edge connections (compact format)

  // Node content (serialized to markdown body)
  nodeContent: Map<string, string>;    // Map<nodeId, markdownText>
}
```

**Serialization Format**:
```markdown
---
tokens:
  color-blue: {stroke: '#2563eb', fill: '#dbeafe'}
  color-red: {stroke: '#dc2626', fill: '#fee2e2'}
  h4: {width: 200, height: 140, fontSize: 16}
  neat: {roughness: 1.0}
  heading-primary: 'color-blue h3 bold'

nodes:
  - {id: node-abc123, pos: [100, 200], style: 'color-blue h4 neat'}
  - {id: node-def456, pos: [300, 250], style: 'color-red h4 neat'}

edges:
  - [node-abc123, node-def456]
---

[node-abc123]
This is the content for the first node.
It can span multiple lines.

[node-def456]
This is the second node's content.
```

**Validation Rules**:
- File extension MUST be `.knotly.md`
- YAML frontmatter MUST be delimited by `---` on separate lines
- Frontmatter MUST contain `tokens`, `nodes`, `edges` keys (empty arrays/objects allowed)
- All `nodeId` references in edges MUST exist in nodes array
- All `nodeId` keys in markdown body SHOULD have corresponding node in frontmatter (orphan content ignored)
- Duplicate node IDs → auto-generate new ID for duplicates, log warning to console

**State Transitions**:
1. **New File**: `{tokens: DEFAULT_TOKENS, nodes: [], edges: [], nodeContent: Map()}`
2. **File Loaded**: Parse YAML + markdown → populate all fields
3. **File Modified**: Set `hasUnsavedChanges: true` on any node/edge/content change
4. **File Saved**: Serialize to .knotly.md format → clear `hasUnsavedChanges`
5. **File Closed**: Discard in-memory state (no auto-save per spec constraint)

---

### 2. Node (Domain Model)

**Purpose**: Represents a single thought/idea box on the canvas with position and styling

**Structure**:
```typescript
interface Node {
  // Identity
  readonly id: string;                 // UUID v4 (e.g., "node-a1b2c3d4")

  // Spatial properties
  position: {x: number; y: number};    // Canvas coordinates (can be negative, clamped to ±10,000)

  // Content
  content: string;                     // Plain text only (no markdown rendering per spec)

  // Styling (token-based)
  style: string;                       // Space-separated token string (e.g., "color-blue h4 neat")

  // Metadata
  readonly type: 'circle';             // Fixed type (future: 'rectangle', 'diamond')
  readonly createdAt: number;          // Unix timestamp (ms)
  updatedAt: number;                   // Unix timestamp (ms), updated on content/position/style change
}
```

**Validation Rules**:
- `id` MUST be unique across all nodes in a file
- `id` MUST match pattern `^node-[a-f0-9]{8}$` or be valid UUID v4
- `position.x` and `position.y` MUST be clamped to range [-10000, 10000] (prevent extreme off-canvas values)
- `content` MUST be plain text (no HTML, no markdown rendering)
- `content` length SHOULD be < 5000 characters (UI warning if exceeded, no hard limit)
- `style` MUST be string (empty string allowed, defaults to "color-yellow h4 neat")
- `type` is always 'circle' in current implementation (enum prepared for future extension)

**Factory Function**:
```typescript
function createNode(
  position: {x: number; y: number},
  selectedNodeId?: string
): {node: Node; edge?: Edge} {
  // Validate and clamp position
  const clampedPos = {
    x: Math.max(-10000, Math.min(10000, position.x)),
    y: Math.max(-10000, Math.min(10000, position.y))
  };

  const newNode: Node = {
    id: `node-${uuid().substring(0, 8)}`,
    position: clampedPos,
    content: '',
    style: 'color-yellow h4 neat',  // Default style
    type: 'circle',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Auto-connect to selected node if provided
  if (selectedNodeId) {
    const edge = createEdge(selectedNodeId, newNode.id);
    return {node: newNode, edge};
  }

  return {node: newNode};
}
```

**Relationships**:
- **Has Many** Edges (as source or target)
- **Belongs To** KnotlyFile (via serialization)
- **Uses** TokenDefinitions (for style resolution)

---

### 3. Edge (Domain Model)

**Purpose**: Represents a connection/relationship between two nodes

**Structure**:
```typescript
interface Edge {
  // Identity
  readonly id: string;                 // UUID v4

  // Connection
  readonly fromId: string;             // Source node ID
  readonly toId: string;               // Target node ID

  // Styling
  lineStyle: 'dashed' | 'solid';       // Line pattern (future: 'dotted', 'wavy')

  // Metadata
  readonly createdAt: number;          // Unix timestamp (ms)
}
```

**Validation Rules**:
- `id` MUST be unique across all edges in a file
- `fromId` and `toId` MUST reference existing nodes
- `fromId` MUST NOT equal `toId` (no self-loops)
- Duplicate edges (same fromId/toId pair) MUST be prevented (check both directions for undirected semantics)

**Factory Function**:
```typescript
function createEdge(fromId: string, toId: string): Edge | null {
  // Prevent self-loops
  if (fromId === toId) {
    console.warn('Cannot create self-loop edge');
    return null;
  }

  // Check if nodes exist (in Zustand store context)
  const {nodes, edges} = useCanvasStore.getState();
  const fromExists = nodes.some(n => n.id === fromId);
  const toExists = nodes.some(n => n.id === toId);

  if (!fromExists || !toExists) {
    console.warn('Cannot create edge: node not found');
    return null;
  }

  // Prevent duplicates (bidirectional check)
  const exists = edges.some(e =>
    (e.fromId === fromId && e.toId === toId) ||
    (e.fromId === toId && e.toId === fromId)
  );

  if (exists) {
    console.warn('Edge already exists');
    return null;
  }

  return {
    id: `edge-${uuid().substring(0, 8)}`,
    fromId,
    toId,
    lineStyle: 'dashed',
    createdAt: Date.now()
  };
}
```

**Serialization**:
- Stored in YAML frontmatter as compact tuple: `[fromId, toId]`
- Deserialized to full Edge object with generated ID and default lineStyle
- Example:
  ```yaml
  edges:
    - [node-abc123, node-def456]
    - [node-def456, node-ghi789]
  ```

**Relationships**:
- **Belongs To** two Nodes (fromId, toId)
- **Belongs To** KnotlyFile (via serialization)

---

### 4. TokenDefinition (Styling System)

**Purpose**: Defines reusable style units that can be atomic (single properties) or composite (combinations)

**Structure**:
```typescript
type TokenDefinitions = {
  [tokenName: string]: StyleObject | string;
};

interface StyleObject {
  // Visual properties
  stroke?: string;        // CSS color (e.g., '#2563eb', 'rgb(37, 99, 235)')
  fill?: string;          // CSS color
  strokeWidth?: number;   // Line thickness (1-10)

  // Geometric properties
  width?: number;         // Node width in pixels (80-400)
  height?: number;        // Node height in pixels (60-300)

  // Typography
  fontSize?: number;      // Font size in pixels (10-32)
  fontWeight?: number;    // Font weight (100-900)

  // rough.js specific
  roughness?: number;     // Hand-drawn effect intensity (0.0-3.0)
  seed?: number;          // Random seed for consistent rendering (optional, auto-generated from node ID)
}

// Atomic token example
const atomicToken: StyleObject = {
  stroke: '#2563eb',
  fill: '#dbeafe'
};

// Composite token example
const compositeToken: string = 'color-blue h4 neat';
```

**Default Token Library**:
```typescript
export const DEFAULT_TOKENS: TokenDefinitions = {
  // Colors (8)
  'color-blue': {stroke: '#2563eb', fill: '#dbeafe'},
  'color-red': {stroke: '#dc2626', fill: '#fee2e2'},
  'color-mint': {stroke: '#059669', fill: '#d1fae5'},
  'color-yellow': {stroke: '#ca8a04', fill: '#fef9c3'},
  'color-gray': {stroke: '#64748b', fill: '#f1f5f9'},
  'color-purple': {stroke: '#7c3aed', fill: '#ede9fe'},
  'color-orange': {stroke: '#ea580c', fill: '#fed7aa'},
  'color-pink': {stroke: '#db2777', fill: '#fce7f3'},

  // Sizes (6) - h1 is largest, h6 is smallest
  'h1': {width: 320, height: 200, fontSize: 24},
  'h2': {width: 280, height: 180, fontSize: 20},
  'h3': {width: 240, height: 160, fontSize: 18},
  'h4': {width: 200, height: 140, fontSize: 16},
  'h5': {width: 180, height: 120, fontSize: 14},
  'h6': {width: 160, height: 100, fontSize: 12},

  // Feel (5) - roughness levels
  'smooth': {roughness: 0.5},
  'neat': {roughness: 1.0},
  'rough': {roughness: 1.5},
  'sketchy': {roughness: 2.0},
  'messy': {roughness: 2.5},

  // Border (4) - stroke width
  'thin': {strokeWidth: 1},
  'normal': {strokeWidth: 2},
  'thick': {strokeWidth: 3},
  'bold': {strokeWidth: 4}
};
```

**Validation Rules**:
- Token names MUST follow pattern `^[a-z][a-z0-9-]*$` (lowercase, hyphens allowed, start with letter)
- Token names MUST NOT be reserved keywords: `true`, `false`, `null`, `undefined`
- Atomic token values MUST be valid StyleObject (at least one property defined)
- Composite token values MUST be strings (space-separated token references)
- Recursion depth MUST NOT exceed 10 levels (prevents infinite loops)
- Unknown token references in composite strings → skip silently with console.warn

**Token Resolution Algorithm**:
```typescript
function parseTokens(
  style: string,
  tokenDefinitions: TokenDefinitions,
  depth = 0
): StyleObject {
  if (depth > 10) {
    console.warn('Token recursion depth exceeded');
    return {};
  }

  const tokens = style.split(' ').filter(Boolean);
  let result: StyleObject = {};

  for (const tokenName of tokens) {
    const value = tokenDefinitions[tokenName];

    if (!value) {
      console.warn(`Unknown token: ${tokenName}`);
      continue;  // Skip unknown, no error
    }

    // Composite token: recursively expand
    if (typeof value === 'string') {
      const expanded = parseTokens(value, tokenDefinitions, depth + 1);
      Object.assign(result, expanded);  // Last-token-wins merge
    }
    // Atomic token: merge directly
    else {
      Object.assign(result, value);
    }
  }

  return result;
}
```

**Example Token Composition**:
```typescript
// User defines custom token in YAML:
tokens:
  heading-primary: 'color-blue h3 bold'
  note-warning: 'color-red h4 thick'

// User applies to node:
node.style = "heading-primary neat"

// Parser expands:
// Step 1: heading-primary → 'color-blue h3 bold'
// Step 2: Expand each: color-blue → {stroke: ..., fill: ...}
//                       h3 → {width: 240, height: 160, fontSize: 18}
//                       bold → {strokeWidth: 4}
//                       neat → {roughness: 1.0}
// Step 3: Merge (last-token-wins):
//   {stroke: '#2563eb', fill: '#dbeafe', width: 240, height: 160, fontSize: 18, strokeWidth: 4, roughness: 1.0}
```

---

### 5. CanvasState (Application State)

**Purpose**: Complete in-memory state of the mind map editor (Zustand store)

**Structure**:
```typescript
interface CanvasState {
  // Canvas viewport (Milestone 2 - preserved)
  zoom: number;                        // Zoom level (0.1 - 5.0)
  pan: {x: number; y: number};         // Viewport offset

  // Content (Milestone 2 - extended)
  nodes: Node[];
  edges: Edge[];

  // Selection state (Milestone 2 - preserved)
  selectedNodeId: string | null;       // Currently selected node (highlighted)
  editingNodeId: string | null;        // Currently editing node (text input active)

  // Connection state (NEW)
  connectingFrom: string | null;       // Node ID in "connecting mode" (drag-to-connect or long-press)

  // File state (NEW)
  tokenDefinitions: TokenDefinitions;  // Merged DEFAULT_TOKENS + custom tokens from file
  currentFilePath: string | null;      // null = unsaved new note
  currentFileHandle: FileSystemFileHandle | null;  // For re-saving without picker
  hasUnsavedChanges: boolean;          // Dirty flag (show ● in titlebar)
  recentFiles: string[];               // Recent file paths (persisted to localStorage)

  // Actions (Milestone 2 - preserved)
  createNode: (position: {x: number; y: number}) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  moveNode: (id: string, position: {x: number; y: number}) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  setEditingNode: (id: string | null) => void;

  // Actions (NEW)
  createEdge: (fromId: string, toId: string) => void;
  deleteEdge: (id: string) => void;
  setConnectingFrom: (id: string | null) => void;
  loadFile: (fileHandle: FileSystemFileHandle) => Promise<FileResult<void>>;
  saveFile: (fileHandle?: FileSystemFileHandle) => Promise<FileResult<void>>;
  markDirty: () => void;
  addRecentFile: (path: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: {x: number; y: number}) => void;
}
```

**Invariants**:
- `nodes` array MUST NOT contain duplicate IDs
- `edges` array MUST reference only existing nodes
- `editingNodeId` MUST be null or reference existing node
- `selectedNodeId` MUST be null or reference existing node
- `connectingFrom` MUST be null or reference existing node
- `tokenDefinitions` MUST always include DEFAULT_TOKENS (merged with custom)
- `currentFileHandle` MUST be null if browser doesn't support File System Access API

**Persistence**:
- `recentFiles` → localStorage (`knotly-recent-files` key, JSON array, max 5 entries)
- All other state → volatile (lost on page refresh, per spec: no cloud sync, no IndexedDB)

---

## Entity Relationships

```
KnotlyFile (1) ──< (N) Node
                  ╱  ╲
                 ╱    ╲
    TokenDefinitions   Edge (N) ── (2) Node (from/to)
                 ╲    ╱
                  ╲  ╱
               CanvasState (in-memory)
```

**Cardinality**:
- 1 KnotlyFile → N Nodes (0 to 10,000)
- 1 KnotlyFile → N Edges (0 to unlimited, typically ~2×nodes)
- 1 KnotlyFile → 1 TokenDefinitions (merged DEFAULT + custom)
- 1 Node → N Edges (as source or target)
- 1 Edge → 2 Nodes (fromId, toId)
- 1 CanvasState → 1 KnotlyFile (currently open)

---

## Data Flow

### File Load Sequence

```
1. User clicks "Open File"
2. Browser shows file picker (File System Access API)
3. User selects .knotly.md file
4. loadKnotlyFile(fileHandle) called
   a. Read file.text()
   b. Split YAML frontmatter and markdown body
   c. Parse YAML → {tokens, nodes, edges}
   d. Extract node content from markdown body via regex
   e. Return {success: true, data: {tokens, nodes, edges}}
5. Zustand store.loadFile(fileHandle) called
   a. Merge tokens with DEFAULT_TOKENS
   b. Set nodes, edges, tokenDefinitions
   c. Set currentFilePath, currentFileHandle
   d. Clear hasUnsavedChanges
6. React re-renders canvas with loaded nodes

Error handling:
- YAML parse error → {success: false, error: "Invalid YAML at line X"}
- Missing frontmatter → {success: false, error: "Missing YAML delimiters"}
- Invalid structure → {success: false, error: "Expected tokens/nodes/edges keys"}
```

### File Save Sequence

```
1. User presses Cmd/Ctrl+S (or clicks Save button)
2. Zustand store.saveFile(fileHandle?) called
3. If no fileHandle → show save picker → get new fileHandle
4. saveKnotlyFile(fileHandle, canvasState) called
   a. Serialize state to YAML frontmatter
   b. Serialize node content to markdown body
   c. Combine: "---\n{yaml}\n---\n\n{body}"
   d. Write to file via fileHandle.createWritable()
5. On success:
   a. Set currentFileHandle = fileHandle
   b. Clear hasUnsavedChanges
   c. Show ✓ indicator for 2 seconds
6. On error:
   a. Keep hasUnsavedChanges = true
   b. Show error toast: "Failed to save: {error}"
```

### Token Application Sequence

```
1. User right-clicks node → StylePanel opens
2. User clicks "color-blue" token button
3. StylePanel.toggleToken('color-blue') called
   a. Update local state: tokens = [...tokens, 'color-blue']
   b. Debounced store.updateNode(nodeId, {style: tokens.join(' ')})
4. Zustand store updates node.style = "color-blue h4 neat"
5. NodeComponent re-renders
   a. useMemo: parseTokens("color-blue h4 neat", tokenDefinitions)
   b. Resolved: {stroke: '#2563eb', fill: '#dbeafe', width: 200, ...}
   c. Pass to rough.js: rc.circle(x, y, width, {stroke, fill, roughness, ...})
6. Canvas re-renders with updated node appearance
```

---

## Data Validation Summary

| Entity | Validation | Enforcement Point |
|--------|-----------|-------------------|
| Node.id | Unique, UUID format | createNode factory |
| Node.position | Clamped [-10000, 10000] | createNode factory + moveNode action |
| Node.content | Plain text, <5000 chars | updateNode action (soft limit, warning only) |
| Node.style | String format | parseTokens (skip unknown tokens) |
| Edge.fromId/toId | Must reference existing nodes | createEdge factory |
| Edge self-loops | Prevented | createEdge factory |
| Edge duplicates | Prevented (bidirectional check) | createEdge factory |
| TokenDefinition | Valid StyleObject or string | YAML load validation |
| Token recursion | Max depth 10 | parseTokens function |
| YAML frontmatter | Valid structure (tokens/nodes/edges keys) | loadKnotlyFile function |

All validations return Result types (no exceptions thrown), allowing UI to display user-friendly error messages.

---

## Next Steps

1. Generate file format contract (JSON Schema for YAML frontmatter)
2. Write quickstart guide for creating first .knotly.md note
3. Update agent context with data model TypeScript interfaces
