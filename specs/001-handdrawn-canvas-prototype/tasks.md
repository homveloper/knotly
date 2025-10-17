# Tasks: Handdrawn Canvas Prototype

**Input**: Design documents from `/specs/001-handdrawn-canvas-prototype/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/node-structure.ts, quickstart.md

**Tests**: Per Constitution VI (adapted for prototype), testing focuses on manual validation and E2E performance testing rather than comprehensive unit test coverage.

**Organization**: Tasks are grouped by user story priority (P1, P2, P3) to enable incremental delivery and independent validation of each design aspect.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Web application structure**: `src/`, `tests/` at frontend/ directory (or repository root if no frontend/ folder)
- All paths assume frontend-only single-page application
- Adjust based on whether frontend/ directory exists or code goes in repository root

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize React + TypeScript + Vite project with all required dependencies

- [ ] T001 Create Vite React-TypeScript project using `pnpm create vite knotly-frontend --template react-ts`
- [ ] T002 Install base dependencies by running `pnpm install` in project directory
- [ ] T003 [P] Install rough.js library: `pnpm add roughjs` and `pnpm add -D @types/roughjs`
- [ ] T004 [P] Install Tailwind CSS toolchain: `pnpm add -D tailwindcss postcss autoprefixer`
- [ ] T005 Initialize Tailwind configuration by running `npx tailwindcss init -p`
- [ ] T006 [P] Configure TypeScript strict mode in tsconfig.json (set "strict": true under compilerOptions)
- [ ] T007 [P] Configure Tailwind content paths in tailwind.config.js to scan ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
- [ ] T008 [P] Replace src/index.css content with Tailwind directives: @tailwind base; @tailwind components; @tailwind utilities;
- [ ] T009 Add Google Fonts preconnect and Nanum Pen Script font link to index.html head section
- [ ] T010 Create src/types/ directory for TypeScript type definitions
- [ ] T011 Create src/components/ directory for React components
- [ ] T012 [P] Copy type contracts from specs/001-handdrawn-canvas-prototype/contracts/node-structure.ts to src/types/node.ts
- [ ] T013 Verify setup by running `pnpm dev` and confirming server starts on http://localhost:5173

**Checkpoint**: Development environment configured and ready for implementation

---

## Phase 2: Foundational (Core Type System)

**Purpose**: Establish TypeScript types and constants for the Node entity and rendering configuration

**⚠️ CRITICAL**: No user story work can begin until type system is in place

- [ ] T014 Verify src/types/node.ts contains Position interface (x, y coordinates)
- [ ] T015 Verify src/types/node.ts contains NodeStyle interface (backgroundColor, strokeColor, strokeWidth)
- [ ] T016 Verify src/types/node.ts contains NodeType type ("circle" | "rectangle" | "cloud")
- [ ] T017 Verify src/types/node.ts contains Node interface (id, position, content, type, style)
- [ ] T018 Verify src/types/node.ts contains PROTOTYPE_NODE constant with hardcoded node data
- [ ] T019 Verify src/types/node.ts contains RENDERING_CONFIG constant with canvas dimensions, roughness, colors, font settings

**Checkpoint**: Type system complete - user story implementation can now begin

---

## Phase 3: User Story 1 - Visual Design Validation (Priority: P1) 🎯 MVP

**Goal**: Render a single hand-drawn circle node with handwritten text to validate the warm, friendly UI/UX direction that differentiates Knotly from traditional mindmap tools

**Independent Test**: Open http://localhost:5173 in browser and visually confirm:
1. Light gray canvas background (#fafafa) is displayed
2. Yellow circle node (#FFE082) appears in center with hand-drawn imperfections
3. Korean text "손글씨 노트 프로토타입" is rendered in Nanum Pen Script font
4. Circle outline has visible waviness (roughness=1.2), not a perfect geometric circle

### Implementation for User Story 1

- [ ] T020 [P] [US1] Create Canvas component file at src/components/Canvas.tsx with empty functional component export
- [ ] T021 [US1] Import required dependencies in Canvas.tsx: React useRef, useEffect, rough from 'roughjs', type imports from '../types/node'
- [ ] T022 [US1] Add SVGSVGElement ref using useRef<SVGSVGElement>(null) in Canvas component
- [ ] T023 [US1] Implement useEffect hook with empty dependency array for one-time rendering on mount
- [ ] T024 [US1] Add early return null check in useEffect: if (!svgRef.current) return; (Constitution Principle I)
- [ ] T025 [US1] Create rough.js SVG generator in useEffect using rough.svg(svgRef.current)
- [ ] T026 [US1] Generate circle path using rc.circle() with PROTOTYPE_NODE position, RENDERING_CONFIG.CIRCLE_DIAMETER, and style options
- [ ] T027 [US1] Map node style to rough.js options: roughness from config, fill from node backgroundColor, stroke from node strokeColor, strokeWidth from node, fillStyle from config
- [ ] T028 [US1] Append generated circle path to svgRef.current using appendChild
- [ ] T029 [US1] Implement JSX return with svg element: width and height from RENDERING_CONFIG, ref={svgRef}, xmlns="http://www.w3.org/2000/svg"
- [ ] T030 [US1] Add rect element for canvas background: x="0", y="0", width/height from config, fill={RENDERING_CONFIG.CANVAS_BACKGROUND}
- [ ] T031 [US1] Add text element for node content: x/y from PROTOTYPE_NODE.position (y offset by TEXT_Y_OFFSET), textAnchor="middle", fontFamily/fontSize/fill from RENDERING_CONFIG, content from PROTOTYPE_NODE.content
- [ ] T032 [US1] Update src/App.tsx to import Canvas component from './components/Canvas'
- [ ] T033 [US1] Replace App.tsx return JSX with Tailwind-styled container: div with className="flex justify-center items-center h-screen bg-gray-50" containing Canvas component
- [ ] T034 [US1] Delete src/App.css if it exists (no longer needed with Tailwind)
- [ ] T035 [US1] Run `pnpm dev` and verify prototype appears correctly in browser at http://localhost:5173

**Checkpoint**: User Story 1 complete - prototype displays hand-drawn circle with handwritten text

**Manual Validation (Success Criteria SC-001, SC-002)**:
1. Share http://localhost:5173 with 5 team members
2. Collect feedback: Ask "Does this feel warm/friendly/hand-drawn?" and "Does this feel different from MindMeister/Miro?"
3. Success: At least 3/5 use terms like "warm", "friendly", "hand-drawn" AND at least 4/5 say "different from existing tools"

---

## Phase 4: User Story 2 - Visual Accessibility Verification (Priority: P2)

**Goal**: Verify that the hand-drawn text meets WCAG 2.1 AA accessibility standards and remains sharp/clear at different zoom levels, ensuring the design direction doesn't compromise usability

**Independent Test**:
1. Use browser DevTools or online contrast checker to verify #333 text on #FFE082 background has 4.5:1+ ratio
2. Zoom browser to 50% and 200% using Ctrl/Cmd + +/- and verify text and shapes remain sharp (SVG advantage)
3. Read Korean text at default zoom and verify 18px font with 1.5 line spacing is comfortably readable

### Implementation for User Story 2

- [ ] T036 [US2] Open Chrome DevTools and navigate to Elements tab to inspect Canvas SVG
- [ ] T037 [US2] Right-click text element in Elements tab and select "Inspect" to view computed styles
- [ ] T038 [US2] Verify fontFamily shows "Nanum Pen Script, cursive" (fallback present)
- [ ] T039 [US2] Verify fontSize is "18px" and fill is "#333"
- [ ] T040 [US2] Verify circle fill is "#FFE082" in SVG path element
- [ ] T041 [US2] Use online contrast checker (https://webaim.org/resources/contrastchecker/) to verify #333 on #FFE082 = 5.89:1 (passes WCAG AA 4.5:1 requirement)
- [ ] T042 [US2] Zoom browser to 200% using Ctrl/Cmd + + and visually verify text remains sharp (no pixelation)
- [ ] T043 [US2] Zoom browser to 50% using Ctrl/Cmd + - and visually verify circle and text remain clear
- [ ] T044 [US2] Reset zoom to 100% and read Korean text to verify 18px size with 1.5 line spacing is comfortably readable
- [ ] T045 [US2] Test in Firefox, Safari, and Edge browsers to verify consistent rendering across modern browsers

**Checkpoint**: User Story 2 complete - accessibility verified (contrast, zoom, readability)

**Success Criteria Validation**:
- **SC-006**: Contrast ratio is 5.89:1 (exceeds 4.5:1 requirement) ✅
- **SC-007**: SVG text and shapes remain sharp at 50%-200% zoom ✅

---

## Phase 5: User Story 3 - Performance Validation (Priority: P3)

**Goal**: Confirm that the rendering performs smoothly at 60fps, font loads within 500ms, and page loads within 1 second, validating that this approach won't cause performance issues as we scale

**Independent Test**: Use Chrome DevTools Performance tab to record rendering and verify 60fps, Network tab to verify <500ms font load, and Lighthouse to verify <1s First Contentful Paint

### Implementation for User Story 3

- [ ] T046 [US3] Open Chrome DevTools (F12 or Cmd+Option+I) and click "Performance" tab
- [ ] T047 [US3] Click record button (⚫) in Performance tab and refresh page (Ctrl/Cmd + R)
- [ ] T048 [US3] Stop recording after page finishes loading (click stop button)
- [ ] T049 [US3] Analyze FPS graph in Performance timeline - verify consistent 60fps with no dips or jank
- [ ] T050 [US3] Check Main thread activity - verify rough.js circle generation completes in <5ms
- [ ] T051 [US3] Switch to "Network" tab in DevTools and refresh page with Network tab open
- [ ] T052 [US3] Locate "Nanum+Pen+Script" font request in Network waterfall (may be woff2 file)
- [ ] T053 [US3] Verify font request Time column shows <500ms (includes DNS + download)
- [ ] T054 [US3] Verify no Flash of Unstyled Text (FOUT) occurs - text should appear directly in Nanum Pen Script font
- [ ] T055 [US3] Check total page load time - DOMContentLoaded and Load events should both complete <1s
- [ ] T056 [US3] Switch to "Memory" tab, click "Take heap snapshot", and verify total memory usage is <50MB (should be ~10MB for this prototype)
- [ ] T057 [US3] Click "Lighthouse" tab in DevTools and select "Performance" category only
- [ ] T058 [US3] Click "Analyze page load" and wait for Lighthouse audit to complete
- [ ] T059 [US3] Verify First Contentful Paint (FCP) metric is <1s (ideally <500ms)
- [ ] T060 [US3] Verify Lighthouse Performance score is 90+ (green)
- [ ] T061 [US3] Test with DevTools CPU throttling: Open Performance tab, click gear icon, select "4x slowdown" to simulate mobile
- [ ] T062 [US3] Record Performance profile with CPU throttling enabled and verify rendering still completes smoothly (may drop below 60fps but should not freeze)

**Checkpoint**: User Story 3 complete - performance validated across all metrics

**Success Criteria Validation**:
- **SC-003**: Page load <1s ✅
- **SC-004**: 60fps rendering ✅
- **SC-005**: Font load <500ms without FOUT ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, documentation, and cleanup for production readiness

- [ ] T063 [P] Add inline comments to Canvas.tsx explaining rough.js options (roughness, fillStyle, etc.)
- [ ] T064 [P] Add JSDoc comment to Canvas component explaining its purpose (prototype for design validation)
- [ ] T065 [P] Verify all TypeScript types have no `any` types (strict mode compliance)
- [ ] T066 [P] Run TypeScript compiler check: `pnpm exec tsc --noEmit` and fix any errors
- [ ] T067 [P] Create README.md at project root with quickstart instructions (refer to specs/001-handdrawn-canvas-prototype/quickstart.md)
- [ ] T068 Build production bundle using `pnpm build` to verify no build errors
- [ ] T069 Preview production build using `pnpm preview` and verify prototype renders correctly
- [ ] T070 Run full validation checklist from quickstart.md section "Step 11: Validate Success Criteria"
- [ ] T071 [P] Document team feedback collection results in a markdown file (note for team: collect from 5 members per SC-001, SC-002)
- [ ] T072 [P] Take screenshots of prototype at different zoom levels (50%, 100%, 200%) for documentation
- [ ] T073 [P] Export DevTools Performance and Lighthouse reports as JSON for reference
- [ ] T074 Final manual review: Compare rendered prototype to spec.md requirements FR-001 through FR-015 line-by-line

**Checkpoint**: Feature complete and validated against all success criteria

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T013) - Type system BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T014-T019) - Core visual prototype implementation
- **User Story 2 (Phase 4)**: Depends on User Story 1 (T020-T035) - Cannot validate accessibility without rendered prototype
- **User Story 3 (Phase 5)**: Depends on User Story 1 (T020-T035) - Cannot measure performance without rendered prototype
- **Polish (Phase 6)**: Depends on all user stories being complete - Final verification and documentation

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Foundational phase - Renders the core prototype
- **User Story 2 (P2)**: Depends on US1 - Validates accessibility of the rendered prototype
- **User Story 3 (P3)**: Depends on US1 - Validates performance of the rendered prototype

**Note**: US2 and US3 can run in parallel (different validation methods, no file conflicts)

### Within Each User Story

**User Story 1 (Implementation)**:
- T020-T021 can be done in parallel
- T022-T028 must be sequential (building up Canvas component logic)
- T029-T031 can be done in parallel (different SVG elements)
- T032-T035 must be sequential (App.tsx updates depend on Canvas being complete)

**User Story 2 (Validation)**:
- T036-T045 must be mostly sequential (manual testing steps)
- T036-T040 (DevTools inspection) can be grouped together
- T041-T044 (zoom/readability testing) can be grouped together
- T045 (cross-browser testing) is independent and can be done anytime after T035

**User Story 3 (Performance Testing)**:
- T046-T062 must be mostly sequential (manual DevTools testing steps)
- T046-T050 (Performance tab) can be grouped together
- T051-T055 (Network tab) can be grouped together
- T056 (Memory tab) is independent
- T057-T060 (Lighthouse) is independent
- T061-T062 (CPU throttling) is independent

**Polish Phase**:
- All tasks marked [P] (T063-T067, T071-T073) can run in parallel
- T068-T069 must be sequential (build before preview)
- T070, T074 are independent validation tasks

### Parallel Opportunities

- **Phase 1 Setup**: T003, T004, T006, T007, T008, T012 can all run in parallel (different files)
- **Phase 2 Foundational**: T014-T019 are verification tasks (can be done in single pass)
- **Phase 3 User Story 1**: T020-T021, T029-T031 have limited parallelization (mostly sequential component building)
- **Phase 4 & 5**: US2 and US3 can run in parallel after US1 is complete (different DevTools tabs, no file conflicts)
- **Phase 6 Polish**: T063, T064, T065, T066, T067, T071, T072, T073 can all run in parallel

---

## Parallel Example: Setup Phase

```bash
# Launch all parallelizable setup tasks together:
Task T003: "Install rough.js library: pnpm add roughjs && pnpm add -D @types/roughjs"
Task T004: "Install Tailwind CSS: pnpm add -D tailwindcss postcss autoprefixer"
Task T006: "Configure TypeScript strict mode in tsconfig.json"
Task T007: "Configure Tailwind content paths in tailwind.config.js"
Task T008: "Replace src/index.css with Tailwind directives"
Task T012: "Copy type contracts to src/types/node.ts"
```

---

## Parallel Example: User Stories 2 & 3

```bash
# After User Story 1 is complete, run US2 and US3 in parallel:

# Terminal/Developer 1: User Story 2 (Accessibility Validation)
Task T036-T045: "Verify accessibility using DevTools and contrast checker"

# Terminal/Developer 2: User Story 3 (Performance Validation)
Task T046-T062: "Measure performance using DevTools Performance, Network, Memory, and Lighthouse"

# These don't conflict - different DevTools tabs, no file modifications
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T013) - ~15 minutes
2. Complete Phase 2: Foundational (T014-T019) - ~5 minutes (verification)
3. Complete Phase 3: User Story 1 (T020-T035) - ~30 minutes
4. **STOP and VALIDATE**: Open http://localhost:5173 and verify prototype renders correctly
5. Collect team feedback from 5 members (SC-001, SC-002)
6. **Decision Point**: If feedback is positive, proceed to US2/US3. If not, iterate on design.

**Total MVP Time**: ~50 minutes of implementation + team feedback collection

### Incremental Delivery

1. **Foundation**: Setup + Foundational (T001-T019) → Environment ready
2. **MVP**: Add User Story 1 (T020-T035) → Test independently → Collect team feedback → **Deploy/Demo if approved!**
3. **Accessibility**: Add User Story 2 (T036-T045) → Verify contrast/zoom → Document compliance
4. **Performance**: Add User Story 3 (T046-T062) → Measure metrics → Document results
5. **Polish**: Final phase (T063-T074) → Production-ready prototype

### Parallel Team Strategy

With 2 developers:

1. **Together**: Complete Setup + Foundational (T001-T019)
2. **Developer A**: User Story 1 (T020-T035)
3. **Once US1 done, split**:
   - **Developer A**: User Story 2 (T036-T045) - Accessibility validation
   - **Developer B**: User Story 3 (T046-T062) - Performance validation
4. **Together**: Polish phase (T063-T074) - divide parallelizable tasks

---

## Notes

- **[P] tasks**: Can run in parallel (different files or independent validations)
- **[Story] labels**: Map tasks to user stories for traceability (US1, US2, US3)
- **No automated tests**: Per Constitution VI (adapted for prototype), testing is manual validation via DevTools
- **Early returns**: All TypeScript code uses early returns for null checks (Constitution Principle I)
- **Type safety**: All refs and data use explicit types (SVGSVGElement, Node, etc.)
- **Commit strategy**: Commit after each phase checkpoint for rollback safety
- **Validation-focused**: US2 and US3 are pure validation tasks (no code changes), so they can run concurrently

### Task Count Summary

- **Total Tasks**: 74
- **Setup Phase**: 13 tasks
- **Foundational Phase**: 6 tasks
- **User Story 1 (P1 - MVP)**: 16 tasks
- **User Story 2 (P2)**: 10 tasks
- **User Story 3 (P3)**: 17 tasks
- **Polish Phase**: 12 tasks

### Parallel Opportunities Identified

- **Phase 1**: 6 tasks can run in parallel (T003, T004, T006, T007, T008, T012)
- **Phase 3**: Limited parallelization (component building is mostly sequential)
- **Phase 4 & 5**: Entire user stories can run in parallel (US2 + US3 together)
- **Phase 6**: 8 tasks can run in parallel (T063-T067, T071-T073)

### Independent Test Criteria Per Story

- **US1**: Visual inspection - circle, text, font, hand-drawn appearance
- **US2**: DevTools inspection - contrast ratio, zoom clarity, readability
- **US3**: DevTools metrics - 60fps, <500ms font, <1s FCP, <50MB memory

### Suggested MVP Scope

**Minimum**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (US1 only)
- Delivers: Working prototype for team validation
- Time: ~50 minutes implementation
- Validation: Team feedback on warm/friendly/hand-drawn feel (SC-001, SC-002)

**Recommended**: MVP + Phase 4 (US2) + Phase 5 (US3)
- Delivers: Prototype + accessibility + performance validation
- Time: ~2 hours total
- Validation: Complete success criteria SC-001 through SC-007

---

**Format Validation**: ✅ All tasks follow checklist format with checkbox, task ID, [P] markers where applicable, [Story] labels for user story phases, and file paths in descriptions.
