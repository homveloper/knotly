# Implementation Tasks: Markdown Mind Map Editor

**Feature**: 004-markdown-mindmap-editor
**Branch**: `004-markdown-mindmap-editor`
**Created**: 2025-10-20
**Status**: Ready for Implementation

## Overview

This document provides a dependency-ordered task list for implementing the Markdown Mind Map Editor feature. Tasks are organized by user story (P1, P2, P3) to enable independent, incremental delivery. Each phase can be implemented, tested, and shipped separately.

**Total Tasks**: 121
**Test Coverage Target**: 80% (per constitution)
**MVP Scope**: Phases 1-3 (Setup + Foundational + User Story 1: Real-time Bidirectional Sync)

---

## Phase 1: Setup & Dependencies (9 tasks)

**Goal**: Install dependencies and set up project structure for the feature.

**Independent Test**: Project builds successfully with new dependencies, TypeScript compiles with no errors.

### Tasks

- [X] T001 Install marked@^15.0.0 dependency in knotly-frontend/package.json
- [X] T002 Install react-split@^2.0.14 dependency in knotly-frontend/package.json
- [X] T003 Install @types/react-split@^2.0.6 dev dependency in knotly-frontend/package.json (SKIPPED: react-split ships with built-in types)
- [X] T004 Create knotly-frontend/src/repository/ directory for repository layer
- [X] T005 Create knotly-frontend/tests/unit/ directory for unit tests
- [X] T006 Create knotly-frontend/tests/integration/ directory for integration tests
- [X] T007 Verify TypeScript compilation with pnpm exec tsc --noEmit
- [X] T008 Verify ESLint passes with pnpm lint (pre-existing errors noted, no new errors from this phase)
- [ ] T009 Commit setup changes with message "feat(004): install dependencies and create repository structure"

---

## Phase 2: Foundational Layer (19 tasks)

**Goal**: Build core infrastructure used by all user stories - type definitions, factory functions, store extensions, and repository layer.

**Independent Test**: All factory functions return valid Result types, store compiles with TypeScript strict mode, helper functions pass unit tests.

**Blocking For**: All user story phases (P1, P2, P3)

### Type Definitions & Factories

- [ ] T010 [P] Extend knotly-frontend/src/types/canvas.ts with BaseNode interface (id, content, style, position, measuredSize, groupId)
- [ ] T011 [P] Add TextNode interface to knotly-frontend/src/types/canvas.ts (type: 'text', level: 1-5)
- [ ] T012 [P] Add HeaderNode interface to knotly-frontend/src/types/canvas.ts (type: 'header', level: 1-6)
- [ ] T013 [P] Add CodeNode interface to knotly-frontend/src/types/canvas.ts (type: 'code', language, expanded)
- [ ] T014 [P] Add ImageNode interface to knotly-frontend/src/types/canvas.ts (type: 'image', imageUrl, altText)
- [ ] T015 [P] Create discriminated union type Node = TextNode | HeaderNode | CodeNode | ImageNode in knotly-frontend/src/types/canvas.ts
- [ ] T016 [P] Add LayoutType = 'radial' | 'horizontal' to knotly-frontend/src/types/canvas.ts
- [ ] T017 [P] Add Result<T, E> type to knotly-frontend/src/types/canvas.ts (ok: boolean, value/error)

### Repository Layer - Helpers

- [ ] T018 [P] Implement extractStyleTokens(text: string) in knotly-frontend/src/repository/helpers.ts with regex /\s*\{(\.[\w-]+(?:\s+\.[\w-]+)*)\}\s*$/
- [ ] T019 [P] Implement restoreStyleTokens(content: string, tokens: string[]) in knotly-frontend/src/repository/helpers.ts
- [ ] T020 [P] Implement computeLevels(nodes: Node[], edges: Edge[]) using BFS in knotly-frontend/src/repository/helpers.ts
- [ ] T021 [P] Implement findRootNodes(nodes: Node[], edges: Edge[]) in knotly-frontend/src/repository/helpers.ts
- [ ] T022 [P] Implement findChildren(nodeId: string, edges: Edge[]) in knotly-frontend/src/repository/helpers.ts

### Factory Functions

- [ ] T023 [P] Implement createTextNode factory in knotly-frontend/src/repository/factories.ts returning Result<TextNode, ValidationError>
- [ ] T024 [P] Implement createHeaderNode factory in knotly-frontend/src/repository/factories.ts with level validation (1-6)
- [ ] T025 [P] Implement createCodeNode factory in knotly-frontend/src/repository/factories.ts with language validation
- [ ] T026 [P] Implement createImageNode factory in knotly-frontend/src/repository/factories.ts with URL validation
- [ ] T027 [P] Implement createEdge factory in knotly-frontend/src/repository/factories.ts with sourceId/targetId validation

### Store Extension

- [ ] T028 Extend knotly-frontend/src/store/canvasStore.ts with layout: LayoutType field (default: 'radial')

---

## Phase 3: User Story 1 - Real-time Bidirectional Sync (Priority: P1) (19 tasks)

**Goal**: Users can type markdown in editor and see nodes in canvas, and edit nodes in canvas to update markdown.

**Why P1**: Core value proposition - bidirectional sync between text and visual representation.

**Independent Test**:
1. Type `# Hello\n- World` in editor → 2 nodes appear in canvas after 300ms
2. Edit canvas node "Hello" → "Goodbye" → markdown updates instantly to `# Goodbye`
3. Cursor position preserved during canvas → editor updates

**Acceptance Criteria** (from spec.md):
- ✅ AS-1.1: Headers with different levels create nodes with parent-child edges
- ✅ AS-1.2: Bulleted lists with indentation create nodes with edges based on indentation
- ✅ AS-1.3: Canvas node edits update markdown text
- ✅ AS-1.4: Canvas node deletes remove markdown lines
- ✅ AS-1.5: Canvas updates debounced to 300ms

### Tasks

#### Unit Tests for Parser

- [ ] T029 [P] [US1] Write unit test for parseMarkdown parsing single header in knotly-frontend/tests/unit/markdownParser.test.ts
- [ ] T030 [P] [US1] Write unit test for parseMarkdown parsing nested headers (# → ## → ###) in knotly-frontend/tests/unit/markdownParser.test.ts
- [ ] T031 [P] [US1] Write unit test for parseMarkdown parsing simple list in knotly-frontend/tests/unit/markdownParser.test.ts
- [ ] T032 [P] [US1] Write unit test for parseMarkdown parsing nested lists (3 levels) in knotly-frontend/tests/unit/markdownParser.test.ts
- [ ] T033 [P] [US1] Write unit test for parseMarkdown handling layout comment `<!-- knotly-layout: radial -->` in knotly-frontend/tests/unit/markdownParser.test.ts

#### Parser Implementation

- [ ] T034 [US1] Implement parseMarkdown(text: string) in knotly-frontend/src/repository/markdownParser.ts using marked.lexer()
- [ ] T035 [US1] Add layout comment extraction logic to parseMarkdown in knotly-frontend/src/repository/markdownParser.ts
- [ ] T036 [US1] Add heading token processing to parseMarkdown using nodeStack for hierarchy in knotly-frontend/src/repository/markdownParser.ts
- [ ] T037 [US1] Add list token processing to parseMarkdown with indentation-based edges in knotly-frontend/src/repository/markdownParser.ts
- [ ] T038 [US1] Add horizontal rule (---) processing for groupId in parseMarkdown in knotly-frontend/src/repository/markdownParser.ts

#### Unit Tests for Serializer

- [ ] T039 [P] [US1] Write unit test for serializeToMarkdown with single header in knotly-frontend/tests/unit/markdownSerializer.test.ts
- [ ] T040 [P] [US1] Write unit test for serializeToMarkdown with nested headers in knotly-frontend/tests/unit/markdownSerializer.test.ts
- [ ] T041 [P] [US1] Write unit test for serializeToMarkdown with nested lists in knotly-frontend/tests/unit/markdownSerializer.test.ts

#### Serializer Implementation

- [ ] T042 [US1] Implement serializeToMarkdown(nodes, edges, layout) in knotly-frontend/src/repository/markdownSerializer.ts
- [ ] T043 [US1] Add layout comment generation to serializeToMarkdown in knotly-frontend/src/repository/markdownSerializer.ts
- [ ] T044 [US1] Add header serialization logic to serializeToMarkdown in knotly-frontend/src/repository/markdownSerializer.ts
- [ ] T045 [US1] Add list serialization with indentation to serializeToMarkdown in knotly-frontend/src/repository/markdownSerializer.ts

#### Integration

- [ ] T046 [US1] Create MarkdownEditor component in knotly-frontend/src/components/MarkdownEditor.tsx with textarea and useRef for dirty flag
- [ ] T047 [US1] Add 300ms debounce for editor → canvas updates in MarkdownEditor using useLayoutEffect in knotly-frontend/src/components/MarkdownEditor.tsx

---

## Phase 4: User Story 2 - Node Styling with Markdown Tokens (Priority: P2) (12 tasks)

**Goal**: Users can add `{.color-red .h3}` tokens to markdown elements to style nodes visually.

**Why P2**: Enables visual customization while maintaining pure markdown format (competitive differentiator).

**Independent Test**:
1. Type `# Header {.color-blue .h1}` → node renders with blue color and h1 size
2. Edit node style in canvas → markdown updates to show `{.color-blue .h1}` token

**Dependencies**: User Story 1 (parser/serializer must exist)

**Acceptance Criteria** (from spec.md):
- ✅ AS-2.1: `{.color-red}` token applies red color to node
- ✅ AS-2.2: `{.h3}` token applies h3 size to node
- ✅ AS-2.3: Multiple tokens `{.color-blue .h1}` apply all styles
- ✅ AS-2.4: Canvas style edits update markdown tokens

### Tasks

#### Unit Tests

- [ ] T048 [P] [US2] Write unit test for extractStyleTokens with single token `{.color-red}` in knotly-frontend/tests/unit/helpers.test.ts
- [ ] T049 [P] [US2] Write unit test for extractStyleTokens with multiple tokens `{.color-blue .h1}` in knotly-frontend/tests/unit/helpers.test.ts
- [ ] T050 [P] [US2] Write unit test for extractStyleTokens with no tokens in knotly-frontend/tests/unit/helpers.test.ts
- [ ] T051 [P] [US2] Write unit test for parseMarkdown extracting style tokens from header in knotly-frontend/tests/unit/markdownParser.test.ts
- [ ] T052 [P] [US2] Write unit test for serializeToMarkdown restoring style tokens to header in knotly-frontend/tests/unit/markdownSerializer.test.ts

#### Parser/Serializer Extensions

- [ ] T053 [US2] Integrate extractStyleTokens into parseMarkdown for heading tokens in knotly-frontend/src/repository/markdownParser.ts
- [ ] T054 [US2] Integrate extractStyleTokens into parseMarkdown for list_item tokens in knotly-frontend/src/repository/markdownParser.ts
- [ ] T055 [US2] Integrate restoreStyleTokens into serializeToMarkdown for headers in knotly-frontend/src/repository/markdownSerializer.ts
- [ ] T056 [US2] Integrate restoreStyleTokens into serializeToMarkdown for lists in knotly-frontend/src/repository/markdownSerializer.ts

#### Node Rendering

- [ ] T057 [US2] Modify NodeComponent in knotly-frontend/src/components/NodeComponent.tsx to apply style tokens using parseTokens from utils/tokenParser.ts
- [ ] T058 [US2] Modify TextNode in knotly-frontend/src/components/TextNode.tsx to render with style-based colors/sizes
- [ ] T059 [US2] Add HeaderNode component in knotly-frontend/src/components/HeaderNode.tsx with larger font sizes based on level (h1-h6)

---

## Phase 5: User Story 3 - Multi-node Type Support (Priority: P2) (17 tasks)

**Goal**: Code blocks and images render as distinct node types with specialized UI (preview/expand for code, thumbnails for images).

**Why P2**: Extends utility beyond simple text hierarchies, essential for technical documentation use cases.

**Independent Test**:
1. Type ` ```javascript\nconsole.log('test');\n``` ` → code node appears with "javascript" language indicator
2. Click expand button on code node → full code content visible
3. Type `![Alt text](https://example.com/image.png)` → image node shows thumbnail

**Dependencies**: User Story 1 (parser/serializer), User Story 2 (style tokens may apply to code/image)

**Acceptance Criteria** (from spec.md):
- ✅ AS-3.1: Code blocks create code nodes with language indicated
- ✅ AS-3.2: Code nodes have preview/expanded toggle
- ✅ AS-3.3: Images create image nodes with thumbnails
- ✅ AS-3.4: Code/images after headers/lists connect as children
- ✅ AS-3.5: Code/images at file top appear as root nodes

### Tasks

#### Unit Tests

- [ ] T060 [P] [US3] Write unit test for parseMarkdown parsing code block with language in knotly-frontend/tests/unit/markdownParser.test.ts
- [ ] T061 [P] [US3] Write unit test for parseMarkdown parsing image ![alt](url) in knotly-frontend/tests/unit/markdownParser.test.ts
- [ ] T062 [P] [US3] Write unit test for parseMarkdown connecting code block to preceding header in knotly-frontend/tests/unit/markdownParser.test.ts
- [ ] T063 [P] [US3] Write unit test for parseMarkdown connecting image to preceding list item in knotly-frontend/tests/unit/markdownParser.test.ts
- [ ] T064 [P] [US3] Write unit test for parseMarkdown treating root code block as independent node in knotly-frontend/tests/unit/markdownParser.test.ts
- [ ] T065 [P] [US3] Write unit test for serializeToMarkdown outputting code block with language and style tokens in knotly-frontend/tests/unit/markdownSerializer.test.ts
- [ ] T066 [P] [US3] Write unit test for serializeToMarkdown outputting image with alt text, URL, and style tokens in knotly-frontend/tests/unit/markdownSerializer.test.ts

#### Parser/Serializer Extensions

- [ ] T067 [US3] Add code token processing to parseMarkdown in knotly-frontend/src/repository/markdownParser.ts using lastParentId for attachment
- [ ] T068 [US3] Add image token processing to parseMarkdown in knotly-frontend/src/repository/markdownParser.ts using lastParentId for attachment
- [ ] T069 [US3] Add code block serialization to serializeToMarkdown in knotly-frontend/src/repository/markdownSerializer.ts
- [ ] T070 [US3] Add image serialization to serializeToMarkdown in knotly-frontend/src/repository/markdownSerializer.ts

#### Components

- [ ] T071 [P] [US3] Create CodeNode component in knotly-frontend/src/components/CodeNode.tsx with preview/expand toggle (useState)
- [ ] T072 [P] [US3] Create ImageNode component in knotly-frontend/src/components/ImageNode.tsx with thumbnail rendering and alt text
- [ ] T073 [US3] Integrate extractStyleTokens for code blocks in parseMarkdown in knotly-frontend/src/repository/markdownParser.ts
- [ ] T074 [US3] Integrate extractStyleTokens for images in parseMarkdown in knotly-frontend/src/repository/markdownParser.ts
- [ ] T075 [US3] Update NodeComponent in knotly-frontend/src/components/NodeComponent.tsx to render CodeNode for type='code'
- [ ] T076 [US3] Update NodeComponent in knotly-frontend/src/components/NodeComponent.tsx to render ImageNode for type='image'

---

## Phase 6: User Story 4 - Adjustable Split View (Priority: P3) (11 tasks)

**Goal**: Users can drag divider to adjust editor/canvas split ratio (30-70% range) with LocalStorage persistence.

**Why P3**: Supports different user workflows (editor-focused vs canvas-focused), enhances UX but not core functionality.

**Independent Test**:
1. Drag divider from 50-50 to 40-60 → panels resize in real-time
2. Reload app → split ratio restored to 40-60
3. Drag to 25% (blocked at 30%) or 75% (blocked at 70%)

**Dependencies**: User Story 1 (basic editor/canvas split must exist)

**Acceptance Criteria** (from spec.md):
- ✅ AS-4.1: Divider drag resizes panels in real-time
- ✅ AS-4.2: Split ratio constrained to 30%-70%
- ✅ AS-4.3: Ratio persists via LocalStorage
- ✅ AS-4.4: Ratio percentage maintained on window resize

### Tasks

#### Unit Tests

- [ ] T077 [P] [US4] Write unit test for split ratio clamping (30-70 range) in knotly-frontend/tests/unit/splitRatio.test.ts
- [ ] T078 [P] [US4] Write unit test for LocalStorage persistence of split ratio in knotly-frontend/tests/unit/splitRatio.test.ts

#### Component Implementation

- [ ] T079 [US4] Create SplitLayout component in knotly-frontend/src/components/SplitLayout.tsx using react-split with sizes=[50, 50] default
- [ ] T080 [US4] Add LocalStorage persistence to SplitLayout with key 'split-sizes' in knotly-frontend/src/components/SplitLayout.tsx
- [ ] T081 [US4] Add useEffect to restore split ratio from LocalStorage on mount in SplitLayout in knotly-frontend/src/components/SplitLayout.tsx
- [ ] T082 [US4] Add onDrag handler to persist split ratio to LocalStorage in SplitLayout in knotly-frontend/src/components/SplitLayout.tsx
- [ ] T083 [US4] Add split ratio clamping logic (30-70%) to onDrag handler in SplitLayout in knotly-frontend/src/components/SplitLayout.tsx
- [ ] T084 [US4] Add ARIA attributes (role="separator", aria-orientation="vertical") to gutter in SplitLayout in knotly-frontend/src/components/SplitLayout.tsx
- [ ] T085 [US4] Add keyboard navigation (ArrowLeft/ArrowRight) to gutter in SplitLayout for WCAG 2.1 AA in knotly-frontend/src/components/SplitLayout.tsx
- [ ] T086 [US4] Integrate SplitLayout into App.tsx wrapping MarkdownEditor and Canvas in knotly-frontend/src/App.tsx
- [ ] T087 [US4] Update canvasStore to add splitRatio field and setSplitRatio action in knotly-frontend/src/store/canvasStore.ts

---

## Phase 7: User Story 5 - Layout Switching (Priority: P3) (18 tasks)

**Goal**: Users can toggle between radial and horizontal layouts with buttons, nodes reposition automatically, layout persists in markdown file.

**Why P3**: Different content structures benefit from different layouts (concept maps vs timelines), enhances presentation flexibility.

**Independent Test**:
1. Create mind map with 20 nodes in radial layout
2. Click "➡️ Horizontal" button → nodes reposition left-to-right in <1s
3. Save file → layout comment `<!-- knotly-layout: horizontal -->` appears at top
4. Reload file → horizontal layout restored

**Dependencies**: User Story 1 (parser/serializer for layout comment), User Story 3 (multi-node types for comprehensive testing)

**Acceptance Criteria** (from spec.md):
- ✅ AS-5.1: Horizontal button repositions nodes left-to-right
- ✅ AS-5.2: Radial button repositions nodes center-outward
- ✅ AS-5.3: Layout saved as layout comment
- ✅ AS-5.4: Layout loaded from comment on file open
- ✅ AS-5.5: Manual node drags not persisted (recalculated on layout switch)

### Tasks

#### Unit Tests for Layout Engine

- [ ] T088 [P] [US5] Write unit test for computeLevels with 3-level hierarchy in knotly-frontend/tests/unit/layoutEngine.test.ts
- [ ] T089 [P] [US5] Write unit test for calculateRadialPositions with 10 nodes checking no overlaps in knotly-frontend/tests/unit/layoutEngine.test.ts
- [ ] T090 [P] [US5] Write unit test for calculateHorizontalPositions with 10 nodes checking no overlaps in knotly-frontend/tests/unit/layoutEngine.test.ts
- [ ] T091 [P] [US5] Write unit test for applyLayout returning Result.error if nodes missing measuredSize in knotly-frontend/tests/unit/layoutEngine.test.ts

#### Layout Engine Implementation

- [ ] T092 [US5] Implement calculateRadialPositions in knotly-frontend/src/repository/layoutEngine.ts using polar coordinates and RADIAL_CENTER (500, 500)
- [ ] T093 [US5] Add collision prevention to calculateRadialPositions ensuring radius > totalNodesWidth / (2π) in knotly-frontend/src/repository/layoutEngine.ts
- [ ] T094 [US5] Implement calculateHorizontalPositions in knotly-frontend/src/repository/layoutEngine.ts using HORIZONTAL_START (100, 100)
- [ ] T095 [US5] Add collision prevention to calculateHorizontalPositions using measuredSize-based spacing in knotly-frontend/src/repository/layoutEngine.ts
- [ ] T096 [US5] Implement applyLayout(nodes, edges, layout) in knotly-frontend/src/repository/layoutEngine.ts calling computeLevels + calculateRadialPositions/calculateHorizontalPositions
- [ ] T097 [US5] Add measuredSize validation to applyLayout returning Result.error if any node missing size in knotly-frontend/src/repository/layoutEngine.ts

#### Component & Store Integration

- [ ] T098 [US5] Create LayoutSelector component in knotly-frontend/src/components/LayoutSelector.tsx with "🌟 Radial" and "➡️ Horizontal" buttons
- [ ] T099 [US5] Add setLayout action to canvasStore in knotly-frontend/src/store/canvasStore.ts calling applyLayout and updating nodes
- [ ] T100 [US5] Add applyCurrentLayout action to canvasStore in knotly-frontend/src/store/canvasStore.ts for re-applying layout after edits
- [ ] T101 [US5] Integrate LayoutSelector into Canvas toolbar in knotly-frontend/src/components/Canvas.tsx
- [ ] T102 [US5] Update parseMarkdown to default layout to 'radial' if comment missing in knotly-frontend/src/repository/markdownParser.ts
- [ ] T103 [US5] Update serializeToMarkdown to always output layout comment at file top in knotly-frontend/src/repository/markdownSerializer.ts
- [ ] T104 [US5] Add layout change handler in LayoutSelector calling canvasStore.setLayout in knotly-frontend/src/components/LayoutSelector.tsx
- [ ] T105 [US5] Trigger serializeAndUpdateMarkdown after layout change to persist comment in knotly-frontend/src/components/LayoutSelector.tsx

---

## Phase 8: Polish & Cross-Cutting Concerns (15 tasks)

**Goal**: Handle edge cases, add error handling, improve performance, ensure accessibility.

**Independent Test**: All edge cases from spec.md handled gracefully, 80% test coverage achieved, no ESLint warnings, build succeeds.

### Error Handling

- [ ] T106 [P] Add parse error handling to parseMarkdown returning Result.error for unclosed code blocks in knotly-frontend/src/repository/markdownParser.ts
- [ ] T107 [P] Add circular reference detection to parseMarkdown in knotly-frontend/src/repository/markdownParser.ts
- [ ] T108 [P] Add error notification UI to MarkdownEditor for parse errors in knotly-frontend/src/components/MarkdownEditor.tsx
- [ ] T109 [P] Add error notification UI to LayoutSelector for layout errors in knotly-frontend/src/components/LayoutSelector.tsx

### Edge Cases

- [ ] T110 [P] Add cursor position preservation logic to MarkdownEditor using useLayoutEffect and setSelectionRange in knotly-frontend/src/components/MarkdownEditor.tsx
- [ ] T111 [P] Add broken image handling to ImageNode showing placeholder icon in knotly-frontend/src/components/ImageNode.tsx
- [ ] T112 [P] Add long line handling to CodeNode with horizontal scroll or wrap in knotly-frontend/src/components/CodeNode.tsx
- [ ] T113 [P] Add 500-node warning to parseMarkdown logging warning if nodes.length > 500 in knotly-frontend/src/repository/markdownParser.ts
- [ ] T121 [P] Add debounce cancellation logic to MarkdownEditor when user drags node to prevent race conditions in knotly-frontend/src/components/MarkdownEditor.tsx

### Performance

- [ ] T114 [P] Add performance logging to applyLayout measuring execution time in knotly-frontend/src/repository/layoutEngine.ts
- [ ] T115 [P] Verify 60fps rendering with Chrome DevTools for 100-node document
- [ ] T116 [P] Verify 300ms debounce in MarkdownEditor using performance.now() timing

### Testing & Validation

- [ ] T117 [P] Write integration test for editor → canvas → editor round-trip in knotly-frontend/tests/integration/MarkdownEditor.test.tsx
- [ ] T118 [P] Write integration test for cursor preservation after canvas update in knotly-frontend/tests/integration/MarkdownEditor.test.tsx
- [ ] T119 Run pnpm test to verify 80% coverage across all repository layer files
- [ ] T120 Run pnpm lint to verify zero ESLint warnings

---

## Dependencies & Execution Order

### Story Dependency Graph

```
Phase 1 (Setup)
   ↓
Phase 2 (Foundational)
   ↓
   ├─→ Phase 3 (US1: Bidirectional Sync) [P1] ← MVP SCOPE
   │      ↓
   │      ├─→ Phase 4 (US2: Style Tokens) [P2]
   │      │
   │      ├─→ Phase 5 (US3: Multi-node Types) [P2]
   │      │
   │      └─→ Phase 6 (US4: Split View) [P3]
   │             ↓
   │             └─→ Phase 7 (US5: Layout Switch) [P3]
   │                    ↓
   └──────────────────→ Phase 8 (Polish)
```

**Independent Stories**:
- US2 (Style Tokens) can run in parallel with US3 (Multi-node Types) after US1
- US4 (Split View) can start before US5 (Layout Switch) completes

**Blocking Dependencies**:
- US1 MUST complete before US2, US3, US4, US5 (provides parser/serializer foundation)
- US2 and US3 SHOULD complete before US5 (layout needs all node types for comprehensive testing)

---

## Parallel Execution Opportunities

### Phase 2 (Foundational)
**Parallelizable**: T010-T017 (type definitions), T018-T022 (helpers), T023-T027 (factories) can all run concurrently in different files.

### Phase 3 (US1)
**Parallelizable**: T029-T033 (parser tests), T039-T041 (serializer tests) can run in parallel with separate test files.

### Phase 4 (US2)
**Parallelizable**: T048-T050 (helper tests), T051-T052 (integration tests) run in parallel.

### Phase 5 (US3)
**Parallelizable**: T060-T067 (unit tests), T071-T072 (component creation) can run concurrently.

### Phase 7 (US5)
**Parallelizable**: T088-T091 (layout tests), T098 (LayoutSelector), T099-T100 (store actions) can run in parallel.

### Phase 8 (Polish)
**Parallelizable**: T106-T109 (error handling), T110-T113 (edge cases), T114-T116 (performance) all independent.

---

## Implementation Strategy

### MVP-First Approach

**Milestone 1 - MVP (Phase 1-3)**:
- **Scope**: User Story 1 only (Real-time Bidirectional Sync)
- **Deliverable**: Users can type markdown and see nodes, edit nodes to update markdown
- **Tasks**: T001-T047 (47 tasks)
- **Estimated Time**: 2-3 days
- **Value**: Core feature functional, testable, shippable

**Milestone 2 - Enhanced MVP (Phase 4-5)**:
- **Scope**: Add US2 (Style Tokens) + US3 (Multi-node Types)
- **Deliverable**: Support code blocks, images, and visual styling
- **Tasks**: T048-T076 (29 tasks)
- **Estimated Time**: 2-3 days
- **Value**: Full markdown support, technical doc use cases enabled

**Milestone 3 - Full Feature (Phase 6-8)**:
- **Scope**: Add US4 (Split View) + US5 (Layout Switch) + Polish
- **Deliverable**: Complete feature with all user stories, production-ready
- **Tasks**: T077-T120 (44 tasks)
- **Estimated Time**: 2-3 days
- **Value**: All acceptance criteria met, 80% test coverage

---

## Testing Checklist

### Per User Story

**US1 (Bidirectional Sync)**:
- [ ] Parser unit tests: 5 tests (T029-T033)
- [ ] Serializer unit tests: 3 tests (T039-T041)
- [ ] Integration test: Round-trip sync (T117)

**US2 (Style Tokens)**:
- [ ] Helper unit tests: 3 tests (T048-T050)
- [ ] Integration tests: 2 tests (T051-T052)

**US3 (Multi-node Types)**:
- [ ] Parser unit tests: 5 tests (T060-T064)
- [ ] Serializer unit tests: 2 tests (T065-T066)

**US4 (Split View)**:
- [ ] Unit tests: 2 tests (T077-T078)

**US5 (Layout Switch)**:
- [ ] Layout engine unit tests: 4 tests (T088-T091)

**US8 (Polish)**:
- [ ] Integration tests: 2 tests (T117-T118)
- [ ] Coverage verification: T119
- [ ] Lint verification: T120

**Total Tests**: 28 unit tests + 5 integration tests = 33 tests

---

## File Path Reference

### New Files Created

**Repository Layer**:
- `knotly-frontend/src/repository/markdownParser.ts`
- `knotly-frontend/src/repository/markdownSerializer.ts`
- `knotly-frontend/src/repository/layoutEngine.ts`
- `knotly-frontend/src/repository/helpers.ts`
- `knotly-frontend/src/repository/factories.ts`

**Components**:
- `knotly-frontend/src/components/MarkdownEditor.tsx`
- `knotly-frontend/src/components/SplitLayout.tsx`
- `knotly-frontend/src/components/LayoutSelector.tsx`
- `knotly-frontend/src/components/HeaderNode.tsx`
- `knotly-frontend/src/components/CodeNode.tsx`
- `knotly-frontend/src/components/ImageNode.tsx`

**Tests**:
- `knotly-frontend/tests/unit/markdownParser.test.ts`
- `knotly-frontend/tests/unit/markdownSerializer.test.ts`
- `knotly-frontend/tests/unit/layoutEngine.test.ts`
- `knotly-frontend/tests/unit/helpers.test.ts`
- `knotly-frontend/tests/unit/splitRatio.test.ts`
- `knotly-frontend/tests/integration/MarkdownEditor.test.tsx`

### Modified Files

- `knotly-frontend/package.json` (dependencies)
- `knotly-frontend/src/types/canvas.ts` (extended Node types)
- `knotly-frontend/src/store/canvasStore.ts` (layout field + actions)
- `knotly-frontend/src/components/NodeComponent.tsx` (type-based rendering)
- `knotly-frontend/src/components/TextNode.tsx` (extracted from NodeComponent)
- `knotly-frontend/src/utils/fileIO.ts` (remove YAML, use .md)
- `knotly-frontend/src/App.tsx` (wrap in SplitLayout)

---

## Success Metrics

### Code Quality
- ✅ Zero TypeScript errors (strict mode)
- ✅ Zero ESLint warnings
- ✅ 80% test coverage (unit + integration)
- ✅ All tests passing (vitest)

### Performance
- ✅ 60fps rendering with 100 nodes (Chrome DevTools)
- ✅ <300ms editor → canvas parsing
- ✅ <100ms canvas → editor updates
- ✅ <1s layout switching for 100 nodes

### Acceptance Criteria
- ✅ US1: 5/5 acceptance scenarios passing
- ✅ US2: 4/4 acceptance scenarios passing
- ✅ US3: 5/5 acceptance scenarios passing
- ✅ US4: 4/4 acceptance scenarios passing
- ✅ US5: 5/5 acceptance scenarios passing

### Markdown Compatibility
- ✅ Output files parse correctly in Git
- ✅ Output files load correctly in Obsidian
- ✅ Output files load correctly in Notion
- ✅ Pure markdown (no proprietary format)

---

## Notes for Implementation

1. **Constitution Compliance**: All factory functions MUST return Result types, no exceptions thrown
2. **Dirty Flag Pattern**: Use useRef + useLayoutEffect per research.md to prevent circular updates
3. **Cursor Preservation**: Use setSelectionRange in useLayoutEffect per research.md
4. **Bundle Size**: marked.js (12KB) + react-split (2KB) = 14KB total new dependencies
5. **Error Handling**: Always check Result.ok before accessing value, display errors to user
6. **Testing**: Follow Given-When-Then structure, 80% coverage minimum per constitution
7. **Performance**: Measure with Chrome DevTools, log warnings for 500+ nodes
8. **Accessibility**: Add ARIA labels, keyboard navigation (Tab, Arrow keys) per WCAG 2.1 AA

---

**Generated**: 2025-10-20
**Ready for**: `/speckit.implement` or manual execution starting with Phase 1 (Setup)
**MVP Scope**: Phases 1-3 (User Story 1) = 47 tasks = 2-3 days
**Full Feature**: Phases 1-8 (All User Stories) = 120 tasks = 6-9 days
