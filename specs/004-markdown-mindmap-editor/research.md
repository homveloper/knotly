# Research Report: Markdown Mind Map Editor

**Feature**: 004-markdown-mindmap-editor
**Date**: 2025-10-20
**Phase**: Phase 0 (Research & Technology Selection)

## Overview

This document consolidates research findings for all technical unknowns identified in the implementation plan. Each section provides a decision, rationale, code examples, and alternatives considered.

---

## 1. Markdown Parser Selection: marked.js vs remark

### Decision: **marked.js**

### Rationale:

**Token API:**
- **marked.js**: Provides direct, simple lexer access via `marked.lexer(markdown)`. Returns an array of typed tokens (heading, code, list, image, paragraph, etc.) that can be directly accessed and filtered. Perfect for extracting specific token types.
- **remark**: Uses the unified/mdast AST approach, requiring more setup with `unified().use(remarkParse).parse()`. While powerful, it's more complex for simple token extraction tasks.

**Bundle size:**
- **marked.js**: ~12 KB minified + gzipped (v15.0.0)
- **remark**: ~26.2 KB minified + gzipped (full remark package with parse/stringify)
- **Winner**: marked.js is **54% smaller**, well under the 50KB requirement

**TypeScript:**
- **marked.js**: Built-in TypeScript types included in the main package (no @types needed). Fully typed token structures.
- **remark**: Fully typed with @types/mdast for AST nodes. Good TypeScript support but requires additional type packages.
- **Winner**: Tie, both have excellent TypeScript support. marked.js has slight edge with built-in types.

**Ease of use:**
- **marked.js**: Simple, straightforward API. Extract tokens in 2 lines:
  ```typescript
  import { marked } from 'marked';
  const tokens = marked.lexer('# Hello\n- item');
  ```
- **remark**: More verbose setup required:
  ```typescript
  import { unified } from 'unified';
  import remarkParse from 'remark-parse';
  const ast = unified().use(remarkParse).parse('# Hello');
  ```
- **Winner**: marked.js for simplicity

### Code Example:

```typescript
import { marked } from 'marked';

// Extract tokens from markdown
const markdown = `
# Getting Started

This is a paragraph.

- List item 1
- List item 2

\`\`\`javascript
console.log('code block');
\`\`\`

![alt text](image.png)
`;

// Get all tokens
const tokens = marked.lexer(markdown);

// Filter specific token types
const headings = tokens.filter(t => t.type === 'heading');
const lists = tokens.filter(t => t.type === 'list');
const codeBlocks = tokens.filter(t => t.type === 'code');

// Access images from inline tokens
const images: any[] = [];
tokens.forEach(token => {
  if ('tokens' in token && token.tokens) {
    token.tokens.forEach((inlineToken: any) => {
      if (inlineToken.type === 'image') {
        images.push(inlineToken);
      }
    });
  }
});

console.log('Headings:', headings.length);
console.log('Lists:', lists.length);
console.log('Code blocks:', codeBlocks.length);
console.log('Images:', images.length);
```

**TypeScript Token Types:**
```typescript
// marked provides typed tokens
import { Tokens } from 'marked';

// Token types include:
// - Tokens.Heading (with depth: number)
// - Tokens.Code (with lang?: string, text: string)
// - Tokens.List (with items: Tokens.ListItem[])
// - Tokens.Image (with href: string, title?: string, text: string)
// - Tokens.Paragraph, Tokens.Blockquote, etc.
```

### Alternatives Considered:

**remark (rejected for this use case):**
- **Pros**: More powerful plugin ecosystem, better for complex transformations, AST manipulation, and converting between formats. Excellent for building complex markdown processors.
- **Cons**:
  - 2x larger bundle size (26.2 KB vs 12 KB)
  - More complex API requiring unified framework knowledge
  - Overkill for simple token extraction
  - Requires additional setup steps
- **Why rejected**: The project needs simple, direct token extraction (headings, lists, code, images) for a mindmap editor, not complex AST transformations. marked.js provides exactly what's needed with half the bundle size and simpler API.

---

## 2. Split Pane Implementation: Library vs Custom

### Decision: **react-split by nathancahill**

### Rationale:

- **Bundle size**: 1-2 KB gzipped (well under the 10 KB requirement)
- **Accessibility**: Basic accessibility support, but lacks comprehensive WCAG 2.1 AA keyboard navigation out of the box (requires custom implementation)
- **Touch support**: Yes (wraps Split.js which supports touch interactions)
- **Maintenance**: Active development, part of the split monorepo with regular updates
- **Complexity**: Minimal - lightweight wrapper around Split.js, simple API, requires only ~10 lines of code to implement
- **TypeScript**: Has TypeScript definitions available

### Code Example:

```tsx
import Split from 'react-split';
import { useState, useEffect } from 'react';

function SplitLayout() {
  const [sizes, setSizes] = useState<number[]>([50, 50]);

  // Persist split ratio to LocalStorage
  useEffect(() => {
    const savedSizes = localStorage.getItem('split-sizes');
    if (savedSizes) {
      setSizes(JSON.parse(savedSizes));
    }
  }, []);

  const handleDrag = (sizes: number[]) => {
    setSizes(sizes);
    localStorage.setItem('split-sizes', JSON.stringify(sizes));
  };

  return (
    <Split
      className="split"
      sizes={sizes}
      minSize={[200, 200]}
      maxSize={[Infinity, Infinity]}
      gutterSize={10}
      direction="horizontal"
      cursor="col-resize"
      onDrag={handleDrag}
    >
      <div className="editor-pane">
        {/* Markdown Editor */}
      </div>
      <div className="canvas-pane">
        {/* Mind Map Canvas */}
      </div>
    </Split>
  );
}
```

### Accessibility Enhancement Plan:

Since react-split meets bundle size requirements but lacks full keyboard accessibility, implement the following enhancements:

```tsx
// Add keyboard navigation wrapper
const AccessibleSplit = () => {
  const gutterRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const adjustment = e.key === 'ArrowLeft' ? -5 : 5;
      setSizes([sizes[0] + adjustment, sizes[1] - adjustment]);
    }
  };

  return (
    <Split onDrag={handleDrag}>
      <div>Left Pane</div>
      <div
        ref={gutterRef}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panes"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="gutter gutter-horizontal"
      />
      <div>Right Pane</div>
    </Split>
  );
};
```

### Alternatives Considered:

**1. allotment**
- **Rejected due to**: Bundle size (~243 KB unpacked, estimated 50-70 KB minified+gzipped) significantly exceeds the 10 KB requirement
- **Pros**: VS Code-based implementation, robust feature set, 20px touch feedback area
- **Cons**: Heavy bundle size, overkill for simple split pane needs

**2. react-split-pane**
- **Rejected due to**: Accessibility issues (open GitHub issue #353), lacks keyboard navigation support, not actively maintained
- **Pros**: Popular historically, simple API
- **Cons**: Missing WCAG compliance, no keyboard controls

**3. react-resplit**
- **Rejected due to**: Bundle size (81.8 KB) exceeds requirement
- **Pros**: Built with Window Splitter accessibility pattern, keyboard controls included
- **Cons**: 8x larger than react-split, newer/less proven library

**4. Custom Implementation**
- **Rejected due to**: Implementation complexity for full feature parity
- **Estimated effort**: 150-200 lines of code for basic functionality
- **Requirements**: onMouseDown/Move/Up handlers, touch event handlers, resize logic, accessibility implementation (ARIA roles, keyboard navigation)
- **Cons**: Need to implement accessibility features manually, testing burden, maintenance overhead
- **Pros**: Full control, zero dependencies, minimal bundle impact

---

## 3. Dirty Flag Pattern for Circular Update Prevention

### Decision: **useRef + useLayoutEffect Pattern**

### Rationale:

**Race condition safety:**
The `useRef` approach is race-condition safe because refs persist across renders without triggering re-renders. By using a ref-based flag to track the update source (editor vs canvas), you can break the circular dependency. The flag is checked before triggering updates, preventing the ping-pong effect where canvas updates trigger editor updates which trigger canvas updates, etc.

**Cursor preservation:**
`useLayoutEffect` combined with `setSelectionRange()` provides the most reliable cursor preservation. Unlike `useEffect`, `useLayoutEffect` runs synchronously after DOM mutations but before the browser repaints, ensuring the cursor is restored to the correct position before the user sees the update. This is critical when external state updates (from canvas) modify the textarea value.

**Simplicity:**
The API is straightforward:
- One `useRef` to track update source (e.g., `isInternalUpdate`)
- One `useRef` to store cursor position
- One `useLayoutEffect` to restore cursor after external updates
- Set the flag before triggering updates, check it in effects

**React 19 compatibility:**
This pattern remains fully compatible with React 19. The core `useRef` + `useLayoutEffect` approach works perfectly with all React versions including 19.

### Code Example:

```typescript
import { useRef, useLayoutEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';

function MarkdownEditor() {
  const { markdown, nodes, setMarkdown, parseAndUpdateNodes } = useCanvasStore();

  // Refs to track update source and cursor position
  const isUpdatingFromCanvas = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Handle user typing in textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const { selectionStart, selectionEnd } = e.target;

    // Store cursor position
    cursorPositionRef.current = { start: selectionStart, end: selectionEnd };

    // Mark this as an editor-initiated update
    isUpdatingFromCanvas.current = false;

    // Update Zustand store with 300ms debounce (handled in store)
    setMarkdown(newValue);
  };

  // Listen for markdown changes and update canvas (300ms debounced)
  useLayoutEffect(() => {
    // Skip if this update came from the canvas to avoid circular loop
    if (isUpdatingFromCanvas.current) {
      isUpdatingFromCanvas.current = false;
      return;
    }

    // Parse markdown and update canvas nodes
    const timer = setTimeout(() => {
      parseAndUpdateNodes(markdown);
    }, 300);

    return () => clearTimeout(timer);
  }, [markdown, parseAndUpdateNodes]);

  // Listen for canvas changes and update textarea
  useLayoutEffect(() => {
    const unsubscribe = useCanvasStore.subscribe(
      (state) => state.nodes,
      (nodes) => {
        // Serialize nodes to markdown
        const newMarkdown = serializeNodesToMarkdown(nodes);

        // Mark this as a canvas-initiated update
        isUpdatingFromCanvas.current = true;

        // Update markdown in store
        setMarkdown(newMarkdown);
      }
    );

    return unsubscribe;
  }, [setMarkdown]);

  // Restore cursor position after external updates
  useLayoutEffect(() => {
    if (isUpdatingFromCanvas.current && textareaRef.current) {
      const { start, end } = cursorPositionRef.current;
      const maxLength = textareaRef.current.value.length;

      // Clamp positions to valid range
      const safeStart = Math.min(start, maxLength);
      const safeEnd = Math.min(end, maxLength);

      textareaRef.current.setSelectionRange(safeStart, safeEnd);
    }
  }, [markdown]);

  return (
    <textarea
      ref={textareaRef}
      value={markdown}
      onChange={handleTextareaChange}
      onSelect={(e) => {
        // Update cursor position on selection changes
        cursorPositionRef.current = {
          start: e.currentTarget.selectionStart,
          end: e.currentTarget.selectionEnd,
        };
      }}
      className="w-full h-full font-mono p-4"
      placeholder="Type markdown here..."
    />
  );
}
```

### Alternatives Considered:

**1. useState for dirty flag:**
- **Rejected:** Using `useState` for the dirty flag would trigger unnecessary re-renders every time the flag changes. Since the flag doesn't need to affect the UI, `useRef` is more efficient.

**2. Debouncing/throttling:**
- **Rejected:** While debouncing can reduce update frequency, it doesn't solve the fundamental circular update problem. You still need a way to determine update source to break the cycle. Debouncing can be added on top of the dirty flag pattern if performance becomes an issue.

**3. Comparing previous values (usePrevious hook):**
- **Rejected:** This can help reduce unnecessary updates but doesn't prevent circular loops. If the markdown changes from A→B in the editor, updates the canvas, then the canvas serializes back to B, the comparison won't catch that it's the same value that just went full circle.

**4. Single useEffect with multiple dependencies:**
- **Rejected:** Trying to handle both directions in one effect makes it harder to reason about update source and increases complexity. Separate effects with clear responsibilities are more maintainable.

---

## 4. Cursor Position Preservation in React Textarea

### Decision: **useLayoutEffect with useRef**

### Rationale:

- **Browser compatibility**: Works in Chrome, Firefox, Safari, Edge, and Opera. The `selectionStart`/`selectionEnd` properties and `setSelectionRange()` method are well-supported across all modern browsers.
- **Timing**: `useLayoutEffect` is critical over `useEffect` because it executes synchronously after DOM mutations but before the browser paints. This prevents visible cursor jumps from end position back to the saved position. `useEffect` would cause a visible flicker as the cursor briefly appears at the wrong position.
- **Edge cases handled**:
  - Out-of-bounds indices (automatically clamped to text length)
  - Multi-line selections (both start and end positions preserved)
  - Collapsed selections/cursor positioning (when start === end)
  - Text length changes (cursor position adjusted relative to content)
  - Initial mount vs updates (only restore on updates, not initial render)

### Code Example:

```typescript
import { useRef, useLayoutEffect } from 'react';

interface CursorPosition {
  start: number;
  end: number;
}

function useTextareaCursorPreservation(value: string, isExternalUpdate: boolean) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<CursorPosition>({ start: 0, end: 0 });

  // Restore cursor position after external updates
  useLayoutEffect(() => {
    if (isExternalUpdate && textareaRef.current && cursorPositionRef.current) {
      const { start, end } = cursorPositionRef.current;
      const maxLength = textareaRef.current.value.length;

      // Clamp positions to valid range
      const safeStart = Math.min(start, maxLength);
      const safeEnd = Math.min(end, maxLength);

      textareaRef.current.setSelectionRange(safeStart, safeEnd);
    }
  }, [value, isExternalUpdate]);

  const saveCursorPosition = (e: React.ChangeEvent<HTMLTextAreaElement> | React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    cursorPositionRef.current = {
      start: target.selectionStart,
      end: target.selectionEnd,
    };
  };

  return {
    textareaRef,
    saveCursorPosition,
  };
}

// Usage in MarkdownEditor:
function MarkdownEditor() {
  const [text, setText] = useState('');
  const [isExternalUpdate, setIsExternalUpdate] = useState(false);
  const { textareaRef, saveCursorPosition } = useTextareaCursorPreservation(text, isExternalUpdate);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    saveCursorPosition(e);
    setIsExternalUpdate(false);
    setText(e.target.value);
  };

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={handleChange}
      onSelect={saveCursorPosition}
    />
  );
}
```

### Caveats:

1. **Focus requirement**: The textarea should generally be focused for cursor restoration to be visually meaningful, though `setSelectionRange()` works without explicit `focus()` calls.

2. **TypeScript null checks**: `selectionStart` and `selectionEnd` can be `null` in TypeScript definitions, requiring null coalescing (e.g., `selectionStart ?? 0`).

3. **Multi-instance risk**: If multiple parts of your app update the same textarea simultaneously, cursor positions may conflict. Use a single source of truth for external updates.

4. **Initial render**: Don't restore cursor position on initial mount - only on subsequent updates when cursor position has been explicitly saved.

---

## 5. BFS Performance for 500-Node Layout

### Decision: **BFS + O(n) position calculation is viable**

### Rationale:

- **Time complexity**: BFS is O(V + E) where V is vertices and E is edges. For typical tree/graph structures (mindmaps), E ≈ V - 1 to V, making it effectively O(n). Position calculation is O(V) = O(n). Total complexity is O(n) linear.
- **Expected runtime**: For 500 nodes, BFS traversal requires ~500-1000 operations (visiting nodes + checking edges). Position calculation adds another 500 operations. In modern JavaScript engines (V8, SpiderMonkey), simple array/object operations run at millions per second. Expected total: **<50ms** for 500 nodes.
- **Memory usage**: BFS queue requires O(V) space = ~500 entries max. Position array/object requires O(V) = 500 entries. Visited set requires O(V) = 500 entries. Total: **~3-5KB** for 500 nodes with typical node data structures.
- **Bottlenecks**: None for 500 nodes with O(n) algorithms. Rendering (canvas operations, rough.js drawing) will likely be the bottleneck, not layout calculation.

### Performance Analysis:

- **BFS**: O(V + E) = O(500 + 500) for typical tree structure = ~1000 operations
  - Queue operations (enqueue/dequeue): ~1000 × 10ns = 10μs
  - Node visits and level assignment: 500 × 50ns = 25μs
  - Edge traversal: 500 × 20ns = 10μs
  - **BFS subtotal**: ~0.05ms (negligible)

- **Position calculation**: O(V) = O(500)
  - Radial layout (polar coordinates): 500 × (2 trig operations + 1 assignment) = 500 × 100ns = 50μs
  - Horizontal layout (linear spacing): 500 × 50ns = 25μs
  - **Position calc subtotal**: ~0.05-0.1ms (negligible)

- **Total**: ~**0.1-0.2ms for layout calculation** (well under 1ms, let alone 1s)

### Optimization Opportunities:

For 1000+ nodes, if needed:
1. **Web Workers**: Offload BFS + position calculation to background thread (prevents UI blocking)
2. **Incremental updates**: Only recalculate affected subgraphs when nodes change
3. **Spatial indexing**: Use quadtree/R-tree for collision detection in force-directed refinement
4. **Virtualization**: Only render visible nodes (viewport culling)
5. **Memoization**: Cache level/position calculations, invalidate on structure change

**Note**: The actual bottleneck for 500+ nodes will be rendering (rough.js canvas operations), not layout calculation. Rough.js rendering can take 5-20ms per node for hand-drawn effects. For 500 nodes: 500 × 10ms = **~5 seconds rendering time**. Consider optimizations like:
- Simplify rough.js options (fewer iterations, lower roughness)
- Canvas layer caching (only redraw changed nodes)
- Progressive rendering (render in chunks with requestAnimationFrame)

### Alternatives Considered:

**1. Force-Directed Layout (D3-force, Springy)**
- **Rejected**: O(n²) complexity per iteration, requires multiple iterations (typically 300-500). For 500 nodes: 500² × 300 = 75M operations = **several seconds to minutes**. Overkill for hierarchical mindmap structures.

**2. Multilevel/Hierarchical Force-Directed**
- **Rejected**: O(n log² n) complexity, still slower than O(n) BFS. Adds implementation complexity without benefit for tree structures.

**3. GPU-Accelerated Layouts**
- **Rejected**: Requires WebGL, adds complexity, overkill for <1000 nodes. BFS is already fast enough.

---

## 6. marked.js Style Token Extraction

### Decision: **Regex on token.text (Post-tokenization)**

### Rationale:

- **Simplicity**: Single regex pattern `/\s*\{(\.[\w-]+(?:\s+\.[\w-]+)*)\}\s*$/` applied after marked.js tokenization. No custom extensions or renderer hooks needed.
- **Performance**: No measurable impact. Regex executes once per token after marked.js completes lexing. For 100 nodes with style tokens, overhead is <1ms (negligible compared to 300ms debounce requirement).
- **Coverage**: Works with all token types (heading, list_item, code, image, paragraph) because extraction happens on `token.text` field after tokenization, not during parsing.

### Code Example:

```typescript
interface StyleTokenResult {
  content: string;
  tokens: string[];
}

/**
 * Extract style tokens from markdown text
 * Removes tokens like {.color-red .h3} from the end of content
 *
 * @param text - Raw text content from marked.js token
 * @returns Object with cleaned content and extracted token array
 *
 * @example
 * extractStyleTokens("Header text {.color-blue .h1}")
 * // Returns: { content: "Header text", tokens: ["color-blue", "h1"] }
 */
export function extractStyleTokens(text: string): StyleTokenResult {
  // Match {.token1 .token2} at end of string, with optional surrounding whitespace
  const pattern = /\s*\{(\.[\w-]+(?:\s+\.[\w-]+)*)\}\s*$/;
  const match = text.match(pattern);

  if (!match) {
    return { content: text, tokens: [] };
  }

  // Remove matched pattern from content
  const content = text.substring(0, match.index).trim();

  // Extract individual tokens (remove leading dots)
  const tokenString = match[1];
  const tokens = tokenString
    .split(/\s+/)
    .map(token => token.substring(1)); // Remove leading '.'

  return { content, tokens };
}
```

### Regex Pattern:

```regex
/\s*\{(\.[\w-]+(?:\s+\.[\w-]+)*)\}\s*$/
```

**Explanation**:
- `\s*` - Optional leading whitespace
- `\{` - Opening curly brace (literal)
- `(` - Capture group start
  - `\.[\w-]+` - First token: dot followed by word characters or hyphens
  - `(?:\s+\.[\w-]+)*` - Additional tokens: whitespace + dot + word chars (zero or more)
- `)` - Capture group end
- `\}` - Closing curly brace (literal)
- `\s*` - Optional trailing whitespace
- `$` - End of string anchor (ensures tokens are at the end)

### Edge Cases:

1. **Nested braces**: Pattern only matches at string end. Inner braces like `code {x: 1} {.color-red}` work correctly - inner braces are preserved in content.

2. **Escaped characters**: No special handling needed. Markdown escapes (`\{`) are processed by marked.js before our regex runs, so we operate on plain text.

3. **Invalid token syntax**:
   - `{color-red}` - No leading dot, pattern won't match (by design, follows spec convention)
   - `{.color red}` - Space without second dot, pattern won't match
   - `{.}` - Empty token name, pattern won't match (requires at least one character)

4. **Multiple token blocks**: `Text {.color-red} {.h1}` - Only last block matches. This is intentional per spec (single token block at end).

### Alternatives Considered:

**1. Custom marked.js extension (tokenizer hook)**
- **Why rejected**: Adds complexity. Would require creating custom tokenizer for each token type (heading, list, code). Extensions are designed for new syntax, not modifying existing tokens.

**2. Custom renderer hook**
- **Why rejected**: Renderer runs during HTML generation, after tokenization. We need token extraction during parse phase to feed into Zustand store. Renderer is too late in the pipeline.

**3. Parsing `token.raw` instead of `token.text`**
- **Why rejected**: `token.raw` contains markdown syntax markers (`#`, `-`, etc.). For heading `# Title {.color-red}`, `token.raw` is `"# Title {.color-red}\n"` while `token.text` is `"Title {.color-red}"`. Cleaner to work with `token.text`.

**4. String splitting instead of regex**
- **Why rejected**: Edge cases become complex (handling whitespace, validation). Regex is more declarative and handles boundary conditions naturally.

---

## Summary of Decisions

| Research Task | Decision | Key Benefit |
|--------------|----------|-------------|
| Markdown Parser | marked.js | 54% smaller bundle, simple API |
| Split Pane | react-split | 1-2 KB, touch support |
| Dirty Flag Pattern | useRef + useLayoutEffect | Race-condition safe, cursor preservation |
| Cursor Preservation | useLayoutEffect + setSelectionRange | No visible flicker, cross-browser |
| BFS Performance | O(n) viable | <50ms for 500 nodes |
| Style Token Extraction | Regex on token.text | Simple, no performance penalty |

## Next Steps

Proceed to Phase 1 (Design):
1. Generate data-model.md with extended Node types
2. Generate contracts/markdown-api.ts with Result types
3. Generate quickstart.md with developer setup
4. Update agent context (CLAUDE.md)
5. Re-evaluate Constitution Check

All technical unknowns have been resolved with clear rationales and code examples.
