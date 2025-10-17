# Implementation Plan: Interactive Graph Editor with Touch Gestures

**Branch**: `002-node-crud-gestures` | **Date**: 2025-10-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-node-crud-gestures/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement an interactive graph editor enabling users to create, edit, move, and delete nodes on a mobile-first canvas with touch gesture support. Users can connect nodes with hand-drawn dashed lines, customize node colors, use @mentions for quick linking, and navigate large canvases with pinch-to-zoom and pan gestures. The system uses React 18 + TypeScript with Zustand for state management, @use-gesture/react for touch gestures, and rough.js for hand-drawn aesthetics (carried over from Milestone 1).

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled, React 18
**Primary Dependencies**: Zustand (state management), @use-gesture/react (touch gestures), rough.js ^4.6.6 (hand-drawn rendering), uuid (unique IDs), Tailwind CSS 3.x (styling)
**Storage**: Client-side memory only (Zustand store without persistence middleware) - data lost on page refresh
**Testing**: Not specified in this phase (Milestone 1 established Vite test runner)
**Target Platform**: Modern mobile browsers (Chrome 90+, Safari 14+, Firefox 88+), mobile-first design
**Project Type**: Single web frontend (Vite + React SPA)
**Performance Goals**: 60fps rendering, <100ms response times, <50ms gesture recognition, support 50 nodes minimum
**Constraints**: Client-side only (no backend), mobile keyboard occlusion acceptable, 60fps with 50+ nodes requires optimization
**Scale/Scope**: Prototype phase supporting up to 50 nodes with interactive gestures, 7 user stories (P1-P3), 28 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Error Handling (Error as Value)
**Status**: ⚠️ REVIEW REQUIRED
**Assessment**: Zustand store actions (createNode, updateNode, deleteNode, createEdge) do not currently return Result types. State mutations happen directly via `set()` with no error handling for invalid operations (e.g., creating edge to non-existent node).
**Recommendation**: Add validation in store actions and return `{success: boolean, error?: string}` for operations that can fail. For example, `createEdge` should validate that both fromId and toId exist before creating the edge.

### II. Object Composition (Composition over Inheritance)
**Status**: ✅ COMPLIANT
**Assessment**: React functional components use composition naturally. Node, Edge, Canvas, ContextMenu, MentionSheet, GridBackground, FABButton are all composed together without inheritance hierarchies.

### III. Dependency Injection (Explicit Dependencies)
**Status**: ✅ COMPLIANT
**Assessment**: All components receive dependencies via props or hooks. Zustand store is accessed via `useCanvasStore()` hook, making dependencies explicit. Components like EdgeComponent receive `edge` prop and access `nodes` from store to calculate positions.

### IV. Object Creation (Factory Functions)
**Status**: ⚠️ REVIEW REQUIRED
**Assessment**: Node and Edge creation happens inside Zustand actions using object literals with uuid. Consider extracting factory functions `Node.create()` and `Edge.create()` that validate inputs and return Result types. For example:
```typescript
const NodeFactory = {
  create: (position: {x: number; y: number}, content?: string) => {
    if (position.x < 0 || position.y < 0) {
      return {success: false, error: 'Position coordinates must be non-negative'};
    }
    return {
      success: true,
      value: {
        id: v4(),
        position,
        content: content || '',
        type: 'circle' as const,
        style: {backgroundColor: '#FFE082', strokeColor: '#000', strokeWidth: 2},
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };
  }
};
```

### V. Code Quality Standards
**Status**: ✅ COMPLIANT
**Assessment**: TypeScript strict mode enabled. DDD not applicable for prototype phase (domain logic is minimal). Immutability enforced via Zustand's immutable update patterns. Component responsibilities are focused (FABButton creates nodes, ContextMenu handles customization, etc.).

### VI. Testing Standards
**Status**: ⚠️ DEFERRED
**Assessment**: Testing not specified for this milestone. User stories provide Given-When-Then acceptance criteria that can be converted to E2E tests in future phases. Recommend adding unit tests for store actions and gesture intent detection logic when moving to production.

### VII. User Experience Consistency
**Status**: ⚠️ PARTIAL COMPLIANCE
**Assessment**: Mobile-first design ✅. Touch-optimized (120px nodes, 44px touch targets) ✅. 60fps target ✅. WCAG 2.1 AA compliance ⚠️ deferred to Milestone 4 per spec assumptions. Keyboard navigation ⚠️ not specified (mobile-first focus). Visual feedback within 100ms ✅ specified in success criteria.

### VIII. Performance Requirements
**Status**: ✅ COMPLIANT
**Assessment**: Spec defines 60fps for drag operations (SC-003), <100ms response times (SC-002, SC-009), <50ms gesture recognition (SC-004). Grid uses `useMemo` for performance. rough.js seed option prevents re-render performance degradation. Target supports 50 nodes (SC-010).

### Constitution Violations Requiring Justification

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| No Error as Value in Zustand actions | Prototype phase prioritizing velocity over robustness | Adding Result types for all store actions would slow MVP delivery; acceptable risk given client-side only scope with no data persistence |
| No Factory Functions for Node/Edge | Inline object creation simpler for prototype | Factory functions add abstraction overhead for simple data structures; validation needs are minimal in this phase |
| Testing deferred | Focus on interactive prototype validation | Manual testing via user stories sufficient for prototype; automated tests add development time without commensurate value at this stage |

### Post-Phase 1 Re-Check (After Design Artifacts Created)

**Re-Evaluation Date**: 2025-10-17
**Artifacts Reviewed**: data-model.md, contracts/canvas-store-api.md, research.md, quickstart.md

#### I. Error Handling (Error as Value)
**Status**: ⚠️ REMAINS NON-COMPLIANT (Justified)
**Post-Design Assessment**: Canvas Store API contract (contracts/canvas-store-api.md) confirms that store actions return `void` rather than Result types. Operations like `createEdge(fromId, toId)` do not validate node existence and silently ignore errors. This was documented in the API contract with a "Future Approach" section recommending Result types for production.
**Conclusion**: Violation justified for prototype phase. Documented path to compliance in API contract.

#### II. Object Composition (Composition over Inheritance)
**Status**: ✅ COMPLIANT (Verified)
**Post-Design Assessment**: Data model (data-model.md) uses simple interface definitions with no class hierarchies. All entities (Node, Edge, CanvasState) are pure data structures. Component architecture (quickstart.md) uses React functional components that compose via props and hooks. No inheritance patterns detected.
**Conclusion**: Fully compliant. Composition pattern successfully applied throughout design.

#### III. Dependency Injection (Explicit Dependencies)
**Status**: ✅ COMPLIANT (Verified)
**Post-Design Assessment**: Component examples in quickstart.md show explicit dependency injection via Zustand hooks (`useCanvasStore()`) and props. EdgeComponent receives `edge` prop and explicitly fetches `nodes` from store. No hidden dependencies or global singletons (except Zustand store itself, which is the intentional state container).
**Conclusion**: Fully compliant. All dependencies are visible in function signatures.

#### IV. Object Creation (Factory Functions)
**Status**: ⚠️ REMAINS NON-COMPLIANT (Justified)
**Post-Design Assessment**: Data model (data-model.md) documents entity creation via inline object literals in Zustand `set()` functions. Example: `{id: uuidv4(), position, content: '', ...}`. No factory functions defined. However, the Complexity Tracking section acknowledges this and provides justification. Validation rules are documented in data-model.md but not enforced via factories.
**Conclusion**: Violation justified for prototype phase. Can be refactored to factories when adding production validation.

#### V. Code Quality Standards
**Status**: ✅ COMPLIANT (Verified)
**Post-Design Assessment**: TypeScript strict mode confirmed in Technical Context. Research.md documents immutability patterns (spread operators, Zustand immutable updates). Quickstart.md shows focused component responsibilities (SRP). Code examples follow clean code practices with meaningful names and TypeScript types.
**Conclusion**: Fully compliant. High quality standards maintained in design artifacts.

#### VI. Testing Standards
**Status**: ⚠️ DEFERRED (Documented)
**Post-Design Assessment**: No test artifacts created in Phase 1. Quickstart.md includes "Manual Test Checklist" based on user stories but no automated tests. Research.md does not address testing strategies. This aligns with prototype scope documented in Complexity Tracking.
**Conclusion**: Deferral justified and documented. Manual testing via user stories is the planned approach.

#### VII. User Experience Consistency
**Status**: ⚠️ PARTIAL COMPLIANCE (Verified)
**Post-Design Assessment**: Research.md confirms mobile-first design with 120px nodes (>44px touch target). Performance targets documented (60fps, <100ms response). Quickstart.md shows testing checklist for gestures and navigation. WCAG compliance explicitly deferred per spec Assumption #12. Keyboard navigation not addressed (mobile-first focus).
**Conclusion**: Partial compliance justified. Mobile UX prioritized, accessibility deferred to Milestone 4 as planned.

#### VIII. Performance Requirements
**Status**: ✅ COMPLIANT (Verified)
**Post-Design Assessment**: Research.md Section 4 documents grid performance optimization via `useMemo` (200 lines). Section 3 documents rough.js seed optimization to prevent re-render flickering. Canvas Store API uses selector-based subscriptions to minimize re-renders. Performance targets explicitly stated: 60fps, <100ms response, <50ms gesture recognition, 50 nodes minimum.
**Conclusion**: Fully compliant. Performance optimization strategies documented and designed into architecture.

### Final Constitution Compliance Summary

| Principle | Status | Justification |
|-----------|--------|---------------|
| I. Error as Value | ⚠️ Non-Compliant | Prototype phase, documented migration path in API contract |
| II. Object Composition | ✅ Compliant | Pure composition, no inheritance detected |
| III. Dependency Injection | ✅ Compliant | Explicit dependencies via hooks and props |
| IV. Object Creation | ⚠️ Non-Compliant | Prototype phase, inline literals justified for simple entities |
| V. Code Quality | ✅ Compliant | TypeScript strict, immutability, SRP, clean code |
| VI. Testing Standards | ⚠️ Deferred | Manual testing via user stories, documented in Complexity Tracking |
| VII. UX Consistency | ⚠️ Partial | Mobile-first compliant, accessibility deferred to M4 |
| VIII. Performance | ✅ Compliant | Optimizations documented and designed (useMemo, seed, selectors) |

**Overall Assessment**: 3 fully compliant, 3 justified non-compliant, 2 partial/deferred. All violations documented in Complexity Tracking with rationale. Design artifacts (data-model.md, contracts/, research.md, quickstart.md) align with constitution where feasible for prototype scope.

## Project Structure

### Documentation (this feature)

```
specs/002-node-crud-gestures/
├── plan.md              # This file (/speckit.plan command output) ✅ CREATED
├── spec.md              # Feature specification ✅ CREATED
├── checklists/
│   └── requirements.md  # Quality validation checklist ✅ CREATED
├── research.md          # Phase 0 output (/speckit.plan command) ✅ CREATED
├── data-model.md        # Phase 1 output (/speckit.plan command) ✅ CREATED
├── quickstart.md        # Phase 1 output (/speckit.plan command) ✅ CREATED
├── contracts/
│   └── canvas-store-api.md  # Store API contract ✅ CREATED
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT YET CREATED)
```

### Source Code (repository root)

```
knotly-frontend/          # Vite + React SPA (established in Milestone 1)
├── src/
│   ├── components/
│   │   ├── Canvas.tsx              # REFACTOR: Map over nodes array from store
│   │   ├── NodeComponent.tsx       # NEW: Individual node with rough.js rendering
│   │   ├── EdgeComponent.tsx       # NEW: Connection lines with rough.js
│   │   ├── FABButton.tsx           # NEW: Floating action button for node creation
│   │   ├── ContextMenu.tsx         # NEW: Bottom sheet for color/delete options
│   │   ├── MentionSheet.tsx        # NEW: Bottom sheet for @mention node selection
│   │   └── GridBackground.tsx      # NEW: SVG grid with 20px spacing
│   ├── store/
│   │   └── canvasStore.ts          # NEW: Zustand store for nodes, edges, zoom, pan, grid
│   ├── types/
│   │   └── canvas.ts               # NEW: TypeScript types for Node, Edge, CanvasStore
│   ├── App.tsx                      # UPDATE: Add FABButton, render Canvas
│   ├── main.tsx                     # No changes (established in Milestone 1)
│   └── index.css                    # UPDATE: Tailwind directives (already configured)
├── public/
├── package.json                     # UPDATE: Add zustand, @use-gesture/react, uuid
├── tsconfig.json                    # No changes (strict mode already enabled)
├── vite.config.ts                   # No changes (Tailwind configured in Milestone 1)
└── tailwind.config.js               # No changes (established in Milestone 1)

tests/                               # Future: Not created in this phase
```

**Structure Decision**: Single web application using Vite + React established in Milestone 1. All components live in `knotly-frontend/src/components/`. Zustand store centralizes state in `src/store/canvasStore.ts`. This structure maintains continuity from Milestone 1 while adding state management layer for multi-node support.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| No Error as Value pattern in Zustand actions | Prototype phase prioritizing delivery speed and interactive validation over production-grade error handling | Result types for store actions would require refactoring all components to handle error states, adding significant complexity for a prototype where client-side data loss on error is acceptable |
| No Factory Functions for Node/Edge creation | Inline object literals in store actions keep code co-located and reduce indirection | Extracting factory functions creates additional files/abstractions for simple data structures with minimal validation needs; premature for prototype phase |
| Testing standards deferred | Manual testing via 7 user stories with Given-When-Then scenarios provides sufficient validation for prototype | Automated testing infrastructure (unit/integration/E2E) would require significant setup time and tooling configuration, delaying interactive prototype delivery without proportional benefit at this early stage |
| WCAG 2.1 AA compliance deferred to Milestone 4 | Mobile-first touch interaction is primary UX; screen reader support and keyboard navigation are valuable but non-blocking for prototype validation | Full accessibility compliance requires ARIA labels, keyboard shortcuts, focus management, and screen reader testing - substantial work that spec explicitly defers to Milestone 4 (Assumption #12) |
