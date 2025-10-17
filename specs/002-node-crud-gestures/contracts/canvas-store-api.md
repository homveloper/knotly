# Canvas Store API Contract

**Feature**: Interactive Graph Editor with Touch Gestures
**Store**: Zustand Canvas Store
**Date**: 2025-10-17

## Overview

This document defines the API contract for the `canvasStore` Zustand store, which serves as the single source of truth for canvas state in the interactive graph editor.

**Contract Type**: Internal TypeScript API (not REST/GraphQL)
**Location**: `knotly-frontend/src/store/canvasStore.ts`
**Consumers**: React components in `src/components/`

---

## Store Interface

```typescript
interface CanvasStore {
  // === State ===
  nodes: Node[];
  edges: Edge[];
  zoom: number;
  pan: { x: number; y: number };
  gridEnabled: boolean;
  snapEnabled: boolean;
  selectedEdgeId: string | null;

  // === Node Operations ===
  createNode: (position: { x: number; y: number }) => void;
  updateNode: (id: string, updates: Partial<Omit<Node, 'id' | 'createdAt'>>) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;

  // === Edge Operations ===
  createEdge: (fromId: string, toId: string) => void;
  deleteEdge: (id: string) => void;
  selectEdge: (id: string | null) => void;

  // === Canvas Operations ===
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
}
```

---

## Node Operations

### `createNode(position: { x: number; y: number }): void`

Creates a new node at the specified canvas position.

**Parameters**:
- `position.x`: X-coordinate in canvas space (number, can be negative)
- `position.y`: Y-coordinate in canvas space (number, can be negative)

**Behavior**:
1. Generates UUID v4 for new node ID
2. If `snapEnabled === true`, rounds position to nearest 20px grid
3. Creates node with default style: `{backgroundColor: '#FFE082', strokeColor: '#000', strokeWidth: 2}`
4. Sets `content` to empty string `''`
5. Sets `type` to `'circle'`
6. Sets `createdAt` and `updatedAt` to `Date.now()`
7. Appends new node to `nodes` array

**Side Effects**:
- Mutates `nodes` array (immutable update via Zustand `set`)

**Example**:
```typescript
const { createNode } = useCanvasStore();
createNode({ x: 400, y: 300 });
```

**Validation**:
- None in prototype phase (all positions valid)
- Future: Add bounds checking or error handling

---

### `updateNode(id: string, updates: Partial<Omit<Node, 'id' | 'createdAt'>>): void`

Updates mutable fields of an existing node.

**Parameters**:
- `id`: Node UUID to update (string)
- `updates`: Partial object containing fields to update (object)
  - Allowed fields: `position`, `content`, `style`, `type`, `updatedAt`
  - Cannot update: `id`, `createdAt`

**Behavior**:
1. Finds node by ID in `nodes` array
2. Spreads `updates` onto existing node
3. Automatically sets `updatedAt` to `Date.now()`
4. If node not found, operation is silently ignored (no error)

**Side Effects**:
- Mutates `nodes` array (immutable update via Zustand `set`)

**Example**:
```typescript
const { updateNode } = useCanvasStore();

// Update content
updateNode('node-uuid-123', { content: 'New text' });

// Update background color
updateNode('node-uuid-123', {
  style: { backgroundColor: '#90CAF9', strokeColor: '#000', strokeWidth: 2 }
});
```

**Validation**:
- None (assumes valid input)
- Future: Add style validation (color format, allowed colors)

---

### `moveNode(id: string, position: { x: number; y: number }): void`

Updates a node's position, applying grid snap if enabled.

**Parameters**:
- `id`: Node UUID to move (string)
- `position.x`: New X-coordinate in canvas space (number)
- `position.y`: New Y-coordinate in canvas space (number)

**Behavior**:
1. Finds node by ID
2. If `snapEnabled === true`:
   - Rounds `x` to nearest 20px: `Math.round(x / 20) * 20`
   - Rounds `y` to nearest 20px: `Math.round(y / 20) * 20`
3. Otherwise, uses exact position
4. Updates `position` field
5. Sets `updatedAt` to `Date.now()`

**Side Effects**:
- Mutates `nodes` array (immutable update via Zustand `set`)

**Example**:
```typescript
const { moveNode, snapEnabled } = useCanvasStore();

// With snap disabled: exact position
moveNode('node-uuid-123', { x: 437, y: 283 }); // → (437, 283)

// With snap enabled: rounded position
// snapEnabled = true
moveNode('node-uuid-123', { x: 437, y: 283 }); // → (440, 280)
```

**Validation**:
- None (all positions valid)

---

### `deleteNode(id: string): void`

Deletes a node and all connected edges (cascade delete).

**Parameters**:
- `id`: Node UUID to delete (string)

**Behavior**:
1. Removes node from `nodes` array where `node.id === id`
2. Removes all edges where `edge.fromId === id || edge.toId === id`
3. If node not found, operation is silently ignored

**Side Effects**:
- Mutates `nodes` array
- Mutates `edges` array (cascade delete)
- If `selectedEdgeId` pointed to a deleted edge, it becomes orphaned (not cleared)

**Example**:
```typescript
const { deleteNode } = useCanvasStore();
deleteNode('node-uuid-123');
// Also deletes any edges connected to 'node-uuid-123'
```

**Referential Integrity**:
- ✅ Maintains integrity by cascade-deleting edges
- Future: Add confirmation dialog for nodes with many connections

---

## Edge Operations

### `createEdge(fromId: string, toId: string): void`

Creates a new edge connecting two nodes.

**Parameters**:
- `fromId`: Source node UUID (string)
- `toId`: Target node UUID (string)

**Behavior**:
1. Generates UUID v4 for new edge ID
2. Creates edge with:
   - `fromId`, `toId` as provided
   - `lineStyle: 'dashed'`
   - `createdAt: Date.now()`
3. Appends edge to `edges` array
4. **No validation** of node existence in prototype phase

**Side Effects**:
- Mutates `edges` array (immutable update via Zustand `set`)

**Example**:
```typescript
const { createEdge } = useCanvasStore();
createEdge('node-uuid-123', 'node-uuid-456');
```

**Validation** (Current):
- None (assumes valid node IDs)

**Validation** (Recommended Future):
```typescript
createEdge: (fromId, toId) => set((state) => {
  const fromExists = state.nodes.some(n => n.id === fromId);
  const toExists = state.nodes.some(n => n.id === toId);

  if (!fromExists || !toExists) {
    console.error('Cannot create edge: one or both nodes do not exist');
    return state; // No mutation
  }

  if (fromId === toId) {
    console.warn('Self-loops not recommended');
    // Allow or prevent based on requirements
  }

  return {
    edges: [...state.edges, {
      id: uuidv4(),
      fromId,
      toId,
      lineStyle: 'dashed',
      createdAt: Date.now(),
    }]
  };
})
```

---

### `deleteEdge(id: string): void`

Deletes a single edge by ID.

**Parameters**:
- `id`: Edge UUID to delete (string)

**Behavior**:
1. Removes edge from `edges` array where `edge.id === id`
2. If edge not found, operation is silently ignored

**Side Effects**:
- Mutates `edges` array
- If `selectedEdgeId === id`, it becomes orphaned (not cleared)

**Example**:
```typescript
const { deleteEdge } = useCanvasStore();
deleteEdge('edge-uuid-789');
```

---

### `selectEdge(id: string | null): void`

Marks an edge as selected (visual highlight) or clears selection.

**Parameters**:
- `id`: Edge UUID to select, or `null` to clear selection (string | null)

**Behavior**:
1. Sets `selectedEdgeId` to provided value
2. If `id` is `null`, clears selection
3. No validation that edge exists

**Side Effects**:
- Mutates `selectedEdgeId` field

**Example**:
```typescript
const { selectEdge, selectedEdgeId } = useCanvasStore();

// Select edge
selectEdge('edge-uuid-789');

// Clear selection
selectEdge(null);
```

**Usage in Components**:
```typescript
function EdgeComponent({ edge }: { edge: Edge }) {
  const { selectedEdgeId, selectEdge } = useCanvasStore();
  const isSelected = selectedEdgeId === edge.id;

  return (
    <line
      onClick={() => selectEdge(edge.id)}
      stroke={isSelected ? '#2196F3' : '#666'}
      // ... other props
    />
  );
}
```

---

## Canvas Operations

### `setZoom(zoom: number): void`

Sets the canvas zoom level within allowed range.

**Parameters**:
- `zoom`: Zoom multiplier (number, range [0.5, 3.0])

**Behavior**:
1. Clamps `zoom` to range [0.5, 3.0]:
   - `Math.max(0.5, Math.min(3.0, zoom))`
2. Updates `zoom` field

**Side Effects**:
- Mutates `zoom` field

**Example**:
```typescript
const { setZoom } = useCanvasStore();

setZoom(1.5);  // 150% zoom
setZoom(0.3);  // Clamped to 0.5
setZoom(5.0);  // Clamped to 3.0
```

**Gesture Integration**:
```typescript
const bind = useGesture({
  onPinch: ({ offset: [scale] }) => {
    setZoom(scale); // Clamping handled by setZoom
  },
});
```

---

### `setPan(pan: { x: number; y: number }): void`

Sets the canvas pan offset (viewport translation).

**Parameters**:
- `pan.x`: Horizontal offset in pixels (number, no constraints)
- `pan.y`: Vertical offset in pixels (number, no constraints)

**Behavior**:
1. Updates `pan` field with provided coordinates
2. No clamping or validation (infinite canvas)

**Side Effects**:
- Mutates `pan` field

**Example**:
```typescript
const { setPan } = useCanvasStore();

setPan({ x: -100, y: -200 }); // Pan viewport 100px left, 200px up
```

**Gesture Integration**:
```typescript
const bind = useGesture({
  onDrag: ({ delta: [dx, dy], touches }) => {
    if (touches >= 2) {
      setPan({ x: pan.x + dx, y: pan.y + dy });
    }
  },
});
```

---

### `toggleGrid(): void`

Toggles grid background visibility.

**Parameters**: None

**Behavior**:
1. Flips `gridEnabled` boolean: `!gridEnabled`
2. Affects only visual rendering (grid lines in GridBackground component)
3. Does NOT affect `snapEnabled` (independent setting)

**Side Effects**:
- Mutates `gridEnabled` field

**Example**:
```typescript
const { toggleGrid, gridEnabled } = useCanvasStore();

console.log(gridEnabled); // false
toggleGrid();
console.log(gridEnabled); // true
```

---

### `toggleSnap(): void`

Toggles snap-to-grid behavior for node movement.

**Parameters**: None

**Behavior**:
1. Flips `snapEnabled` boolean: `!snapEnabled`
2. Affects `moveNode()` and `createNode()` position calculations
3. Does NOT affect `gridEnabled` (independent setting)

**Side Effects**:
- Mutates `snapEnabled` field

**Example**:
```typescript
const { toggleSnap, snapEnabled } = useCanvasStore();

console.log(snapEnabled); // false
toggleSnap();
console.log(snapEnabled); // true
```

---

## State Selectors

Zustand allows selective subscriptions to prevent unnecessary re-renders.

### Full State Subscription (Performance Warning)
```typescript
// ⚠️ Re-renders on ANY state change
const state = useCanvasStore();
```

### Selective Subscriptions (Recommended)
```typescript
// ✅ Only re-renders when nodes array changes
const nodes = useCanvasStore((state) => state.nodes);

// ✅ Only re-renders when zoom changes
const zoom = useCanvasStore((state) => state.zoom);

// ✅ Multiple selectors
const { nodes, edges, zoom } = useCanvasStore((state) => ({
  nodes: state.nodes,
  edges: state.edges,
  zoom: state.zoom,
}));
```

---

## Immutability Guarantees

All mutations use Zustand's `set()` function with immutable update patterns:

```typescript
// ✅ CORRECT: Spread operator creates new array
set((state) => ({
  nodes: [...state.nodes, newNode]
}))

// ✅ CORRECT: map creates new array
set((state) => ({
  nodes: state.nodes.map(n => n.id === id ? { ...n, content } : n)
}))

// ❌ WRONG: Mutates existing array
set((state) => {
  state.nodes.push(newNode); // Don't do this!
  return { nodes: state.nodes };
})
```

---

## Error Handling Strategy

**Current Approach** (Prototype Phase):
- No error handling or validation
- Invalid operations silently ignored
- Assumes all inputs are valid

**Future Approach** (Production):
- Return `Result<T, Error>` types from actions
- Validate node/edge existence before mutations
- Surface errors to UI layer for user feedback

Example future pattern:
```typescript
createEdge: (fromId, toId) => {
  const result = EdgeValidator.validate(fromId, toId, state.nodes);
  if (!result.success) {
    return { error: result.error }; // Return error to component
  }
  // ... proceed with creation
}
```

---

## Summary

The Canvas Store API provides:
- ✅ 10 action methods (4 node, 3 edge, 3 canvas)
- ✅ 7 state fields
- ✅ Immutable update patterns
- ✅ TypeScript type safety
- ⚠️ No validation in prototype (deferred to production)
- ⚠️ No error handling (silently ignores invalid operations)

This contract serves as the interface between React components and domain state, maintaining separation of concerns and enabling future refactoring.
