# Implementation Tasks: Markdown File-Based Mind Map with Token System

**Feature**: 003-markdown-file-tokens
**Branch**: `003-markdown-file-tokens`
**Date**: 2025-10-19
**Total Tasks**: 77

## Overview

This document breaks down the implementation into dependency-ordered phases organized by user story priority. Each user story phase is independently testable and can be delivered as a working increment.

**MVP Scope**: User Story 1 (Create and Save First Note) delivers a complete read-write file cycle - the minimum viable product.

**Tech Stack**: TypeScript 5.x, React 18, Zustand 4.x, @use-gesture/react, Tailwind CSS 4.x, rough.js ^4.6.6, js-yaml ^4.1.0

---

## Phase 1: Setup & Dependencies (11 tasks)

**Goal**: Install dependencies, configure tooling, and set up project structure for markdown file features

### Dependencies & Configuration

- [X] T001 Install js-yaml and @types/js-yaml via pnpm in knotly-frontend/
- [X] T002 [P] Add uuid library if not already installed (for node/edge ID generation) in knotly-frontend/
- [X] T003 [P] Verify File System Access API browser compatibility table in research.md
- [X] T004 Create knotly-frontend/src/utils/ directory if not exists
- [X] T005 Create knotly-frontend/src/types/fileIO.ts for Result types and file-related interfaces

### Type Definitions (Foundation)

- [X] T006 [P] Define FileResult<T> generic type in knotly-frontend/src/types/fileIO.ts
- [X] T007 [P] Define LoadFileData interface {tokens, nodes, edges} in knotly-frontend/src/types/fileIO.ts
- [X] T008 [P] Define SaveFileData interface in knotly-frontend/src/types/fileIO.ts
- [X] T009 Modify Node interface in knotly-frontend/src/types/canvas.ts to change style from object to string
- [X] T010 [P] Add TokenDefinitions type alias and StyleObject interface to knotly-frontend/src/types/canvas.ts
- [X] T011 [P] Add Edge interface to knotly-frontend/src/types/canvas.ts with id, fromId, toId, lineStyle, createdAt fields

**Parallel Opportunities**: T002-T003, T006-T008, T010-T011 can run in parallel (different files)

---

## Phase 2: Foundational Utilities (12 tasks)

**Goal**: Build core utilities (token parser, file I/O) that all user stories depend on

### Token Parser (Pure Functions)

- [X] T012 [P] Create knotly-frontend/src/utils/tokenParser.ts file
- [X] T013 [P] Define DEFAULT_TOKENS constant with 8 colors in knotly-frontend/src/utils/tokenParser.ts
- [X] T014 Extend DEFAULT_TOKENS with 6 sizes (h1-h6), 5 feels, 4 borders in knotly-frontend/src/utils/tokenParser.ts
- [X] T015 Implement parseTokens(style: string, tokenDefinitions, depth=0) function with recursion limit in knotly-frontend/src/utils/tokenParser.ts
- [X] T016 Implement resolveToken(tokenName, tokenDefinitions) helper function in knotly-frontend/src/utils/tokenParser.ts
- [X] T017 Add console.warn for unknown tokens and recursion depth exceeded in knotly-frontend/src/utils/tokenParser.ts

### File I/O Utilities

- [X] T018 [P] Create knotly-frontend/src/utils/fileIO.ts file
- [X] T019 Implement extractContent(body: string, id: string) with regex extraction in knotly-frontend/src/utils/fileIO.ts
- [X] T020 Implement escapeRegex(str: string) helper for node ID escaping in knotly-frontend/src/utils/fileIO.ts
- [X] T021 Implement loadKnotlyFile(fileHandle) with YAML parsing, content extraction, Result<LoadFileData> return in knotly-frontend/src/utils/fileIO.ts
- [X] T022 Implement saveKnotlyFile(fileHandle, canvasState) with YAML serialization, markdown body generation in knotly-frontend/src/utils/fileIO.ts
- [X] T023 Implement openFile() and saveFile(fileHandle?) helpers with File System Access API + fallback in knotly-frontend/src/utils/fileIO.ts

**Parallel Opportunities**: T012-T017 (token parser) and T018-T023 (file I/O) can run in parallel (independent modules)

**Dependency**: T021-T023 depend on T006-T008 (Result types)

---

## Phase 3: User Story 1 - Create and Save First Note (Priority: P1) (15 tasks)

**Goal**: Deliver complete file creation and save workflow - the MVP

**Independent Test**: Launch app → click "New Note" → double-click canvas → add 3 nodes with text → Cmd+S → verify .knotly.md file created with correct YAML/markdown structure

### Zustand Store Extensions

- [X] T024 [US1] Add tokenDefinitions, currentFilePath, currentFileHandle, hasUnsavedChanges, recentFiles to knotly-frontend/src/store/canvasStore.ts initial state
- [X] T025 [US1] Implement markDirty() action in knotly-frontend/src/store/canvasStore.ts (sets hasUnsavedChanges = true)
- [X] T026 [US1] Update createNode action to call markDirty() and set default style = "color-yellow h4 neat" in knotly-frontend/src/store/canvasStore.ts
- [X] T027 [US1] Update updateNode, moveNode, deleteNode actions to call markDirty() in knotly-frontend/src/store/canvasStore.ts
- [X] T028 [US1] Implement saveFile(fileHandle?) action with saveKnotlyFile call, state update, markDirty clear in knotly-frontend/src/store/canvasStore.ts
- [X] T029 [US1] Add beforeunload event listener in knotly-frontend/src/App.tsx to show confirmation if hasUnsavedChanges = true

### StartScreen Component

- [X] T030 [P] [US1] Create knotly-frontend/src/components/StartScreen.tsx with basic structure and props interface
- [X] T031 [US1] Implement "New Note" button in StartScreen.tsx that initializes canvasStore with DEFAULT_TOKENS and empty nodes/edges
- [X] T032 [US1] Implement "Open File" button in StartScreen.tsx (placeholder, will be implemented in US2)
- [X] T033 [US1] Add screen routing logic in knotly-frontend/src/App.tsx (show StartScreen if nodes.length === 0 and !currentFilePath, else show Canvas)

### TitleBar Component

- [X] T034 [P] [US1] Create knotly-frontend/src/components/TitleBar.tsx with filename display
- [X] T035 [US1] Add ● indicator when hasUnsavedChanges = true in TitleBar.tsx
- [X] T036 [US1] Add ✓ indicator for 2 seconds after save, then remove in TitleBar.tsx (use setTimeout)
- [X] T037 [US1] Add Cmd/Ctrl+S keyboard listener in TitleBar.tsx that calls canvasStore.saveFile()
- [X] T038 [US1] Render TitleBar in knotly-frontend/src/App.tsx above Canvas component

**Parallel Opportunities**: T030-T032 (StartScreen), T034-T036 (TitleBar) can run in parallel

**Dependencies**: T024-T029 must complete before T030-T038 (store actions needed by components)

**Testing**: After T038, user can create new note, add nodes, and save to .knotly.md file (US1 complete and testable)

---

## Phase 4: User Story 2 - Open and Edit Existing Note (Priority: P1) (13 tasks)

**Goal**: Complete read-write cycle with file loading and recent files

**Independent Test**: Create sample .knotly.md → click "Open File" → select file → verify all nodes/edges restored correctly

### File Loading

- [X] T039 [US2] Implement loadFile(fileHandle) action in knotly-frontend/src/store/canvasStore.ts with loadKnotlyFile call, token merge, state update
- [X] T040 [US2] Implement addRecentFile(path) action in knotly-frontend/src/store/canvasStore.ts with localStorage persistence (max 5 entries)
- [X] T041 [US2] Add localStorage load for recentFiles on store initialization in knotly-frontend/src/store/canvasStore.ts
- [X] T042 [US2] Implement "Open File" button handler in StartScreen.tsx that calls openFile() then loadFile()
- [X] T043 [US2] Add error handling UI in StartScreen.tsx for loadFile failures (show toast with error message)

### Drag & Drop

- [X] T044 [P] [US2] Add onDrop handler to knotly-frontend/src/components/StartScreen.tsx for file drop
- [X] T045 [US2] Add onDragOver handler to prevent default and show drop feedback in StartScreen.tsx
- [X] T046 [US2] Validate dropped file is .knotly.md in StartScreen.tsx, reject others with error message

### Recent Files

- [X] T047 [P] [US2] Add "Recent Files" section to StartScreen.tsx with list rendering
- [X] T048 [US2] Implement recent file entry click handler that loads file immediately (bypass file picker) in StartScreen.tsx
- [X] T049 [US2] Display filename and last modified date for each recent file entry in StartScreen.tsx
- [X] T050 [US2] Add empty state message "No recent files" when recentFiles.length === 0 in StartScreen.tsx
- [X] T051 [US2] Add "Clear Recent Files" button in StartScreen.tsx that clears localStorage and state

**Parallel Opportunities**: T044-T046 (drag & drop), T047-T051 (recent files) can run in parallel

**Dependencies**: T039-T041 must complete before T042-T051

**Testing**: After T051, user can open existing files via picker/drag-drop/recent-list (US2 complete and testable)

---

## Phase 5: User Story 3 - Connect Thoughts Quickly (Priority: P1) (12 tasks)

**Goal**: Implement auto-connect workflow and drag-to-connect gestures

**Independent Test**: Select node → double-click blank space → verify new node auto-connected and focus moved to it

### Auto-Connect on Double-Click

- [X] T052 [US3] Add selectedNodeId and editingNodeId fields to knotly-frontend/src/store/canvasStore.ts initial state
- [X] T053 [US3] Add setSelectedNode(id) and setEditingNode(id) actions to knotly-frontend/src/store/canvasStore.ts
- [X] T054 [US3] Update createNode action to accept selectedNodeId parameter and auto-create edge if provided in knotly-frontend/src/store/canvasStore.ts
- [X] T055 [US3] Update createNode to set editingNodeId = newNode.id for immediate text entry in knotly-frontend/src/store/canvasStore.ts
- [X] T056 [US3] Add onDoubleClick handler to knotly-frontend/src/components/Canvas.tsx SVG element
- [X] T057 [US3] Calculate click position relative to canvas (account for zoom/pan) in Canvas.tsx double-click handler
- [X] T058 [US3] Call createNode(position, selectedNodeId) in Canvas.tsx double-click handler

### Edge Creation & Rendering

- [X] T059 [P] [US3] Add connectingFrom field to knotly-frontend/src/store/canvasStore.ts initial state
- [X] T060 [P] [US3] Implement createEdge(fromId, toId) action with validation (no self-loops, no duplicates, check nodes exist) in knotly-frontend/src/store/canvasStore.ts
- [X] T061 [P] [US3] Implement deleteEdge(id) action in knotly-frontend/src/store/canvasStore.ts
- [X] T062 [P] [US3] Create knotly-frontend/src/components/EdgeComponent.tsx with rough.js line rendering (dashed style, seed from edge.id)
- [X] T063 [US3] Render EdgeComponent for all edges in knotly-frontend/src/components/Canvas.tsx

**Parallel Opportunities**: T052-T055 (store), T059-T062 (edge system) can run in parallel initially

**Dependencies**: T056-T058 depend on T052-T055; T063 depends on T062

**Testing**: After T063, user can create connected nodes via double-click workflow (US3 partially testable - drag gestures in next tasks)

---

## Phase 6: User Story 3 Continued - Drag-to-Connect Gestures (8 tasks)

**Goal**: Add desktop drag-to-connect and mobile long-press-to-connect

### Desktop Drag-to-Connect

- [x] T064 [P] [US3] Add edge drag handle circle to knotly-frontend/src/components/NodeComponent.tsx (transparent circle at border)
- [x] T065 [US3] Add useDrag hook to edge handle in NodeComponent.tsx that sets connectingFrom on drag start
- [x] T066 [US3] Add findNodeAtPosition(xy) helper in knotly-frontend/src/utils/canvasHelpers.ts (new file)
- [x] T067 [US3] On drag end, find target node and call createEdge if valid target in NodeComponent.tsx
- [x] T068 [US3] Render temporary connection line in Canvas.tsx when connectingFrom !== null (use mouse position state)

### Mobile Long-Press-to-Connect

- [x] T069 [P] [US3] Add useLongPress hook to NodeComponent.tsx main circle (500ms threshold)
- [x] T070 [US3] On long-press, set connectingFrom = node.id with visual feedback (border glow/highlight) in NodeComponent.tsx
- [x] T071 [US3] Add onClick handler to NodeComponent.tsx that checks connectingFrom and creates edge if in connecting mode

**Parallel Opportunities**: T064-T068 (desktop), T069-T071 (mobile) can run in parallel

**Testing**: After T071, user can create connections via drag (desktop) or long-press+tap (mobile) (US3 fully complete and testable)

---

## Phase 7: User Story 4 - Customize Node Appearance with Tokens (Priority: P2) (10 tasks)

**Goal**: Implement token-based styling with visual style panel

**Independent Test**: Right-click node → select "color-blue h3 neat" → verify node updates immediately with combined styles

### Token Parsing Integration

- [x] T072 [P] [US4] Add tokenDefinitions field to knotly-frontend/src/store/canvasStore.ts initial state (initialized with DEFAULT_TOKENS)
- [x] T073 [P] [US4] Update NodeComponent.tsx to import parseTokens and tokenDefinitions from store
- [x] T074 [US4] Add useMemo hook in NodeComponent.tsx to parse node.style with parseTokens(node.style, tokenDefinitions)
- [x] T075 [US4] Pass resolved style object to rough.js rendering (stroke, fill, strokeWidth, roughness, width, height, fontSize) in NodeComponent.tsx

### StylePanel Component

- [x] T076 [P] [US4] Create knotly-frontend/src/components/StylePanel.tsx with props {nodeId, currentStyle, onClose}
- [x] T077 [US4] Categorize tokens into colorTokens, sizeTokens, feelTokens, borderTokens arrays in StylePanel.tsx
- [x] T078 [US4] Render category sections with token buttons (Colors, Sizes, Feel, Border) in StylePanel.tsx
- [x] T079 [US4] Implement toggleToken(token) function with local state + debounced updateNode call (100ms) in StylePanel.tsx
- [x] T080 [US4] Display current token combination string at bottom of panel in StylePanel.tsx
- [x] T081 [US4] Add onContextMenu handler to NodeComponent.tsx that opens StylePanel (prevent default, set showStylePanel = true)

**Parallel Opportunities**: T072-T075 (parsing), T076-T080 (panel) can run in parallel

**Dependencies**: T081 depends on T076-T080

**Testing**: After T081, user can apply token styles via right-click panel (US4 complete and testable)

---

## Phase 8: User Story 5 - Edit Notes in External Text Editor (Priority: P2) (3 tasks)

**Goal**: Ensure file format is human-editable and changes reload correctly

**Independent Test**: Open .knotly.md in VS Code → modify node content and add custom token → reload in app → verify changes reflected

### File Format Validation

- [x] T082 [P] [US5] Add YAML frontmatter structure validation in loadKnotlyFile (check tokens, nodes, edges keys exist) in knotly-frontend/src/utils/fileIO.ts
- [x] T083 [US5] Add graceful handling for missing tokens section (merge with DEFAULT_TOKENS) in loadKnotlyFile in knotly-frontend/src/utils/fileIO.ts
- [x] T084 [US5] Add duplicate node ID detection with auto-fix (generate new ID, console.warn) in loadKnotlyFile in knotly-frontend/src/utils/fileIO.ts

**Parallel Opportunities**: All tasks can run in parallel (same file, different functions)

**Testing**: After T084, user can edit .knotly.md manually and reload (US5 complete and testable)

---

## Phase 9: User Story 6 - Maintain Existing Canvas Features (Priority: P2) (2 tasks)

**Goal**: Verify Milestone 2 features still work with token-based styling

**Independent Test**: Drag node → pinch-zoom → two-finger pan → delete node → verify all gestures work identically to Milestone 2

### Compatibility Verification

- [x] T085 [US6] Verify drag-node, pinch-zoom, two-finger pan gestures still work in knotly-frontend/src/components/Canvas.tsx (manual test)
- [x] T086 [US6] Verify Delete/Backspace key deletes selected node + edges in knotly-frontend/src/store/canvasStore.ts (manual test)

**Testing**: After T086, all Milestone 2 features confirmed working (US6 complete and testable)

---

## Phase 10: Polish & Cross-Cutting Concerns (11 tasks)

**Goal**: Error handling, edge cases, performance warnings, final UX polish

### Error Handling & Edge Cases

- [x] T087 [P] Add malformed YAML error message with line number in loadKnotlyFile in knotly-frontend/src/utils/fileIO.ts
- [x] T088 [P] Add write permission error handling with "save to different location" option in saveFile action in knotly-frontend/src/store/canvasStore.ts
- [x] T089 [P] Add unsupported file type validation for drag-and-drop (.knotly.md only) in StartScreen.tsx
- [x] T090 Add node position clamping (±10,000 pixels) in createNode and moveNode actions in knotly-frontend/src/store/canvasStore.ts
- [x] T091 Add node content length warning (>5000 chars) in updateNode action in knotly-frontend/src/store/canvasStore.ts (console.warn, no hard limit)

### Performance & Monitoring

- [x] T092 [P] Add performance.mark/measure in loadFile and saveFile actions for monitoring in knotly-frontend/src/store/canvasStore.ts
- [x] T093 Add console.time in parseTokens for performance tracking (log if >10ms) in knotly-frontend/src/utils/tokenParser.ts
- [x] T094 Add large file warning dialog (>10,000 nodes) before loading in loadFile action in knotly-frontend/src/store/canvasStore.ts

### Final UX Polish

- [x] T095 [P] Add loading spinner during file load/save operations in TitleBar.tsx
- [x] T096 Add success toast "File saved successfully" after save completes in TitleBar.tsx or App.tsx
- [x] T097 Add keyboard shortcut help tooltip (Cmd+S to save, Delete to delete node) in TitleBar.tsx or StartScreen.tsx

**Parallel Opportunities**: T087-T089, T092-T093, T095-T097 can run in parallel (different files)

---

## Dependencies & Execution Order

### Critical Path (Must Complete in Order)

1. **Phase 1 (Setup)** → Phase 2 (Foundational) → All User Story Phases
2. **Phase 2** blocks all subsequent phases (token parser and file I/O are foundational)
3. **User Story Phases (3-8)** are independent after Phase 2 completes

### User Story Completion Order

```
Phase 3 (US1) → Delivers MVP (save first note)
Phase 4 (US2) → Completes file I/O cycle (open + save)
Phase 5-6 (US3) → Enhanced connections (auto-connect + gestures)
Phase 7 (US4) → Token styling UI
Phase 8 (US5) → External editor compatibility
Phase 9 (US6) → Milestone 2 compatibility check
Phase 10 → Polish
```

### Parallel Execution Opportunities

**Phase 1 Parallelism**: T002-T003, T006-T008, T010-T011 (7 tasks can run concurrently)

**Phase 2 Parallelism**: Token parser (T012-T017) and File I/O (T018-T023) are independent (12 tasks, 2 parallel streams)

**Phase 3 Parallelism**: StartScreen (T030-T033) and TitleBar (T034-T038) (8 tasks, 2 streams)

**Phase 4 Parallelism**: Drag & drop (T044-T046) and Recent files (T047-T051) (8 tasks, 2 streams)

**Phase 5 Parallelism**: Store updates (T052-T055) and Edge system (T059-T062) (8 tasks, 2 streams)

**Phase 6 Parallelism**: Desktop gestures (T064-T068) and Mobile gestures (T069-T071) (8 tasks, 2 streams)

**Phase 7 Parallelism**: Token parsing integration (T072-T075) and StylePanel component (T076-T080) (9 tasks, 2 streams)

**Phase 8 Parallelism**: All validation tasks (T082-T084) can run in parallel (3 tasks)

**Phase 10 Parallelism**: Error handling (T087-T089), Performance (T092-T093), UX polish (T095-T097) (9 tasks, 3 streams)

**Total Parallel Capacity**: ~40% of tasks (31 out of 77) can be parallelized with proper task scheduling

---

## Implementation Strategy

### MVP First (Incremental Delivery)

**Minimum Viable Product**: User Story 1 (Tasks T001-T038)
- User can create new note, add nodes, and save to .knotly.md
- Delivers complete write cycle (39 tasks total for MVP)
- Can be demoed and tested as standalone feature

**Iteration 2**: Add User Story 2 (Tasks T039-T051)
- Completes read-write cycle with file loading
- Recent files for productivity (52 tasks total)

**Iteration 3**: Add User Story 3 (Tasks T052-T071)
- Enhanced connection workflows (64 tasks total)
- Brainstorming UX improvements

**Iteration 4**: Add User Stories 4-6 + Polish (Tasks T072-T097)
- Token styling, external editor, compatibility, polish (77 tasks total)
- Full feature complete

### Testing Approach (Per Constitution)

**Unit Tests** (60% coverage):
- Token parser: T015-T017 → test all atomic/composite tokens, recursion limits, unknown tokens
- File I/O: T019-T023 → test YAML roundtrip, content extraction, edge cases (malformed YAML, duplicate IDs)
- Zustand actions: T024-T029, T039-T041, T052-T055, T059-T061 → test state updates, dirty tracking

**Integration Tests** (30% coverage):
- File workflows: New note → add nodes → save → reload → verify state
- Token application: parseTokens integration with NodeComponent rendering
- Connection workflows: Double-click → auto-connect → verify edge created

**E2E Tests** (10% coverage):
- Full user journey: Start screen → new note → add 5 nodes → apply styles → save → close → reopen → verify all content

---

## Task Summary

**Total Tasks**: 77
- Phase 1 (Setup): 11 tasks
- Phase 2 (Foundational): 12 tasks
- Phase 3 (US1 - Save First Note): 15 tasks
- Phase 4 (US2 - Open Existing Note): 13 tasks
- Phase 5 (US3 - Connect Quickly): 12 tasks
- Phase 6 (US3 - Gestures): 8 tasks
- Phase 7 (US4 - Token Styling): 10 tasks
- Phase 8 (US5 - External Editor): 3 tasks
- Phase 9 (US6 - Milestone 2 Compat): 2 tasks
- Phase 10 (Polish): 11 tasks

**Parallelizable Tasks**: 31 (marked with [P])

**Suggested MVP**: Phase 1-3 (39 tasks) delivers complete create-and-save workflow

**Estimated Effort**:
- MVP (39 tasks): ~2-3 days for experienced developer
- Full feature (77 tasks): ~5-7 days for experienced developer
- Testing (separate): ~2 days for comprehensive test coverage

---

## Format Validation

✅ All tasks follow required format: `- [ ] TXXX [P?] [USX?] Description with file path`
✅ All user story tasks have [US1]-[US6] labels
✅ Setup and foundational tasks have no story labels
✅ All tasks include specific file paths
✅ Task IDs are sequential (T001-T097)
✅ Parallelizable tasks marked with [P]
✅ Dependencies clearly documented
✅ Independent test criteria defined for each user story
