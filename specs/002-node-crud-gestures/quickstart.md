# Developer Quickstart: Interactive Graph Editor

**Feature**: Interactive Graph Editor with Touch Gestures
**Branch**: 002-node-crud-gestures
**Date**: 2025-10-17

## Overview

This guide helps developers get started implementing the interactive graph editor feature. It covers setup, architecture, and step-by-step implementation workflow.

---

## Prerequisites

Ensure you have completed Milestone 1 (hand-drawn canvas prototype):
- ✅ Vite + React 18 + TypeScript project initialized
- ✅ Tailwind CSS configured
- ✅ rough.js ^4.6.6 installed
- ✅ Nanum Pen Script font loaded
- ✅ Basic Canvas component rendering SVG

**Check Milestone 1 completion**:
```bash
cd knotly-frontend
cat package.json | grep rough  # Should show rough 4.6.6
cat src/index.css | grep "Nanum Pen Script"  # Should show font import
```

---

## Installation

### 1. Install New Dependencies

```bash
cd knotly-frontend

# Add state management and gesture handling
pnpm add zustand @use-gesture/react uuid

# Add TypeScript types for uuid
pnpm add -D @types/uuid
```

**Expected versions**:
- `zustand`: ^4.5.0
- `@use-gesture/react`: ^10.3.0
- `uuid`: ^9.0.1

### 2. Verify Installation

```bash
pnpm list zustand @use-gesture/react uuid
```

Should output:
```
knotly-frontend@0.0.0
├── @use-gesture/react@10.3.0
├── uuid@9.0.1
└── zustand@4.5.0
```

---

## Architecture Overview

```
┌──────────────────────────────────────┐
│     React Components Layer           │
│  (Canvas, NodeComponent, FABButton)  │
└────────────┬─────────────────────────┘
             │ useCanvasStore()
             ▼
┌──────────────────────────────────────┐
│      Zustand State Store             │
│   (nodes[], edges[], zoom, pan)      │
└────────────┬─────────────────────────┘
             │ Immutable updates
             ▼
┌──────────────────────────────────────┐
│       Domain Entities                │
│    (Node, Edge, CanvasState)         │
└──────────────────────────────────────┘
```

**Data Flow**:
1. User interacts with component (e.g., clicks FAB button)
2. Component calls store action (e.g., `createNode()`)
3. Store updates state immutably via Zustand `set()`
4. Components subscribed to changed state re-render
5. rough.js renders hand-drawn visuals

---

## Implementation Workflow

### Phase 1: State Management Foundation

#### Step 1.1: Create Type Definitions

Create `knotly-frontend/src/types/canvas.ts`:

```typescript
export interface Node {
  id: string;
  position: { x: number; y: number };
  content: string;
  type: 'circle';
  style: {
    backgroundColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface Edge {
  id: string;
  fromId: string;
  toId: string;
  lineStyle: 'dashed';
  createdAt: number;
}
```

#### Step 1.2: Create Zustand Store

Create `knotly-frontend/src/store/canvasStore.ts`:

```typescript
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Node, Edge } from '../types/canvas';

interface CanvasStore {
  // State
  nodes: Node[];
  edges: Edge[];
  zoom: number;
  pan: { x: number; y: number };
  gridEnabled: boolean;
  snapEnabled: boolean;
  selectedEdgeId: string | null;

  // Node actions
  createNode: (position: { x: number; y: number }) => void;
  updateNode: (id: string, updates: Partial<Omit<Node, 'id' | 'createdAt'>>) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;

  // Edge actions
  createEdge: (fromId: string, toId: string) => void;
  deleteEdge: (id: string) => void;
  selectEdge: (id: string | null) => void;

  // Canvas actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  // Initial state
  nodes: [],
  edges: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  gridEnabled: false,
  snapEnabled: false,
  selectedEdgeId: null,

  // Implementations - start with createNode
  createNode: (position) => set((state) => ({
    nodes: [...state.nodes, {
      id: uuidv4(),
      position: state.snapEnabled
        ? { x: Math.round(position.x / 20) * 20, y: Math.round(position.y / 20) * 20 }
        : position,
      content: '',
      type: 'circle',
      style: { backgroundColor: '#FFE082', strokeColor: '#000', strokeWidth: 2 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }]
  })),

  // TODO: Implement remaining actions (see contracts/canvas-store-api.md)
  updateNode: (id, updates) => { /* ... */ },
  moveNode: (id, position) => { /* ... */ },
  deleteNode: (id) => { /* ... */ },
  createEdge: (fromId, toId) => { /* ... */ },
  deleteEdge: (id) => { /* ... */ },
  selectEdge: (id) => set({ selectedEdgeId: id }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),
  setPan: (pan) => set({ pan }),
  toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
}));
```

**Reference**: See `contracts/canvas-store-api.md` for full implementation details.

---

### Phase 2: Core Components

#### Step 2.1: Create FAB Button

Create `knotly-frontend/src/components/FABButton.tsx`:

```typescript
import { useCanvasStore } from '../store/canvasStore';

export function FABButton() {
  const { createNode, zoom, pan } = useCanvasStore();

  const handleClick = () => {
    // Calculate canvas center based on viewport
    const center = {
      x: (window.innerWidth / 2 - pan.x) / zoom,
      y: (window.innerHeight / 2 - pan.y) / zoom,
    };
    createNode(center);
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-600 active:scale-95 transition-transform"
      aria-label="Add new node"
    >
      +
    </button>
  );
}
```

#### Step 2.2: Create NodeComponent

Create `knotly-frontend/src/components/NodeComponent.tsx`:

```typescript
import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { useDrag } from '@use-gesture/react';
import { useCanvasStore } from '../store/canvasStore';
import type { Node } from '../types/canvas';

interface NodeComponentProps {
  node: Node;
}

export function NodeComponent({ node }: NodeComponentProps) {
  const { moveNode, updateNode } = useCanvasStore();
  const [isEditing, setIsEditing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Render rough.js circle
  useEffect(() => {
    if (!svgRef.current) return;

    const rc = rough.svg(svgRef.current);
    const circle = rc.circle(node.position.x, node.position.y, 120, {
      fill: node.style.backgroundColor,
      fillStyle: 'solid',
      stroke: node.style.strokeColor,
      strokeWidth: node.style.strokeWidth,
      roughness: 1.5,
    });

    svgRef.current.appendChild(circle);

    return () => {
      svgRef.current?.replaceChildren(); // Cleanup
    };
  }, [node.position, node.style]);

  // Drag gesture
  const bind = useDrag(({ offset: [x, y] }) => {
    moveNode(node.id, { x, y });
  }, {
    from: () => [node.position.x, node.position.y],
  });

  return (
    <g {...bind()}>
      <svg ref={svgRef} />
      <foreignObject
        x={node.position.x - 50}
        y={node.position.y - 50}
        width={100}
        height={100}
        onClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <textarea
            value={node.content}
            onChange={(e) => updateNode(node.id, { content: e.target.value })}
            onBlur={() => setIsEditing(false)}
            autoFocus
            className="w-full h-full resize-none text-center bg-transparent border-none outline-none overflow-y-auto"
            style={{ fontFamily: 'Nanum Pen Script', fontSize: '16px' }}
          />
        ) : (
          <div className="w-full h-full overflow-y-auto text-center flex items-center justify-center">
            <p style={{ fontFamily: 'Nanum Pen Script', fontSize: '16px' }}>
              {node.content || 'Tap to edit'}
            </p>
          </div>
        )}
      </foreignObject>
    </g>
  );
}
```

#### Step 2.3: Refactor Canvas Component

Update `knotly-frontend/src/components/Canvas.tsx`:

```typescript
import { useGesture } from '@use-gesture/react';
import { useCanvasStore } from '../store/canvasStore';
import { NodeComponent } from './NodeComponent';

export function Canvas() {
  const { nodes, zoom, pan, setZoom, setPan } = useCanvasStore();

  const bind = useGesture({
    onPinch: ({ offset: [scale] }) => {
      setZoom(scale);
    },
    onDrag: ({ delta: [dx, dy], touches }) => {
      if (touches >= 2) {
        setPan({ x: pan.x + dx, y: pan.y + dy });
      }
    },
  });

  return (
    <svg
      {...bind()}
      width="100vw"
      height="100vh"
      className="touch-none"
      style={{ cursor: 'grab' }}
    >
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {nodes.map(node => (
          <NodeComponent key={node.id} node={node} />
        ))}
      </g>
    </svg>
  );
}
```

#### Step 2.4: Update App.tsx

Update `knotly-frontend/src/App.tsx`:

```typescript
import { Canvas } from './components/Canvas';
import { FABButton } from './components/FABButton';

function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Canvas />
      <FABButton />
    </div>
  );
}

export default App;
```

---

### Phase 3: Additional Components

**Next components to implement** (see data-model.md and research.md for specs):

1. **EdgeComponent** - Renders connections between nodes
2. **GridBackground** - Displays 20px grid lines
3. **ContextMenu** - Bottom sheet for color/delete options
4. **MentionSheet** - Bottom sheet for @mention node selection

**Implementation order**:
1. GridBackground (simple, no dependencies)
2. EdgeComponent (depends on nodes existing)
3. ContextMenu (depends on long-press gesture)
4. MentionSheet (depends on text input handling)

---

## Development Commands

```bash
# Start dev server (with HMR)
pnpm dev

# Type check
pnpm exec tsc --noEmit

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## Testing the Feature

### Manual Test Checklist

Follow User Stories from `spec.md`:

1. **User Story 1: Create and Edit Nodes**
   - [ ] Click FAB button → node appears at center
   - [ ] Click node → cursor appears, can type text
   - [ ] Text renders in Nanum Pen Script font

2. **User Story 2: Move and Arrange Nodes**
   - [ ] Drag node → follows touch/mouse smoothly
   - [ ] Enable grid snap → node snaps to 20px grid
   - [ ] Disable grid snap → node moves freely

3. **User Story 6: Navigate Canvas**
   - [ ] Two-finger pinch → zoom in/out (0.5x-3x range)
   - [ ] Two-finger drag → pan canvas
   - [ ] One-finger drag on node → move node (not canvas)

### Browser DevTools Debugging

**Check Zustand State**:
```javascript
// In browser console
window.useCanvasStore = require('./store/canvasStore').useCanvasStore;
window.useCanvasStore.getState(); // View current state
window.useCanvasStore.getState().nodes; // View nodes array
```

**Performance Profiling**:
1. Open Chrome DevTools → Performance tab
2. Click Record
3. Interact with canvas (drag nodes, zoom, pan)
4. Stop recording
5. Check for:
   - Frame rate >60fps (green line)
   - No long tasks >50ms (red flags)

---

## Common Issues and Solutions

### Issue: Nodes don't render

**Symptoms**: FAB button works, but nodes invisible

**Debug steps**:
```javascript
// Check store state
useCanvasStore.getState().nodes; // Should show array of nodes

// Check SVG structure in DevTools
document.querySelector('svg'); // Should contain <g> elements
```

**Solution**: Verify rough.js is rendering. Check `NodeComponent` useEffect runs.

---

### Issue: Gestures not working

**Symptoms**: Can't drag nodes or pinch-zoom

**Debug steps**:
- Check `@use-gesture/react` is installed
- Verify `{...bind()}` is spread on SVG element
- Check browser console for errors

**Solution**: Ensure `touch-action: none` CSS is applied:
```tsx
<svg className="touch-none" {...bind()} />
```

---

### Issue: Text not editable

**Symptoms**: Clicking node doesn't activate edit mode

**Debug steps**:
- Check `foreignObject` element exists in SVG
- Verify `onClick` handler is attached
- Check `isEditing` state toggles

**Solution**: Ensure `foreignObject` has `pointer-events` enabled:
```tsx
<foreignObject style={{ pointerEvents: 'auto' }} />
```

---

## Next Steps

After completing Phase 3 components:

1. Review `tasks.md` (generated by `/speckit.tasks` command)
2. Implement remaining User Stories (3, 4, 5, 7)
3. Test on actual mobile devices (not just desktop emulator)
4. Optimize performance if frame rate <60fps
5. Prepare for Milestone 3 (persistence and backend)

---

## Resources

- **Zustand Docs**: https://github.com/pmndrs/zustand
- **@use-gesture Docs**: https://use-gesture.netlify.app/
- **rough.js Docs**: https://github.com/rough-stuff/rough
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Feature Spec**: [spec.md](./spec.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contract**: [contracts/canvas-store-api.md](./contracts/canvas-store-api.md)
- **Research**: [research.md](./research.md)

---

## Support

Questions or issues?
1. Check `research.md` for technical decisions and patterns
2. Review `contracts/canvas-store-api.md` for store API reference
3. Consult `data-model.md` for entity definitions
4. Refer to Milestone 1 implementation for rough.js patterns

Happy coding! 🎨
