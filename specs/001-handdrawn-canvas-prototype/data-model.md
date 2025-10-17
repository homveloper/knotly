# Data Model: Handdrawn Canvas Prototype

**Feature**: 001-handdrawn-canvas-prototype
**Date**: 2025-10-17
**Status**: Design phase

## Overview

This document defines the data entities for the hand-drawn canvas prototype. Since this is a static prototype with no user interaction or persistence, the data model is minimal and consists of a single Node entity with hardcoded values.

---

## Entity: Node

### Description
A Node represents a single visual element on the canvas. In this prototype, exactly one node is rendered at a fixed position with predefined styling and content.

### Properties

| Property | Type | Required | Description | Validation Rules |
|----------|------|----------|-------------|------------------|
| id | string | Yes | Unique identifier for the node | Non-empty string, unique within canvas |
| position | Position | Yes | X and Y coordinates for node center | Valid Position object (see below) |
| content | string | Yes | Text displayed inside the node | Non-empty string, Korean text supported |
| type | NodeType | Yes | Shape type of the node | Must be "circle" (only supported type in prototype) |
| style | NodeStyle | Yes | Visual styling properties | Valid NodeStyle object (see below) |

### Relationships
None - this prototype has a single isolated node with no connections or parent-child relationships.

### State Transitions
None - the node is static and never changes state after initial render.

---

## Value Object: Position

### Description
Represents the 2D coordinates of a node's center point on the canvas.

### Properties

| Property | Type | Required | Description | Validation Rules |
|----------|------|----------|-------------|------------------|
| x | number | Yes | Horizontal position (pixels from left) | Non-negative number, within canvas bounds (0-800) |
| y | number | Yes | Vertical position (pixels from top) | Non-negative number, within canvas bounds (0-600) |

### Example
```typescript
{
  x: 400,  // Center of 800px wide canvas
  y: 300   // Center of 600px tall canvas
}
```

---

## Value Object: NodeStyle

### Description
Visual styling properties for rendering a node with hand-drawn appearance.

### Properties

| Property | Type | Required | Description | Validation Rules |
|----------|------|----------|-------------|------------------|
| backgroundColor | string | Yes | Fill color in hex format | Valid hex color (e.g., #FFE082) |
| strokeColor | string | Yes | Outline color in hex format | Valid hex color (e.g., #000) |
| strokeWidth | number | Yes | Outline thickness in pixels | Positive number (typically 1-5) |

### Example
```typescript
{
  backgroundColor: "#FFE082",  // Yellow fill
  strokeColor: "#000",          // Black outline
  strokeWidth: 2                // 2px outline
}
```

### Notes
- The `backgroundColor` maps to rough.js `fill` option
- The `strokeColor` maps to rough.js `stroke` option
- The `strokeWidth` maps to rough.js `strokeWidth` option
- Additional rough.js options (roughness, fillStyle) are hardcoded in rendering logic, not stored in data model

---

## Enumeration: NodeType

### Description
Defines the available shape types for nodes.

### Values

| Value | Description | Support Status |
|-------|-------------|----------------|
| "circle" | Circular node shape | Supported in prototype |
| "rectangle" | Rectangular node shape | Not supported (future milestone) |
| "cloud" | Cloud-like organic shape | Not supported (future milestone) |

### Prototype Constraint
Only `"circle"` is implemented in this prototype. Other types are included for forward compatibility but will throw an error if used.

---

## Hardcoded Data: Prototype Node

### Purpose
This prototype uses a single hardcoded node to validate the visual design direction.

### Specification
```typescript
const prototypeNode: Node = {
  id: "node-1",
  position: {
    x: 400,  // Horizontal center of 800px canvas
    y: 300   // Vertical center of 600px canvas
  },
  content: "손글씨 노트 프로토타입",  // Korean: "Handwritten note prototype"
  type: "circle",
  style: {
    backgroundColor: "#FFE082",  // Yellow (warm, friendly color)
    strokeColor: "#000",          // Black (high contrast outline)
    strokeWidth: 2                // 2px stroke (visible but not overwhelming)
  }
};
```

### Rationale
- **Fixed position**: Centered for symmetry and visual appeal
- **Korean content**: Tests internationalization and Nanum Pen Script font
- **Yellow background**: Conveys warmth and friendliness (per UX goals)
- **Black outline**: Ensures readability and defines shape clearly
- **2px stroke**: Balances visibility with hand-drawn aesthetic

---

## Data Flow

### Rendering Pipeline
1. **Component mount**: Canvas component initializes
2. **Data retrieval**: Hardcoded `prototypeNode` object is accessed
3. **SVG setup**: useRef captures SVG DOM element
4. **rough.js rendering**:
   - Extract position: `(node.position.x, node.position.y)`
   - Calculate diameter: 150px (hardcoded for prototype)
   - Map style: `{fill: node.style.backgroundColor, stroke: node.style.strokeColor, strokeWidth: node.style.strokeWidth, roughness: 1.2}`
   - Generate path: `rough.svg(svgElement).circle(x, y, diameter, options)`
5. **Text rendering**: SVG text element with `node.content`, positioned at `(x, y+5)` for vertical centering
6. **DOM insertion**: Append rough.js path to SVG element

### No Persistence
- No data is saved to localStorage, backend, or files
- No data is loaded from external sources
- Node data exists only in component memory during page lifecycle

### No Mutations
- Node object is immutable (no setters or update methods)
- Render logic is pure (same input always produces same output)
- Re-renders use the same hardcoded node data

---

## Validation Rules Summary

### Node Entity
- `id`: Non-empty string ✅
- `position.x`: 0-800 range ✅ (400 is within bounds)
- `position.y`: 0-600 range ✅ (300 is within bounds)
- `content`: Non-empty string ✅
- `type`: Must be "circle" ✅
- `style.backgroundColor`: Valid hex color ✅
- `style.strokeColor`: Valid hex color ✅
- `style.strokeWidth`: Positive number ✅

### Prototype Data Validation
All hardcoded data meets validation rules. No runtime validation is needed since data is static and known to be valid at compile time.

---

## Future Extensions (Out of Scope for Prototype)

### Multiple Nodes
Future milestones will support arrays of nodes:
```typescript
type Canvas = {
  nodes: Node[];
  connections: Connection[];  // Lines between nodes
};
```

### Dynamic Data
Future milestones will support:
- User-created nodes via click/tap
- Draggable nodes (position mutations)
- Editable content (text input)
- Persistence (localStorage or backend sync)

### Additional Properties
Future nodes may include:
- `size: { width: number, height: number }` for non-circular shapes
- `rotation: number` for rotated nodes
- `zIndex: number` for layering
- `selected: boolean` for interaction state
- `metadata: Record<string, unknown>` for extensibility

### Validation Functions
Future implementation will require factory functions (per Constitution IV):
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function createNode(data: Partial<Node>): Result<Node, string> {
  // Validate all properties
  // Return Result type instead of throwing
}
```

---

## References

- **Feature Spec**: [spec.md](./spec.md) - Functional requirements FR-001 through FR-015
- **Constitution**: Immutability (Principle V), Factory Functions (Principle IV)
- **TypeScript Contract**: [contracts/node-structure.ts](./contracts/node-structure.ts)

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-17 | 1.0.0 | Initial data model for prototype | Planning phase |
