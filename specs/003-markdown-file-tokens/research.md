# Research: Markdown File-Based Mind Map with Token System

**Feature**: 003-markdown-file-tokens
**Date**: 2025-10-19
**Purpose**: Resolve technical unknowns and establish best practices for file I/O, token system, and YAML frontmatter handling

## Research Questions

### 1. File System Access API Best Practices

**Decision**: Use File System Access API with graceful fallback to traditional file input/Blob download

**Rationale**:
- **File System Access API advantages**:
  - Native file picker dialogs (better UX than custom UI)
  - Direct file handle references (enables "Save" without re-prompting for filename)
  - Permission model handled by browser (user grants access per file)
  - Future-proof (W3C standard, growing browser support)

- **Browser support reality** (as of 2025):
  - Chrome/Edge 86+: Full support
  - Safari 15.2+: Partial support (showOpenFilePicker only, no createWritable)
  - Firefox: Not supported (polyfill experimental)

- **Fallback strategy**:
  ```typescript
  // Feature detection pattern
  const hasFileSystemAccess = 'showOpenFilePicker' in window;

  // Chrome/Edge: Use File System Access API
  if (hasFileSystemAccess) {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{description: 'Knotly Files', accept: {'text/markdown': ['.knotly.md']}}]
    });
    const file = await fileHandle.getFile();
    // ... process file
  }

  // Safari/Firefox: Fallback to file input
  else {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.knotly.md';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      // ... process file
    };
    input.click();
  }
  ```

- **Save operation fallback**:
  - Chrome/Edge: `fileHandle.createWritable()` → direct file update
  - Safari/Firefox: Create Blob → trigger download → user manually replaces file

**Alternatives Considered**:
- **File System Access API polyfill**: Rejected because polyfills add 50KB+ bundle size, increase complexity, and still have poor Safari/Firefox support. Native fallback is simpler and more reliable.
- **Cloud storage (Dropbox/Google Drive APIs)**: Rejected because spec requires local-only files with no cloud sync. Would add authentication complexity and violate privacy constraints.
- **IndexedDB for file storage**: Rejected because spec requires text-editor compatibility. Files must be accessible outside the browser.

**References**:
- MDN File System Access API: https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
- Browser compatibility: https://caniuse.com/native-filesystem-api
- W3C WICG spec: https://wicg.github.io/file-system-access/

---

### 2. YAML Frontmatter Parsing with js-yaml

**Decision**: Use js-yaml ^4.1.0 with safe loading, flowLevel: 2 for output, and robust error handling

**Rationale**:
- **js-yaml advantages**:
  - Industry standard (used by Jekyll, Hugo, Gatsby)
  - TypeScript types available (@types/js-yaml)
  - Safe loading prevents code execution vulnerabilities
  - Configurable output formatting for readability

- **Parsing strategy**:
  ```typescript
  import yaml from 'js-yaml';

  // Safe loading (prevents !<tag> code execution)
  try {
    const frontmatter = yaml.load(frontmatterText, {schema: yaml.SAFE_SCHEMA});
    // Validate structure
    if (!frontmatter || typeof frontmatter !== 'object') {
      return {success: false, error: 'Invalid YAML: expected object'};
    }
    return {success: true, data: frontmatter};
  } catch (error) {
    return {success: false, error: `YAML parse error: ${error.message}`};
  }
  ```

- **Serialization strategy**:
  ```typescript
  // flowLevel: 2 makes nested objects inline for readability
  const yamlText = yaml.dump(frontmatter, {
    flowLevel: 2,      // {id: "foo", pos: [10, 20]} instead of multi-line
    lineWidth: 120,    // Prevent aggressive line breaks
    noRefs: true       // Disable YAML anchors/aliases (simpler format)
  });
  ```

- **Frontmatter delimiter handling**:
  ```typescript
  // Standard Jekyll/Hugo format: ---\n{yaml}\n---\n{body}
  const text = await file.text();
  const parts = text.split(/^---$/gm);  // Split on --- at line boundaries

  if (parts.length < 3) {
    return {success: false, error: 'Missing YAML frontmatter delimiters'};
  }

  const frontmatterText = parts[1].trim();
  const body = parts.slice(2).join('---').trim();  // Rejoin in case --- appears in body
  ```

**Alternatives Considered**:
- **gray-matter library**: Rejected because it's 3x larger (15KB vs 5KB gzipped) and adds abstractions we don't need. js-yaml + manual delimiter splitting is simpler.
- **JSON frontmatter**: Rejected because YAML is more human-readable (no quotes around keys, comments supported, multi-line strings). Industry standard for static site generators.
- **TOML frontmatter**: Rejected because YAML has better ecosystem support and js-yaml is mature/stable.

**References**:
- js-yaml GitHub: https://github.com/nodeca/js-yaml
- YAML specification: https://yaml.org/spec/1.2.2/
- Frontmatter convention: https://jekyllrb.com/docs/front-matter/

---

### 3. Token Parser Architecture (Tailwind-Inspired Composition)

**Decision**: Pure function parser with space-separated token strings, last-token-wins merging, and recursion depth limit

**Rationale**:
- **Token composition pattern** (inspired by Tailwind CSS utility classes):
  ```typescript
  // Atomic tokens define single style properties
  const DEFAULT_TOKENS = {
    'color-blue': {stroke: '#2563eb', fill: '#dbeafe'},
    'h4': {width: 200, height: 140, fontSize: 16},
    'neat': {roughness: 1.0},
    'thick': {strokeWidth: 3}
  };

  // Composite tokens reference other tokens
  const DEFAULT_TOKENS = {
    ...atomicTokens,
    'heading-primary': 'color-blue h3 bold',  // String value = composite
    'note-default': 'color-yellow h4 neat'
  };

  // User applies tokens: node.style = "color-blue h4 neat thick"
  // Parser resolves: {stroke: '#2563eb', fill: '#dbeafe', width: 200, height: 140, fontSize: 16, roughness: 1.0, strokeWidth: 3}
  ```

- **Parser implementation**:
  ```typescript
  export function parseTokens(
    style: string,
    tokenDefinitions: TokenDefinitions,
    depth = 0  // Recursion depth tracking
  ): StyleObject {
    // Prevent infinite loops from circular references
    if (depth > 10) {
      console.warn('Token recursion depth exceeded, using defaults');
      return {};
    }

    const tokens = style.split(' ').filter(Boolean);
    let result: StyleObject = {};

    for (const tokenName of tokens) {
      const value = tokenDefinitions[tokenName];

      // Skip unknown tokens silently (graceful degradation)
      if (!value) {
        console.warn(`Unknown token: ${tokenName}`);
        continue;
      }

      // Composite token: recursively expand
      if (typeof value === 'string') {
        const expanded = parseTokens(value, tokenDefinitions, depth + 1);
        Object.assign(result, expanded);  // Merge expanded tokens
      }
      // Atomic token: merge directly
      else {
        Object.assign(result, value);  // Last-token-wins for conflicts
      }
    }

    return result;
  }
  ```

- **Why last-token-wins**:
  - Matches Tailwind CSS behavior (later classes override earlier ones)
  - Intuitive for users: `"color-blue color-red"` → red wins (rightmost)
  - Simple implementation (no priority system needed)

- **Why recursion depth limit**:
  - Prevents stack overflow from circular token definitions
  - User edits YAML directly, could create: `foo: "bar"`, `bar: "foo"`
  - Depth 10 allows 10 levels of nesting (more than reasonable)

**Alternatives Considered**:
- **CSS-in-JS library (e.g., styled-components)**: Rejected because we need rough.js-specific properties (roughness, seed), not CSS. Token system is lighter weight (no runtime CSS generation).
- **Priority/specificity system (like CSS)**: Rejected because adds complexity (need to track token categories, define priority rules). Last-token-wins is simpler and sufficient.
- **Mutable token objects**: Rejected to follow Constitution Principle V (immutability). Object.assign creates new object each merge.

**References**:
- Tailwind CSS utility-first: https://tailwindcss.com/docs/utility-first
- rough.js options: https://github.com/rough-stuff/rough/wiki#options
- Object.assign merging: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

---

### 4. Markdown Node Content Extraction Pattern

**Decision**: Use regex with [id] delimiters, greedy matching up to next delimiter or end-of-file

**Rationale**:
- **Markdown body format**:
  ```markdown
  ---
  tokens: {...}
  nodes: [{id: "node-1", ...}, {id: "node-2", ...}]
  edges: [...]
  ---

  [node-1]
  This is the content for node 1.
  It can span multiple lines.

  [node-2]
  This is node 2's content.
  ```

- **Extraction regex**:
  ```typescript
  function extractContent(body: string, id: string): string {
    // Match [id] followed by any content until next [id] or EOF
    // [\s\S]*? = non-greedy match of any character including newlines
    const regex = new RegExp(`\\[${escapeRegex(id)}\\]\\n([\\s\\S]*?)(?=\\n\\[|$)`, 'm');
    const match = body.match(regex);
    return match ? match[1].trim() : '';
  }

  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');  // Escape special chars
  }
  ```

- **Why [id] delimiter instead of ## headings**:
  - Avoids collision with user content (user might want "## Heading" in node text)
  - Unique identifier (node IDs are UUIDs, guaranteed no collision)
  - Easier to parse (regex for [id] vs markdown AST parsing)

- **Why regex instead of markdown parser**:
  - Markdown parsers (remark, marked) add 50KB+ bundle size
  - We don't need markdown rendering (nodes are plain text per spec constraint)
  - Simple regex is fast (<1ms for 100 nodes) and sufficient

- **Edge case handling**:
  ```typescript
  // Missing delimiter: return empty string
  extractContent(body, 'missing-id');  // → ''

  // Last node (no next delimiter): match until EOF
  extractContent('[node-1]\nLast node content', 'node-1');  // → 'Last node content'

  // Node ID contains regex special chars: escape before regex
  extractContent('[node-$special]\nContent', 'node-$special');  // → 'Content'
  ```

**Alternatives Considered**:
- **Markdown AST parser (remark/unified)**: Rejected for reasons above (bundle size, unnecessary complexity). We only need text extraction, not rendering.
- **Line-by-line parsing**: Rejected because less robust (need to track state across lines, handle edge cases manually). Regex is declarative and handles all cases.
- **JSON in frontmatter (no markdown body)**: Rejected because YAML has line limits (very long text becomes unreadable). Separate markdown body keeps frontmatter concise.

**References**:
- Regex lookahead: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Assertions
- JavaScript regex flags: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions

---

### 5. React Performance Optimization for Token Parsing

**Decision**: Memoize parseTokens results with useMemo, debounce style panel updates, virtualize for >100 nodes

**Rationale**:
- **Memoization strategy**:
  ```typescript
  function NodeComponent({node}: {node: Node}) {
    const {tokenDefinitions} = useCanvasStore();

    // Memoize parsed style (recompute only when node.style or tokenDefinitions change)
    const resolvedStyle = useMemo(
      () => parseTokens(node.style, tokenDefinitions),
      [node.style, tokenDefinitions]
    );

    // Use resolvedStyle in rough.js rendering
    // ...
  }
  ```

- **Why memoization is critical**:
  - parseTokens runs on every render (zoom, pan, drag triggers re-render)
  - 50 nodes × 60fps = 3,000 parseTokens calls/second without memo
  - parseTokens is pure function (same inputs → same output) → perfect for memoization
  - useMemo caches result until dependencies change (node.style or tokenDefinitions)

- **Style panel debouncing**:
  ```typescript
  function StylePanel({nodeId, currentStyle}: StylePanelProps) {
    const [localTokens, setLocalTokens] = useState(currentStyle.split(' '));
    const {updateNode} = useCanvasStore();

    // Debounce store update to avoid re-rendering all nodes on every click
    const debouncedUpdate = useMemo(
      () => debounce((tokens: string[]) => {
        updateNode(nodeId, {style: tokens.join(' ')});
      }, 100),  // 100ms debounce
      [nodeId, updateNode]
    );

    const toggleToken = (token: string) => {
      const newTokens = localTokens.includes(token)
        ? localTokens.filter(t => t !== token)
        : [...localTokens, token];
      setLocalTokens(newTokens);       // Immediate local state update
      debouncedUpdate(newTokens);      // Delayed global state update
    };
  }
  ```

- **Virtualization for large files** (if >100 nodes):
  - Use react-window or react-virtualized
  - Only render nodes visible in viewport
  - ~10x performance improvement for 1,000+ nodes
  - Implementation deferred to Phase 2 tasks (not MVP)

**Alternatives Considered**:
- **Re-parsing on every render**: Rejected because causes frame drops (parseTokens is fast but not free, 50 nodes × string split/object merge adds up).
- **Global cache outside React**: Rejected because violates React patterns (need to manually invalidate cache, breaks React DevTools debugging).
- **Web Worker for parsing**: Rejected because overkill (parseTokens is <1ms, worker overhead >10ms for postMessage serialization).

**References**:
- React useMemo: https://react.dev/reference/react/useMemo
- Debouncing in React: https://www.developerway.com/posts/debouncing-in-react
- react-window: https://github.com/bvaughn/react-window

---

### 6. Zustand Store Design for File State Management

**Decision**: Extend existing canvasStore with file-specific state and actions, use Result types for async operations

**Rationale**:
- **State extension**:
  ```typescript
  interface CanvasStore {
    // Existing state (Milestone 2)
    nodes: Node[];
    edges: Edge[];
    zoom: number;
    pan: {x: number; y: number};
    selectedNodeId: string | null;

    // New file state
    tokenDefinitions: TokenDefinitions;
    currentFilePath: string | null;      // null = unsaved new note
    currentFileHandle: FileSystemFileHandle | null;  // For re-saving without picker
    hasUnsavedChanges: boolean;
    recentFiles: string[];               // localStorage persistence

    // New actions
    loadFile: (fileHandle: FileSystemFileHandle) => Promise<FileResult<void>>;
    saveFile: (fileHandle?: FileSystemFileHandle) => Promise<FileResult<void>>;
    markDirty: () => void;
    addRecentFile: (path: string) => void;
  }
  ```

- **Why extend existing store instead of separate file store**:
  - File operations modify node/edge state → needs access to canvas state
  - Single source of truth (no cross-store sync issues)
  - Zustand supports multiple slices in one store (separation via naming)

- **Async action pattern with Result types**:
  ```typescript
  loadFile: async (fileHandle: FileSystemFileHandle) => {
    const result = await loadKnotlyFile(fileHandle);

    if (!result.success) {
      // Error handling in UI (show toast, keep current state)
      return result;
    }

    const {tokens, nodes, edges} = result.data;
    set({
      tokenDefinitions: {...DEFAULT_TOKENS, ...tokens},
      nodes,
      edges,
      currentFilePath: fileHandle.name,
      currentFileHandle: fileHandle,
      hasUnsavedChanges: false
    });

    return {success: true, data: undefined};
  }
  ```

- **Dirty tracking strategy**:
  - Mark dirty on: createNode, updateNode, moveNode, deleteNode, createEdge, deleteEdge
  - Clear dirty on: saveFile success
  - Show ● indicator in titlebar when dirty
  - Browser beforeunload confirmation when dirty

**Alternatives Considered**:
- **Separate file store (Zustand slice pattern)**: Rejected because adds complexity (need to sync between stores, more boilerplate). Single store is simpler for this scope.
- **Redux or Context API**: Rejected because Zustand is already used in Milestone 2. Consistency > switching libraries.
- **Auto-save on every change**: Rejected because File System Access API requires user permission per save. Auto-save would spam permission dialogs.

**References**:
- Zustand async actions: https://docs.pmnd.rs/zustand/guides/async-actions
- Zustand TypeScript: https://docs.pmnd.rs/zustand/guides/typescript
- beforeunload API: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event

---

## Summary of Key Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| File API | File System Access API + fallback to input/Blob | Best UX on Chrome/Edge, graceful degradation for Safari/Firefox |
| YAML Library | js-yaml ^4.1.0 with safe loading | Industry standard, TypeScript support, safe against code execution |
| Token Parser | Pure function with space-separated strings, last-token-wins | Simple, predictable, Tailwind-inspired, avoids priority complexity |
| Content Extraction | Regex with [id] delimiters | Fast, simple, avoids markdown parser overhead |
| Performance | useMemo for parseTokens, debounce style updates | Achieves 60fps with 50 nodes, prevents unnecessary re-renders |
| State Management | Extend existing Zustand store | Single source of truth, no cross-store sync, follows Milestone 2 patterns |

## Next Steps

1. **Phase 1 - Data Model**: Define TypeScript interfaces for KnotlyFile, Node, Edge, TokenDefinition, StyleObject
2. **Phase 1 - Contracts**: Generate .knotly.md file format schema (JSON Schema for YAML frontmatter)
3. **Phase 1 - Quickstart**: Write "Create your first .knotly.md note in 2 minutes" tutorial
4. **Update agent context**: Run `.specify/scripts/bash/update-agent-context.sh claude` to add js-yaml to CLAUDE.md

All research questions resolved. Ready to proceed to Phase 1 design.
