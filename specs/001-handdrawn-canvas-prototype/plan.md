# Implementation Plan: Handdrawn Canvas Prototype

**Branch**: `001-handdrawn-canvas-prototype` | **Date**: 2025-10-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-handdrawn-canvas-prototype/spec.md`

## Summary

This feature implements a single hand-drawn circle node with handwritten text on an SVG canvas to validate Knotly's UI/UX direction. The prototype uses React 18 + TypeScript + Vite for the frontend foundation, rough.js (v4.6.6+) for hand-drawn rendering effects, Nanum Pen Script font from Google Fonts for handwritten text styling, and Tailwind CSS for utility-first styling. The implementation is deliberately minimal - a single Canvas component rendering a static SVG element with no user interaction, state management, or backend integration. This approach prioritizes rapid validation of the visual design direction while maintaining strict TypeScript type safety and 60fps rendering performance.

## Technical Context

**Language/Version**: TypeScript 5.x (with strict mode enabled) + JavaScript ES2020+
**Primary Dependencies**: React 18, Vite 5.x, rough.js ^4.6.6, Tailwind CSS 3.x
**Storage**: N/A (hardcoded data only, no persistence)
**Testing**: Vitest (unit tests), React Testing Library, Playwright (E2E validation)
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) with SVG and web font support
**Project Type**: Web application (single-page frontend, no backend)
**Performance Goals**: 60fps rendering, <500ms font load time, <1s First Contentful Paint, <50MB memory usage
**Constraints**: SVG-only rendering (no Canvas API), fixed viewport (800x600), roughness ≤1.2, no user interaction
**Scale/Scope**: Single static node (prototype/proof-of-concept), ~5 React components maximum, <100 lines of rendering logic

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Error Handling (Error as Value) - ✅ PASS

**Assessment**: This prototype has minimal error scenarios:
- SVG ref null check in useEffect (early return pattern)
- Font loading failure handled via CSS fallback (`fontFamily="'Nanum Pen Script', cursive"`)
- No complex business logic requiring Result types

**Compliance Strategy**:
- Use early returns for null/undefined checks
- No throw statements anywhere in the code
- Font loading uses native browser fallback mechanisms
- rough.js API errors (if any) handled with optional chaining

**Justification**: The prototype's simplicity means error-as-value pattern is satisfied through defensive null checks and CSS fallbacks rather than explicit Result types.

---

### II. Object Composition - ✅ PASS

**Assessment**: No inheritance or class hierarchies in this implementation.

**Compliance Strategy**:
- React functional components only (no class components)
- No object inheritance patterns
- Node data structure is a plain TypeScript interface/type
- rough.js library usage via composition (pass SVG ref, receive drawable)

**Justification**: Modern React with functional components naturally avoids inheritance. All objects are composed from simpler parts.

---

### III. Dependency Injection - ✅ PASS

**Assessment**: Minimal dependencies, all injected explicitly.

**Compliance Strategy**:
- rough.js imported and used via passed SVG ref (dependency injection at runtime)
- React hooks (useRef, useEffect) passed by React framework
- No hidden service creation or global state
- Google Fonts loaded via HTML link tag (external dependency, not created internally)

**Justification**: The prototype has no internal service creation. rough.js receives the SVG element as a dependency, and all rendering logic is self-contained within the component.

---

### IV. Object Creation (Factory Functions) - ✅ PASS

**Assessment**: No object instantiation requiring validation in this prototype.

**Compliance Strategy**:
- Node data is a literal object (no construction needed)
- rough.js uses factory pattern internally (rough.svg() returns a generator)
- React components use functional syntax (no constructors)
- No user input validation (static prototype)

**Justification**: The prototype uses literal objects and functional components. The only "created" object is the rough.js generator, which follows factory pattern (rough.svg(element)).

---

### V. Code Quality Standards - ✅ PASS

**Assessment**: Small codebase with high quality requirements.

**Compliance Strategy**:
- TypeScript strict mode enabled in tsconfig.json
- Explicit types for all function parameters and return values
- SVGSVGElement type for useRef
- Small, focused components (<50 lines each)
- Immutable data (no state mutations, static data only)
- Meaningful names (Canvas, renderHandDrawnNode, etc.)

**Justification**: TypeScript strict mode enforces type safety. The prototype's simplicity naturally satisfies single responsibility and pure function principles.

---

### VI. Testing Standards - ⚠️ ADAPTED FOR PROTOTYPE

**Assessment**: Full test coverage (80%+) may be excessive for a static UI validation prototype.

**Compliance Strategy**:
- Unit tests for Canvas component rendering (verify SVG output)
- Integration test for rough.js circle generation
- E2E test using Playwright to validate visual appearance and performance
- Manual validation by 5 team members (per success criteria)
- Performance testing via DevTools (60fps, font loading, memory)

**Justification**: This is a proof-of-concept for design validation, not production code. Testing focuses on success criteria (SC-001 through SC-007) rather than code coverage. Full test pyramid may be implemented if prototype graduates to production feature.

**Constitution Compliance Note**: Relaxed test coverage requirement justified by prototype nature. Will implement full 80%+ coverage if feature moves forward.

---

### VII. User Experience Consistency - ⚠️ ADAPTED FOR PROTOTYPE

**Assessment**: Full mobile/accessibility requirements deferred for desktop prototype.

**Compliance Strategy**:
- WCAG 2.1 AA color contrast verified (#333 on #FFE082 = 4.5:1+)
- 60fps rendering requirement enforced
- SVG scales cleanly on Retina displays
- Fixed viewport (800x600) for prototype phase
- Mobile-first and keyboard navigation deferred to production implementation

**Justification**: This prototype validates visual design direction on desktop. Mobile responsiveness and full accessibility will be implemented in subsequent milestones if design direction is approved.

**Constitution Compliance Note**: Mobile-first and keyboard navigation deferred until design validation complete. Contrast ratio and rendering performance fully compliant.

---

### VIII. Performance Requirements - ✅ PASS

**Assessment**: All performance requirements achievable for single-node prototype.

**Compliance Strategy**:
- 60fps rendering: Single static SVG element has minimal rendering cost
- API latency: N/A (no backend)
- Database: N/A (no persistence)
- Memory: <50MB easily achievable (rough.js + React + SVG < 10MB total)
- Lazy loading: Google Fonts loaded with display=swap and preconnect
- Performance monitoring: Manual DevTools validation per success criteria

**Justification**: Single static node rendering is trivial for modern browsers. Performance requirements are easily met and will be validated via Lighthouse (SC-003 through SC-005).

---

## Project Structure

### Documentation (this feature)

```
specs/001-handdrawn-canvas-prototype/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── node-structure.ts  # TypeScript interface for Node entity
├── checklists/
│   └── requirements.md  # Specification quality checklist (already created)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
# Web application structure (frontend only)
frontend/  # OR root if this is the entire project
├── src/
│   ├── components/
│   │   └── Canvas.tsx      # Main canvas component with rough.js integration
│   ├── types/
│   │   └── node.ts         # Node entity type definition
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Vite entry point
│   └── index.css           # Tailwind directives + global styles
├── public/
│   └── (static assets if needed)
├── tests/
│   ├── unit/
│   │   └── Canvas.test.tsx # Canvas component unit tests
│   ├── integration/
│   │   └── rough-rendering.test.tsx # rough.js integration tests
│   └── e2e/
│       └── visual-validation.spec.ts # Playwright E2E tests
├── index.html              # HTML entry point with Google Fonts preconnect
├── tsconfig.json           # TypeScript config (strict: true)
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration for Tailwind
├── vite.config.ts          # Vite build configuration
└── package.json            # Dependencies and scripts
```

**Structure Decision**: Web application structure selected. This prototype is frontend-only with no backend. If the project root is empty, create `frontend/` directory. If this is the entire project, place source directly in root with the structure above. The implementation will use Vite's default React-TS template as the foundation, then modify according to requirements.

## Complexity Tracking

*No Constitution violations requiring justification.*

All principles are satisfied or reasonably adapted for a prototype/proof-of-concept context. The two adapted principles (VI. Testing Standards, VII. User Experience Consistency) have clear justifications:
- Testing focuses on validation success criteria rather than arbitrary coverage metrics for a static prototype
- Mobile/accessibility features deferred until visual design direction is validated by team

These adaptations are appropriate for the feature's explicit scope as a design validation prototype.

## Phase 0: Research & Unknowns

**Status**: All technical decisions provided by user input.

The user has provided comprehensive technical specifications including:
- Technology stack (React 18, TypeScript, Vite, Tailwind, rough.js, Nanum Pen Script)
- Architecture approach (single Canvas component, SVG rendering, RoughSVG usage)
- Performance requirements (60fps, <500ms font load, <1s FCP)
- Implementation details (roughness=1.2, specific colors, font settings)

**Research tasks completed via user specification**:
- ✅ Rendering approach: SVG with rough.js RoughSVG API
- ✅ Font loading strategy: Google Fonts with preconnect + display=swap
- ✅ Styling approach: Tailwind CSS utility-first
- ✅ Type safety: TypeScript strict mode
- ✅ Performance validation: DevTools + Lighthouse

**Remaining research**: Best practices documentation will be generated in research.md

## Phase 1: Design Artifacts

**To be generated**:
1. **data-model.md**: Node entity structure (id, position, content, type, style)
2. **contracts/node-structure.ts**: TypeScript interface for Node type
3. **quickstart.md**: Development setup and running instructions

**Agent context update**: Will run `.specify/scripts/bash/update-agent-context.sh claude` after design artifacts are complete.

## Phase 2: Task Breakdown

**Not included in this command.** Run `/speckit.tasks` after plan approval to generate dependency-ordered tasks.md.
