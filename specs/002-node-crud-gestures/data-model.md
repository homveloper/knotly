# Data Model: Interactive Graph Editor

**Feature**: Interactive Graph Editor with Touch Gestures
**Branch**: 002-node-crud-gestures
**Date**: 2025-10-17

## Entity Definitions

This document defines the core data entities for the interactive graph editor, extracted from the feature specification and designed following composition principles.

---

## 1. Node Entity

Represents a single idea or concept in the mind map.

### TypeScript Interface

```typescript
interface Node {
  // Identity
  id: string;                    // UUID v4 for global uniqueness

  // Positioning
  position: {
    x: number;                   // Canvas x-coordinate (can be negative)
    y: number;                   // Canvas y-coordinate (can be negative)
  };

  // Content
  content: string;               // User-entered text (unlimited length)

  // Visual Style
  type: 'circle';                // Shape type (only circles in this phase)
  style: {
    backgroundColor: string;     // Hex color: '#FFE082' (yellow), '#90CAF9' (sky blue), '#A5D6A7' (mint)
    strokeColor: string;         // Border color, default '#000'
    strokeWidth: number;         // Border thickness in pixels, default 2
  };

  // Metadata
  createdAt: number;             // Unix timestamp in milliseconds
  updatedAt: number;             // Unix timestamp in milliseconds, updated on content/style changes
}
```

### Constraints and Validation Rules

1. **ID Generation**:
   - MUST use UUID v4 via `uuid` library
   - MUST be globally unique within the application instance

2. **Position**:
   - No minimum/maximum constraints (infinite canvas)
   - MUST be stored in canvas coordinates (not screen pixels)
   - Grid snapping (when enabled) rounds to nearest 20px multiple

3. **Content**:
   - No character limit enforced
   - Empty string `''` is valid (new nodes start empty)
   - Text overflow handled by component layer with vertical scrolling

4. **Type**:
   - Literal type `'circle'` enforced by TypeScript
   - Future milestones will add 'rectangle', 'cloud', etc.

5. **Style**:
   - `backgroundColor` MUST be one of three values in this phase:
     - `'#FFE082'` (yellow, default)
     - `'#90CAF9'` (sky blue)
     - `'#A5D6A7'` (mint)
   - `strokeColor` MUST be valid hex color
   - `strokeWidth` MUST be positive number (typically 2)

6. **Timestamps**:
   - `createdAt` set once on creation, never updated
   - `updatedAt` set on creation and updated on any mutation
   - Both use `Date.now()` for consistency

### Fixed Dimensions (Not Stored in Model)

Per spec clarification Q2, all nodes have fixed visual dimensions:
- **Diameter**: 120 pixels (defined in component layer, not model)
- **Touch Target**: Minimum 44 pixels (satisfied by 120px diameter)

These are rendering constants, not stored in the Node entity.

---

## 2. Edge (Link) Entity

Represents a directional connection between two nodes, expressing a relationship or dependency.

### TypeScript Interface

```typescript
interface Edge {
  // Identity
  id: string;                    // UUID v4 for global uniqueness

  // Topology
  fromId: string;                // Source node ID (must reference existing Node)
  toId: string;                  // Target node ID (must reference existing Node)

  // Visual Style
  lineStyle: 'dashed';           // Line pattern (only dashed in this phase)

  // Metadata
  createdAt: number;             // Unix timestamp in milliseconds
}
```

### Constraints and Validation Rules

1. **ID Generation**:
   - MUST use UUID v4 via `uuid` library
   - MUST be globally unique within the application instance

2. **Node References**:
   - `fromId` MUST reference an existing Node's `id`
   - `toId` MUST reference an existing Node's `id`
   - `fromId` and `toId` MAY be equal (self-loops prevented by UI, but not by data model)
   - Referential integrity: deleting a node MUST cascade-delete all edges where `fromId === nodeId || toId === nodeId`

3. **Duplicate Connections**:
   - System allows multiple edges between same node pair
   - No uniqueness constraint on (fromId, toId) tuple in this phase

4. **Directionality**:
   - Edges are stored directionally (from → to) for data modeling
   - **Visual Rendering**: Per spec clarification Q1, edges are rendered as **bidirectional** lines with no arrow heads
   - This separation allows future phases to add directional indicators while maintaining data integrity

5. **Line Style**:
   - Literal type `'dashed'` enforced by TypeScript
   - Future milestones will add 'solid', 'curved', 'arrow' styles
   - Rendered with rough.js strokeLineDash: [5, 5]

6. **Timestamp**:
   - `createdAt` set once on creation
   - No `updatedAt` field (edges are immutable after creation; delete and recreate to change)

### Edge Rendering (Not Stored in Model)

Visual properties defined in component layer:
- **Stroke Width**: 2 pixels
- **Stroke Color**: '#666' (gray)
- **Dash Pattern**: [5, 5] (5px dash, 5px gap)
- **Seed**: Derived from edge.id hash for consistent rough.js rendering

---

## 3. Canvas State Entity

Represents the viewport and navigation state of the infinite canvas workspace.

### TypeScript Interface

```typescript
interface CanvasState {
  // Navigation
  zoom: number;                  // Zoom level, range [0.5, 3.0]
  pan: {
    x: number;                   // Horizontal pan offset in pixels
    y: number;                   // Vertical pan offset in pixels
  };

  // Grid Settings
  gridEnabled: boolean;          // Show/hide grid background
  snapEnabled: boolean;          // Enable/disable snap-to-grid on node movement
}
```

### Constraints and Validation Rules

1. **Zoom Level**:
   - MUST be clamped between 0.5 (50% zoom out) and 3.0 (300% zoom in)
   - Default: 1.0 (100%, no zoom)
   - Gesture detection threshold: >10px finger spread triggers zoom

2. **Pan Offset**:
   - No minimum/maximum constraints (infinite canvas)
   - Represents viewport translation in canvas coordinates
   - Default: `{x: 0, y: 0}` (viewport origin at canvas origin)
   - Gesture detection threshold: >15px parallel finger movement triggers pan

3. **Grid Settings**:
   - `gridEnabled` and `snapEnabled` are independent toggles
   - Grid can be visible without snap enabled (visual guide only)
   - Snap can be enabled without grid visible (invisible alignment)
   - Grid spacing: 20 pixels (fixed constant, not stored)

### State Persistence

- **Storage**: In-memory only (Zustand store without persistence middleware)
- **Lifecycle**: State lost on page refresh per prototype requirements
- **Future**: Milestone 3+ will add localStorage or backend persistence

---

## 4. UI Interaction State (Not Persisted)

Ephemeral state managed in React component layer, not Zustand store:

### Context Menu State
```typescript
interface ContextMenuState {
  visible: boolean;              // Is context menu shown?
  nodeId: string | null;         // Which node triggered it?
  position: { x: number; y: number }; // Screen coordinates for positioning
}
```

### Mention Sheet State
```typescript
interface MentionSheetState {
  visible: boolean;              // Is mention sheet shown?
  currentNodeId: string;         // Node being edited
  filterText: string;            // Text after @ symbol for filtering
}
```

### Link Mode State
```typescript
interface LinkModeState {
  active: boolean;               // Is link mode enabled?
  firstNodeId: string | null;    // First node selected (source)
}
```

**Rationale for Component-Local State**:
- These states are transient UI concerns, not domain data
- Keeping them local simplifies component logic
- No need to synchronize across components

---

## Zustand Store Structure

Complete store interface combining all entities:

```typescript
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface CanvasStore {
  // Domain Entities
  nodes: Node[];
  edges: Edge[];

  // Canvas State
  zoom: number;
  pan: { x: number; y: number };
  gridEnabled: boolean;
  snapEnabled: boolean;

  // Node Actions
  createNode: (position: { x: number; y: number }) => void;
  updateNode: (id: string, updates: Partial<Omit<Node, 'id' | 'createdAt'>>) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;

  // Edge Actions
  createEdge: (fromId: string, toId: string) => void;
  deleteEdge: (id: string) => void;
  selectEdge: (id: string | null) => void;
  selectedEdgeId: string | null;

  // Canvas Actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
}
```

---

## Entity Relationships

```
┌─────────────┐
│    Node     │
│  (id, pos,  │
│   content)  │
└──────┬──────┘
       │
       │ 1
       │
       │ *
┌──────▼──────┐
│    Edge     │
│ (fromId,    │
│  toId)      │
└─────────────┘

1 Node : * Edges (one node can have many edges)
Edge references 2 Nodes (fromId, toId)

Canvas State (global singleton)
- Contains arrays of Nodes and Edges
- Manages zoom, pan, grid settings
```

### Referential Integrity Rules

1. **Edge Creation**:
   - MUST validate that both `fromId` and `toId` reference existing nodes
   - SHOULD return error if validation fails (not implemented in prototype)

2. **Node Deletion**:
   - MUST cascade-delete all edges where `edge.fromId === nodeId || edge.toId === nodeId`
   - Implemented in `deleteNode` action

3. **Orphaned Edges**:
   - No orphaned edges should exist (prevented by cascade delete)
   - If data integrity is violated, edges with missing nodes should be filtered in render

---

## State Update Patterns

Following Zustand best practices and immutability principles:

### Example: Create Node
```typescript
createNode: (position) => set((state) => ({
  nodes: [
    ...state.nodes,
    {
      id: uuidv4(),
      position: state.snapEnabled
        ? { x: Math.round(position.x / 20) * 20, y: Math.round(position.y / 20) * 20 }
        : position,
      content: '',
      type: 'circle',
      style: { backgroundColor: '#FFE082', strokeColor: '#000', strokeWidth: 2 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  ]
}))
```

### Example: Update Node (Partial Updates)
```typescript
updateNode: (id, updates) => set((state) => ({
  nodes: state.nodes.map(node =>
    node.id === id
      ? { ...node, ...updates, updatedAt: Date.now() }
      : node
  )
}))
```

### Example: Delete Node (Cascade Edges)
```typescript
deleteNode: (id) => set((state) => ({
  nodes: state.nodes.filter(n => n.id !== id),
  edges: state.edges.filter(e => e.fromId !== id && e.toId !== id)
}))
```

---

## Summary

All entities follow composition principles:
- ✅ No inheritance hierarchies
- ✅ Simple data structures with explicit fields
- ✅ Validation rules documented (implementation deferred per prototype scope)
- ✅ Referential integrity enforced at delete operations
- ✅ Immutable update patterns using spread operators
- ✅ TypeScript strict mode compatibility

Data model is ready for implementation in Phase 2 tasks.
