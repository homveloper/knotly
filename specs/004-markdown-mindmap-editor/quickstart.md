# Quickstart Guide: Markdown Mind Map Editor

**Feature**: 004-markdown-mindmap-editor
**Date**: 2025-10-20
**Audience**: Developers implementing or extending this feature

## Overview

This guide provides everything you need to get started with the markdown mind map editor feature, including user workflows, developer setup, API usage examples, and testing guidelines.

---

## User Workflow

### 1. Open Application

- Navigate to the app in browser
- See default 50-50 split view:
  - **Left panel**: Markdown editor (textarea)
  - **Right panel**: Mind map canvas (rough.js nodes + edges)

### 2. Type Markdown

Type standard markdown syntax in the left editor:

```markdown
<!-- knotly-layout: radial -->

# Project Overview {.color-blue .h1}

Main goals for Q4:

- Launch MVP {.color-mint}
  - User authentication
  - Basic dashboard
- Gather feedback {.color-yellow}

## Technical Stack

Backend:
```typescript {.rough}
const server = express();
server.listen(3000);
```

Frontend:
- React 18
- Tailwind CSS
- Zustand

![Architecture Diagram](https://example.com/arch.png) {.color-red}

---

# Milestone 2

- Phase 2 features
```

**What happens**:
- After 300ms (debounce), markdown is parsed
- Nodes appear in canvas with rough.js hand-drawn style
- Edges connect nodes based on hierarchy (headers, list indentation)
- Layout algorithm positions nodes (radial by default)

### 3. Edit in Canvas

Click a node in the canvas to edit:
- **Double-click**: Edit node text inline
- **Click "×" button**: Delete node
- **Drag node**: Move temporarily (position not saved)

**What happens**:
- Canvas updates immediately
- Markdown editor text updates instantly (< 100ms)
- Cursor position preserved in editor

### 4. Switch Layout

Click layout buttons in canvas toolbar:
- **🌟 Radial**: Center-out circular layout
- **➡️ Horizontal**: Left-to-right tree layout

**What happens**:
- All nodes reposition based on new algorithm (< 1s for 100 nodes)
- Layout comment in markdown updates: `<!-- knotly-layout: horizontal -->`

### 5. Adjust Split Ratio

Drag the vertical divider between editor and canvas:
- **Drag left**: Expand canvas, shrink editor
- **Drag right**: Expand editor, shrink canvas
- **Range**: 30% - 70% for each panel

**What happens**:
- Panels resize in real-time
- Ratio saved to LocalStorage
- Restored on next session

### 6. Save File

Press **Cmd/Ctrl + S** or click Save button:
- File saved as pure `.md` format
- Compatible with Git, Obsidian, Notion, GitHub

---

## Developer Setup

### Prerequisites

- Node.js 18+ (for Vite 7.x)
- pnpm (package manager)
- Modern browser (Chrome, Firefox, Safari)

### Installation

```bash
# Navigate to frontend directory
cd knotly-frontend

# Install new dependency (marked.js)
pnpm add marked@^15.0.0

# Install new dependency (react-split)
pnpm add react-split@^2.0.14
pnpm add -D @types/react-split

# Install all dependencies
pnpm install

# Verify TypeScript compilation
pnpm exec tsc --noEmit

# Start dev server
pnpm dev
```

### Project Structure

```
knotly-frontend/
├── src/
│   ├── components/
│   │   ├── MarkdownEditor.tsx      # NEW: Textarea with debounce
│   │   ├── SplitLayout.tsx         # NEW: Resizable panels
│   │   ├── LayoutSelector.tsx      # NEW: Radial/Horizontal buttons
│   │   ├── HeaderNode.tsx          # NEW: Larger font rendering
│   │   ├── CodeNode.tsx            # NEW: Preview + expand toggle
│   │   ├── ImageNode.tsx           # NEW: Thumbnail display
│   │   └── NodeComponent.tsx       # MODIFIED: Type-based rendering
│   │
│   ├── repository/                  # NEW: Repository layer
│   │   ├── markdownParser.ts       # Parse markdown → nodes/edges
│   │   ├── markdownSerializer.ts   # Serialize nodes/edges → markdown
│   │   └── layoutEngine.ts         # BFS + position calculation
│   │
│   ├── store/
│   │   └── canvasStore.ts          # MODIFIED: Add layout + markdown
│   │
│   ├── types/
│   │   └── canvas.ts               # MODIFIED: Extend Node types
│   │
│   └── utils/
│       └── fileIO.ts               # MODIFIED: Remove YAML, use .md
│
└── tests/
    ├── unit/
    │   ├── markdownParser.test.ts  # Parser unit tests
    │   ├── markdownSerializer.test.ts
    │   └── layoutEngine.test.ts    # BFS + position tests
    └── integration/
        └── MarkdownEditor.test.tsx # Round-trip sync tests
```

---

## API Usage

### 1. Parse Markdown

```typescript
import { parseMarkdown } from '../repository/markdownParser';

const markdown = `
# Hello World {.color-blue}
- Item 1
  - Nested item
`;

const result = parseMarkdown(markdown);

if (result.ok) {
  const { nodes, edges, layout } = result.value;
  console.log('Parsed nodes:', nodes.length);
  console.log('Edges:', edges.length);
  console.log('Layout:', layout); // 'radial'
} else {
  console.error('Parse error:', result.error.message);
  // Keep previous state, show notification to user
}
```

### 2. Serialize to Markdown

```typescript
import { serializeToMarkdown } from '../repository/markdownSerializer';
import { useCanvasStore } from '../store/canvasStore';

const { nodes, edges, layout } = useCanvasStore.getState();

const result = serializeToMarkdown(nodes, edges, layout);

if (result.ok) {
  const markdownText = result.value;
  await saveFile(markdownText);
  console.log('Saved successfully');
} else {
  console.error('Serialize error:', result.error.message);
  // Show error, don't write file
}
```

### 3. Apply Layout

```typescript
import { applyLayout } from '../repository/layoutEngine';

const result = applyLayout(nodes, edges, 'horizontal');

if (result.ok) {
  const nodesWithPositions = result.value;
  useCanvasStore.setState({ nodes: nodesWithPositions });
} else {
  console.error('Layout error:', result.error.message);
  // Keep previous positions
}
```

### 4. Extract Style Tokens

```typescript
import { extractStyleTokens } from '../repository/markdownParser';

const text = 'Header text {.color-blue .h1}';
const { content, tokens } = extractStyleTokens(text);

console.log(content); // "Header text"
console.log(tokens);  // ["color-blue", "h1"]

// Use with existing token parser
import { parseTokens, DEFAULT_TOKENS } from '../utils/tokenParser';
const style = parseTokens(tokens.join(' '), DEFAULT_TOKENS);
console.log(style); // { color: 'blue', fontSize: 'h1' }
```

### 5. Create Nodes (Factory Functions)

```typescript
import { createHeaderNode, createTextNode } from '../repository/nodeFactories';

// Create header node
const headerResult = createHeaderNode('Project Overview', 1, 'color-blue h1');

if (headerResult.ok) {
  const headerNode = headerResult.value;
  // headerNode: { id, type: 'header', content, level: 1, ... }
} else {
  console.error('Validation error:', headerResult.error.message);
}

// Create text node
const textResult = createTextNode('Launch MVP', 1, 'color-mint');

if (textResult.ok) {
  const textNode = textResult.value;
  // textNode: { id, type: 'text', content, level: 1, ... }
}
```

### 6. Zustand Store Integration

```typescript
import { useCanvasStore } from '../store/canvasStore';

function MyComponent() {
  // Subscribe to specific fields
  const nodes = useCanvasStore((state) => state.nodes);
  const layout = useCanvasStore((state) => state.layout);
  const markdown = useCanvasStore((state) => state.markdown);

  // Actions
  const setLayout = useCanvasStore((state) => state.setLayout);
  const setMarkdown = useCanvasStore((state) => state.setMarkdown);
  const parseAndUpdateNodes = useCanvasStore((state) => state.parseAndUpdateNodes);

  const handleLayoutChange = (newLayout: LayoutType) => {
    setLayout(newLayout);
    // Store automatically triggers layout recalculation
  };

  const handleTextChange = (text: string) => {
    setMarkdown(text);
    // Debounced parsing happens in store
  };

  return (
    <div>
      <button onClick={() => handleLayoutChange('horizontal')}>
        ➡️ Horizontal
      </button>
      <textarea
        value={markdown}
        onChange={(e) => handleTextChange(e.target.value)}
      />
    </div>
  );
}
```

---

## Testing

### Unit Tests (60% of test pyramid)

**Parser Tests** (`tests/unit/markdownParser.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../repository/markdownParser';

describe('markdownParser', () => {
  it('should parse headers with style tokens', () => {
    const result = parseMarkdown('# Title {.color-blue .h1}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      const { nodes } = result.value;
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('header');
      expect(nodes[0].content).toBe('Title');
      expect(nodes[0].style).toBe('color-blue h1');
    }
  });

  it('should parse nested lists', () => {
    const markdown = `
- Parent
  - Child
    - Grandchild
    `;
    const result = parseMarkdown(markdown);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const { nodes, edges } = result.value;
      expect(nodes).toHaveLength(3);
      expect(edges).toHaveLength(2); // Parent→Child, Child→Grandchild
    }
  });

  it('should handle parse errors gracefully', () => {
    const result = parseMarkdown('```unclosed code block');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('syntax_error');
      expect(result.error.message).toBeTruthy();
    }
  });
});
```

**Layout Engine Tests** (`tests/unit/layoutEngine.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { applyLayout, computeLevels } from '../repository/layoutEngine';

describe('layoutEngine', () => {
  it('should compute BFS levels correctly', () => {
    const nodes = [
      { id: '1', type: 'header', content: 'Root', level: 1 },
      { id: '2', type: 'text', content: 'Child', level: 1 },
    ];
    const edges = [{ id: 'e1', sourceId: '1', targetId: '2' }];

    const levels = computeLevels(nodes, edges);

    expect(levels.get('1')).toBe(0); // Root
    expect(levels.get('2')).toBe(1); // Child
  });

  it('should prevent node overlap in radial layout', () => {
    const nodes = [/* 50 nodes with measuredSize */];
    const edges = [/* hierarchy */];

    const result = applyLayout(nodes, edges, 'radial');

    expect(result.ok).toBe(true);
    if (result.ok) {
      const positioned = result.value;
      // Verify no overlaps (distance between any two nodes > sum of their sizes)
      for (let i = 0; i < positioned.length; i++) {
        for (let j = i + 1; j < positioned.length; j++) {
          const distance = Math.sqrt(
            Math.pow(positioned[i].position.x - positioned[j].position.x, 2) +
            Math.pow(positioned[i].position.y - positioned[j].position.y, 2)
          );
          const minDistance = (
            (positioned[i].measuredSize!.width + positioned[j].measuredSize!.width) / 2
          );
          expect(distance).toBeGreaterThan(minDistance);
        }
      }
    }
  });
});
```

### Integration Tests (30% of test pyramid)

**Round-Trip Sync Test** (`tests/integration/MarkdownEditor.test.tsx`):
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { useCanvasStore } from '../store/canvasStore';

describe('MarkdownEditor Integration', () => {
  it('should sync editor → canvas → editor', async () => {
    render(<MarkdownEditor />);

    const textarea = screen.getByRole('textbox');

    // User types in editor
    fireEvent.change(textarea, { target: { value: '# Hello' } });

    // Wait for debounce + parsing
    await waitFor(() => {
      const { nodes } = useCanvasStore.getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].content).toBe('Hello');
    }, { timeout: 500 });

    // Edit node in canvas
    const { updateNode, serializeAndUpdateMarkdown } = useCanvasStore.getState();
    updateNode(nodes[0].id, { content: 'World' });
    serializeAndUpdateMarkdown();

    // Editor should update instantly
    await waitFor(() => {
      expect(textarea.value).toContain('# World');
    }, { timeout: 200 });
  });

  it('should preserve cursor position after canvas update', async () => {
    render(<MarkdownEditor />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    // Type text and place cursor
    fireEvent.change(textarea, { target: { value: '# Hello World' } });
    textarea.setSelectionRange(7, 7); // After "Hello "

    // Trigger canvas update
    const { serializeAndUpdateMarkdown } = useCanvasStore.getState();
    serializeAndUpdateMarkdown();

    await waitFor(() => {
      expect(textarea.selectionStart).toBe(7);
      expect(textarea.selectionEnd).toBe(7);
    });
  });
});
```

### E2E Tests (10% of test pyramid - manual for MVP)

**Manual Test Checklist**:
1. Type markdown → Verify nodes appear in canvas (300ms)
2. Edit node in canvas → Verify editor updates (< 100ms)
3. Switch layout → Verify nodes reposition (< 1s)
4. Drag divider → Verify ratio persists after reload
5. Save file → Verify output is pure markdown (no proprietary format)
6. Load file → Verify layout comment parsed correctly

---

## Performance Benchmarks

### Parser Performance

```bash
# Run benchmark
pnpm test -- markdownParser.bench.ts

# Expected results:
# - 100 nodes: < 10ms
# - 500 nodes: < 50ms
# - 1000 nodes: < 100ms
```

### Layout Performance

```bash
# Run benchmark
pnpm test -- layoutEngine.bench.ts

# Expected results:
# - 100 nodes: < 10ms
# - 500 nodes: < 50ms
# - 1000 nodes: < 200ms (warning threshold)
```

### Rendering Performance

Use Chrome DevTools Performance tab:
1. Record while typing markdown (50 nodes)
2. Verify frame rate stays at 60fps
3. Verify no long tasks > 50ms

---

## Common Issues & Solutions

### Issue: Circular updates between editor and canvas

**Symptom**: Infinite loop, browser freezes
**Solution**: Check dirty flag in `MarkdownEditor`:
```typescript
// Ensure isUpdatingFromCanvas ref is set correctly
isUpdatingFromCanvas.current = true; // Before canvas → editor update
if (isUpdatingFromCanvas.current) return; // Skip editor → canvas update
```

### Issue: Cursor jumps to end of textarea

**Symptom**: Cursor moves unexpectedly during typing
**Solution**: Use `useLayoutEffect` instead of `useEffect` for cursor restoration:
```typescript
useLayoutEffect(() => {
  if (isExternalUpdate && textareaRef.current) {
    textareaRef.current.setSelectionRange(savedStart, savedEnd);
  }
}, [markdown]);
```

### Issue: Nodes overlap in layout

**Symptom**: Nodes render on top of each other
**Solution**: Ensure `measuredSize` is set before calling `applyLayout`:
```typescript
const nodesWithSize = nodes.map(node => ({
  ...node,
  measuredSize: measureNode(node) // Measure before layout
}));
const result = applyLayout(nodesWithSize, edges, layout);
```

### Issue: Parse errors crash app

**Symptom**: Blank canvas, console errors
**Solution**: Always handle `Result.error` case:
```typescript
const result = parseMarkdown(text);
if (!result.ok) {
  console.error(result.error);
  return; // Keep previous state, don't clear canvas
}
```

---

## Next Steps

1. **Run tests**: `pnpm test`
2. **Start dev server**: `pnpm dev`
3. **Read data-model.md**: Understand entity schemas
4. **Read contracts/markdown-api.ts**: Understand API signatures
5. **Implement repository layer**: Start with `markdownParser.ts`
6. **Implement UI components**: `MarkdownEditor`, `SplitLayout`, `LayoutSelector`
7. **Run integration tests**: Verify bidirectional sync
8. **Measure performance**: Ensure 60fps with 100 nodes

For detailed implementation guidance, see `/speckit.tasks` output (tasks.md).

---

## Resources

- **marked.js docs**: https://marked.js.org/
- **react-split docs**: https://github.com/nathancahill/split/tree/master/packages/react-split
- **Zustand docs**: https://github.com/pmndrs/zustand
- **Constitution**: `.specify/memory/constitution.md`
- **Feature spec**: `specs/004-markdown-mindmap-editor/spec.md`
- **Implementation plan**: `specs/004-markdown-mindmap-editor/plan.md`
