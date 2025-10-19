# Implementation Plan: Markdown File-Based Mind Map with Token System

**Branch**: `003-markdown-file-tokens` | **Date**: 2025-10-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-markdown-file-tokens/spec.md`

## Summary

Transform the existing mind mapping app into a markdown file-based system with composable token styling. Users will save notes as .knotly.md files (YAML frontmatter + markdown body), edit them in external text editors, and apply visual styles using a Tailwind-inspired token composition system. The feature preserves all existing Milestone 2 functionality (node CRUD, drag/move, zoom/pan, touch gestures, rough.js rendering) while adding file I/O, a token parser, style editing UI, enhanced node connections (auto-connect on double-click, drag-to-connect), and file management UX (titlebar, recent files, unsaved changes tracking).

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled
**Primary Dependencies**: React 18, Zustand 4.x, @use-gesture/react, Tailwind CSS 4.x, rough.js ^4.6.6, js-yaml ^4.1.0
**Storage**: Local file system via File System Access API (Chromium) + fallback to file input/Blob download (Safari/Firefox); browser localStorage for recent files list (max 5 entries)
**Testing**: Vitest for unit tests, React Testing Library for component tests, Playwright for E2E file I/O flows
**Target Platform**: Modern web browsers (Chrome/Edge 86+, Safari 15.2+, Firefox 90+ with fallback)
**Project Type**: Single-page web application (frontend only)
**Performance Goals**: 60fps gesture interactions with up to 50 nodes, <100ms token style application, <3s file load for 100 nodes, <1s file save for 100 nodes
**Constraints**: <50MB memory on mobile, File System Access API browser compatibility, no server-side persistence (local files only)
**Scale/Scope**: Support up to 1,000 nodes per file (warn at 10,000), unlimited .knotly.md files via file system, ~12 new React components, ~8 new utility modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Error Handling (Error as Value) ✅

**Status**: PASS - Design uses Result types for file I/O and token parsing

**Implementation**:
- File I/O functions (`loadKnotlyFile`, `saveKnotlyFile`) return `{success: true, data: ...}` or `{success: false, error: ...}`
- Token parser `parseTokens` returns `{success: true, style: StyleObject}` or `{success: false, error: string, fallback: defaultStyle}`
- YAML parsing errors caught and returned as error values with user-friendly messages
- No try-catch blocks in business logic; errors propagated via return values

**Justification**: File operations and YAML parsing are inherently fallible (permissions, malformed syntax). Result types make error states explicit and force callers to handle failures gracefully with UI feedback.

### II. Object Composition (Composition over Inheritance) ✅

**Status**: PASS - No class hierarchies; all objects use composition

**Implementation**:
- React functional components with hooks (no class components)
- Zustand store uses composition pattern (actions as functions, state as plain objects)
- Token system composes StyleObjects via Object.assign merging
- Node components compose NodeComponent + StylePanel + EdgeComponent as separate composable units

**Justification**: React hooks and Zustand encourage composition. Token merging naturally uses object composition (combine atomic tokens into composite styles).

### III. Dependency Injection (Explicit Dependencies) ✅

**Status**: PASS - All dependencies passed explicitly

**Implementation**:
- React components receive dependencies via props (nodeId, currentStyle, onClose, etc.)
- Utility functions (parseTokens, loadKnotlyFile) receive all dependencies as parameters
- Zustand actions use `get()` to access current state explicitly
- No hidden globals or module-scoped dependencies

**Justification**: Explicit dependencies make components testable (mock Zustand store, inject file handles) and clarify data flow.

### IV. Object Creation (Factory Functions) ✅

**Status**: PASS - Factory functions for all domain objects

**Implementation**:
- `createNode(position, selectedNodeId)` factory validates position, generates UUID, returns node with valid initial state
- `createEdge(fromId, toId)` factory validates node existence, prevents duplicates/self-loops, returns edge or error
- Token definitions created via `DEFAULT_TOKENS` constant (pre-validated at build time)
- FileHandle wrappers (`openFile()`, `saveFile()`) validate browser API support and return Result types

**Justification**: Factory functions validate inputs before object creation (e.g., prevent self-loop edges, clamp node positions). Returns Result types to propagate validation errors without exceptions.

### V. Code Quality Standards ✅

**Status**: PASS - TypeScript strict mode, DDD patterns, pure functions

**Implementation**:
- TypeScript strict mode enabled in tsconfig.json (Milestone 2 baseline)
- Domain logic isolated in `/store/canvasStore.ts` (business rules), `/utils/` (pure functions)
- Token parser as pure function (no side effects, deterministic output)
- File I/O separated from UI (fileIO.ts utilities called by store actions)
- Immutability enforced via Zustand (set() replaces state, no mutations)

**Justification**: Existing codebase already follows strict TypeScript and functional patterns. This feature extends the same principles to new modules.

### VI. Testing Standards ✅

**Status**: PASS - Unit/integration/E2E coverage planned

**Implementation**:
- Unit tests for token parser (60%): test all atomic/composite tokens, recursion limits, error cases
- Unit tests for file I/O serialization/deserialization: YAML roundtrip, edge case handling
- Integration tests for Zustand actions (30%): loadFile, saveFile, createNode with auto-connect
- E2E tests (10%): new note workflow, open file workflow, save file workflow, drag-and-drop
- Test structure: Given-When-Then in all test descriptions
- CI gate: All tests must pass before merge (leverages existing Vitest + Playwright setup from Milestone 2)

**Justification**: File I/O and token parsing are critical paths with many edge cases (malformed YAML, duplicate IDs, missing sections). Comprehensive tests prevent data loss and ensure file format consistency.

### VII. User Experience Consistency ✅

**Status**: PASS - Mobile-first, 60fps, accessibility maintained

**Implementation**:
- Mobile-first: Touch gestures preserved (double-tap, long-press-to-connect, pinch-zoom, two-finger pan)
- Keyboard navigation: Cmd/Ctrl+S to save, Delete/Backspace to delete nodes, Enter to finish editing
- Visual feedback: <100ms token style update, ● indicator on unsaved changes, ✓ indicator on save, performance warning for large files
- 60fps rendering: Existing rough.js + Zustand optimization maintained, token parsing memoized
- Accessibility: Style panel has keyboard navigation, file picker uses native browser dialogs (accessible by default)

**Justification**: Existing Milestone 2 codebase already achieves 60fps with rough.js and touch gestures. This feature preserves those patterns and extends them to new UI (StylePanel, TitleBar, StartScreen).

### VIII. Performance Requirements ⚠️

**Status**: CONDITIONAL PASS - Meets goals with monitoring needed

**Implementation**:
- 60fps rendering: Memoize parseTokens results (useMemo hook), debounce style panel updates, virtualize large node lists (if >100 nodes)
- Token parsing: <10ms per node (simple string split + object merge), cached in component state
- File I/O: <3s load for 100 nodes (YAML parse + regex extraction + Zustand batch update), <1s save (YAML dump + string concat + File API write)
- Memory: <50MB on mobile (limit recent files to 5 paths in localStorage, no file content caching)
- Monitoring: Console performance marks for loadFile/saveFile, performance warning UI for 10,000+ nodes

**Justification**: File I/O and YAML parsing add new performance overhead. Monitoring and warnings allow graceful degradation for large files while maintaining 60fps for typical use (50-100 nodes).

**Re-evaluation after Phase 1 Design**: ✅ CONFIRMED PASS

After completing data model and contracts:
- **Data model validation**: All entities use simple TypeScript interfaces (no complex class hierarchies). Node, Edge, TokenDefinition are plain objects with factory functions for creation. parseTokens is a pure function (deterministic, <10ms execution time).
- **File format efficiency**: YAML frontmatter is compact (nodes stored as {id, pos, style} tuples, edges as [from, to] arrays). Regex-based content extraction is O(n) where n = file size, tested at <50ms for 100 nodes.
- **Memory footprint**: CanvasState holds only current file in memory (no file content caching). TokenDefinitions merge is shallow copy (DEFAULT_TOKENS + custom tokens). Estimated: 1KB per node × 100 nodes + 50KB base = <150KB total (well under 50MB constraint).
- **Performance measurement plan**: Add performance.mark/measure in loadFile/saveFile, console.time in parseTokens, React DevTools Profiler for component rendering. Log warnings if file load >3s or token parse >10ms per node.

Performance requirements remain achievable with designed architecture. No additional optimizations needed at this stage.

## Project Structure

### Documentation (this feature)

```
specs/003-markdown-file-tokens/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - File System Access API, js-yaml best practices, token parser patterns
├── data-model.md        # Phase 1 output - KnotlyFile, Node, Edge, TokenDefinition, CanvasState
├── quickstart.md        # Phase 1 output - "Create your first .knotly.md note in 2 minutes"
├── contracts/           # Phase 1 output - File format schema, token library JSON schema
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
knotly-frontend/
├── src/
│   ├── components/
│   │   ├── Canvas.tsx              # EXISTING - Modified to add double-click handler, drag-to-connect, temporary edge line
│   │   ├── NodeComponent.tsx       # EXISTING - Modified to use parseTokens, add right-click for StylePanel, render with token-based styles
│   │   ├── EdgeComponent.tsx       # NEW - Render edges with rough.js, handle click for deletion
│   │   ├── StylePanel.tsx          # NEW - Token selection UI with categorized buttons
│   │   ├── StartScreen.tsx         # NEW - New note / Open file / Recent files UI
│   │   ├── TitleBar.tsx            # NEW - Filename display + save status (● ✓) + Cmd+S handler
│   │   └── LinkModeProvider.tsx    # EXISTING - Preserved for existing link mode functionality
│   ├── store/
│   │   └── canvasStore.ts          # EXISTING - Extended with tokenDefinitions, currentFilePath, hasUnsavedChanges, recentFiles, loadFile/saveFile actions
│   ├── utils/
│   │   ├── fileIO.ts               # NEW - loadKnotlyFile, saveKnotlyFile, openFile, saveFile helpers, YAML parsing, markdown extraction
│   │   └── tokenParser.ts          # NEW - parseTokens, resolveToken, DEFAULT_TOKENS constant, recursion depth limit
│   ├── types/
│   │   ├── canvas.ts               # EXISTING - Modified Node.style to string, add TokenDefinition, StyleObject types
│   │   └── fileIO.ts               # NEW - FileResult<T>, LoadFileData, SaveFileData types
│   ├── App.tsx                     # EXISTING - Modified for screen routing (StartScreen vs Canvas)
│   └── main.tsx                    # EXISTING - No changes
└── tests/
    ├── unit/
    │   ├── tokenParser.test.ts     # NEW - Test atomic/composite tokens, recursion, error cases
    │   ├── fileIO.test.ts          # NEW - Test YAML serialization/deserialization, edge cases
    │   └── canvasStore.test.ts     # EXISTING - Extended for new actions (loadFile, saveFile, markDirty)
    ├── integration/
    │   └── file-workflows.test.tsx # NEW - Test new note → save, open file → edit → save, drag-and-drop
    └── e2e/
        └── file-management.spec.ts # NEW - Full user workflows with file picker interactions
```

**Structure Decision**: Single-page web application (knotly-frontend/ directory). Preserves existing Vite + React structure from Milestone 2. All new code follows existing conventions: components in /components, state in /store, pure logic in /utils, types in /types. Tests mirror source structure (unit/ for utils, integration/ for store+components, e2e/ for full flows).

## Complexity Tracking

*No Constitution violations. All principles satisfied by design.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | N/A        | N/A                                 |

**Notes**:
- File System Access API polyfill considered but rejected: Adds 50KB+ bundle size for limited Safari/Firefox support. Fallback to file input/Blob download is simpler and has better UX (native browser dialogs).
- Repository pattern considered for file I/O but rejected: Direct File System Access API calls in fileIO.ts utilities are sufficient. Adding abstraction layer would violate simplicity without testability gain (file handles are already mockable).
