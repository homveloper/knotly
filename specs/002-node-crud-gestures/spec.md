# Feature Specification: Interactive Graph Editor with Touch Gestures

**Feature Branch**: `002-node-crud-gestures`
**Created**: 2025-10-17
**Status**: Draft
**Input**: User description: "목표: 노드 생성, 편집, 이동, 삭제 기능과 모바일 터치 제스처, 점선 연결, 그리고 @멘션 자동 연결을 구현하여 기본 그래프 편집 환경을 완성한다. 사용자가 모바일에서 FAB 버튼으로 노드를 추가하고, 드래그로 배치하며, 점선으로 연결하여 간단한 마인드맵을 작성할 수 있도록 한다."

## Clarifications

### Session 2025-10-17

- Q: How should link directionality be visually represented to users? → A: Bidirectional lines with no directional indicators (no arrow heads)
- Q: What are the node dimensions and minimum touch target sizes? → A: Node diameter 120px, minimum touch target 44px
- Q: How should text overflow be handled when content exceeds the 120px node space? → A: Text wrapping with vertical scroll (scroll indicator appears when content exceeds visible area)
- Q: How should the @mention panel filter nodes as the user types? → A: Auto-filter dynamically as user continues typing after @ symbol (e.g., "@mee" filters to nodes containing "mee")
- Q: How should gesture conflicts (pinch-zoom vs two-finger-pan) be resolved? → A: Gesture intent detection with movement thresholds (fingers apart/together >10px = zoom; parallel movement >15px = pan; first detected intent wins)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Edit Nodes (Priority: P1)

A user opens the application on their mobile browser and wants to quickly capture their thoughts as a mind map. They tap the floating action button at the bottom right to create a new node in the center of the canvas. The soft keyboard appears immediately, allowing them to type their idea using a friendly handwritten font. They can tap any existing node to edit its content.

**Why this priority**: This is the core value proposition - enabling users to create and capture ideas. Without this, the application has no fundamental purpose.

**Independent Test**: Can be fully tested by creating 5 nodes with different content and editing 3 of them. Delivers immediate value by allowing users to externalize their thoughts visually.

**Acceptance Scenarios**:

1. **Given** the canvas is displayed, **When** user taps the FAB button, **Then** a new circular node appears at the canvas center and keyboard opens automatically for text input
2. **Given** a node exists with text "Meeting Notes", **When** user taps the node once, **Then** edit mode activates showing the existing text with cursor positioned at the end
3. **Given** user is editing a node, **When** they type new characters, **Then** text updates in real-time with handwritten font style

---

### User Story 2 - Move and Arrange Nodes (Priority: P1)

A user has created several nodes and wants to organize them spatially to reflect relationships and hierarchy. They can drag any node to reposition it freely across the canvas. If grid snapping is enabled in settings, nodes automatically align to a 20-pixel grid when released, creating a neat organized appearance.

**Why this priority**: Spatial arrangement is essential for mind mapping - it's what differentiates this from a simple list. This enables users to create visual structure and meaning.

**Independent Test**: Create 5 nodes, drag each to different positions, enable grid snap and observe alignment. Delivers value by letting users express relationships through space.

**Acceptance Scenarios**:

1. **Given** a node exists at position (100, 100), **When** user drags it 50 pixels right and down, **Then** node moves smoothly following the touch point
2. **Given** grid snapping is enabled, **When** user releases a node after dragging, **Then** node position adjusts to nearest 20px grid intersection
3. **Given** grid snapping is disabled, **When** user releases a node after dragging, **Then** node remains at exact drop position

---

### User Story 3 - Connect Nodes with Links (Priority: P2)

A user wants to show explicit relationships between their ideas. They tap the connection mode button (🔗), then tap a source node followed by a target node. A hand-drawn dashed line appears connecting the two nodes, visually expressing the relationship. They can tap a link to select it (turns blue) or long-press to delete it.

**Why this priority**: Connections transform isolated nodes into a knowledge graph. While nodes alone provide value, links enable users to express complex relationships and dependencies.

**Independent Test**: Create 5 nodes, activate link mode, create 3 connections between different nodes, select and delete 1 connection. Delivers value by enabling relationship mapping.

**Acceptance Scenarios**:

1. **Given** link mode is active and user taps node A then node B, **When** second tap completes, **Then** a dashed line renders from node A center to node B center with hand-drawn style
2. **Given** a link exists between nodes, **When** user taps the link once, **Then** link highlights in blue indicating selection
3. **Given** a link is selected, **When** user long-presses the link, **Then** link is removed and disappears from canvas

---

### User Story 4 - Customize Node Appearance (Priority: P2)

A user wants to visually categorize their nodes using colors. They long-press a node to open a context menu showing three color options: yellow, sky blue, and mint. Selecting a color immediately updates the node's background. They can also choose to delete the node, which removes it and all connected links.

**Why this priority**: Color coding enhances visual organization and comprehension. While not essential for basic functionality, it significantly improves usability for complex maps with many nodes.

**Independent Test**: Create 3 nodes, long-press each and apply different colors, then delete one node. Verify connected links disappear. Delivers value through visual categorization.

**Acceptance Scenarios**:

1. **Given** user long-presses a node, **When** context menu appears, **Then** three color options (yellow, sky blue, mint) and delete option are visible
2. **Given** user selects sky blue from context menu, **When** selection completes, **Then** node background changes to sky blue color immediately
3. **Given** a node has 2 connected links, **When** user deletes the node, **Then** node and all its links disappear simultaneously

---

### User Story 5 - Quick Link with @Mentions (Priority: P3)

A user is typing content in a node and wants to reference another existing node. They type the @ symbol, which triggers a bottom sheet displaying all existing nodes. Selecting a node from the list automatically creates a connection from the current node to the selected node, streamlining the linking process.

**Why this priority**: This is a convenience feature that accelerates workflow for power users. While manual linking works, @mentions reduce friction for users creating many interconnected nodes.

**Independent Test**: Create 5 nodes with distinct names, create a new 6th node, type @ during editing, select 2 different nodes from the list. Verify 2 links are created. Delivers value through workflow optimization.

**Acceptance Scenarios**:

1. **Given** user is editing node text and types @ symbol, **When** @ is entered, **Then** bottom sheet appears showing list of all existing nodes with their content
2. **Given** bottom sheet is displayed and user types "mee" after the @ (forming "@mee"), **When** characters are entered, **Then** list dynamically filters to show only nodes containing "mee" in their content
3. **Given** bottom sheet is filtered and user backspaces to remove characters, **When** characters are deleted, **Then** previously filtered nodes reappear in the list
4. **Given** bottom sheet is displayed showing nodes, **When** user taps a node from the list, **Then** a new connection is created from current node to selected node and bottom sheet closes
5. **Given** no other nodes exist, **When** user types @ symbol, **Then** bottom sheet appears with message "No nodes available to link"

---

### User Story 6 - Navigate Canvas with Touch Gestures (Priority: P2)

A user has created a large mind map that extends beyond the visible screen. They use two-finger pan gestures to move the viewport and pinch gestures to zoom in (viewing details) or zoom out (seeing overall structure). Zoom range is constrained between 0.5x and 3x to maintain usability.

**Why this priority**: As mind maps grow, navigation becomes essential. This enables users to work with large-scale maps while maintaining detailed control when needed.

**Independent Test**: Create nodes spread across a large area, use pinch to zoom out to 0.5x (seeing all nodes), zoom in to 3x (seeing detail), and pan to move viewport. Delivers value by enabling large-canvas workflows.

**Acceptance Scenarios**:

1. **Given** canvas is at 1x zoom, **When** user performs pinch-out gesture, **Then** canvas zooms in smoothly up to maximum 3x zoom
2. **Given** canvas is at 1x zoom, **When** user performs pinch-in gesture, **Then** canvas zooms out smoothly down to minimum 0.5x zoom
3. **Given** canvas contains multiple nodes, **When** user performs two-finger drag, **Then** entire canvas pans following the gesture direction

---

### User Story 7 - Visual Grid and Alignment (Priority: P3)

A user prefers a structured, organized appearance for their mind map. They open settings and enable the grid background, which displays light gray horizontal and vertical lines at 20px intervals. They also enable grid snapping, so when moving nodes, they automatically align to grid intersections, creating a clean geometric layout.

**Why this priority**: This is a preference feature that appeals to users who value order and structure. While some users prefer freeform placement, others benefit from visual guides and automatic alignment.

**Independent Test**: Toggle grid display on/off and observe background change, enable grid snap and drag nodes to observe alignment behavior. Delivers value through user preference accommodation.

**Acceptance Scenarios**:

1. **Given** user opens settings panel, **When** grid display toggle is enabled, **Then** light gray grid lines appear on canvas at 20px intervals
2. **Given** grid display is enabled, **When** user disables the toggle, **Then** grid lines disappear immediately
3. **Given** grid snap is enabled, **When** user drags a node to position (37, 83) and releases, **Then** node snaps to nearest grid position (40, 80)

---

### Edge Cases

- What happens when a user attempts to create a link from a node to itself? System prevents self-loops and shows brief message "Cannot link node to itself"
- How does system handle node deletion when it's the target of @mention references? All incoming and outgoing links are removed automatically
- What happens when user zooms to 3x and canvas extends beyond viewport boundaries? Pan gestures remain functional to navigate the zoomed canvas
- How does system behave when user creates 100+ nodes? Performance may degrade but system remains functional (no hard limit enforced in this phase)
- What happens when user rotates device orientation? Canvas maintains current zoom and pan position, adjusting viewport dimensions to new screen size
- How does keyboard handle special characters or emoji input? All Unicode text is supported and renders with the handwritten font
- What happens when user tries to create a duplicate connection between two nodes? System allows duplicate connections (no uniqueness constraint in this phase)
- What happens when canvas is empty and user taps link mode button? Link mode activates but user must create at least 2 nodes before links can be created
- How does system handle rapid gesture inputs (e.g., quick successive pinches)? System debounces gesture events to prevent performance issues, processing at maximum 60 updates per second

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a floating action button persistently visible in the bottom-right corner of the screen
- **FR-002**: System MUST create a new circular node at the canvas center when FAB is tapped, automatically activating text input mode
- **FR-003**: Users MUST be able to tap any existing node to enter edit mode for modifying its text content
- **FR-004**: System MUST allow users to drag nodes to any position on the canvas using touch gestures
- **FR-005**: System MUST support optional grid snapping that aligns nodes to 20-pixel grid intersections when enabled
- **FR-006**: System MUST provide a link mode activated by a dedicated button, enabling connection creation between nodes
- **FR-007**: System MUST create visual connections (bidirectional dashed lines with hand-drawn style, no directional indicators) between nodes when selected sequentially in link mode
- **FR-008**: Users MUST be able to select links by tapping them, with visual feedback (blue highlight)
- **FR-009**: System MUST delete links when user performs long-press gesture on a selected link
- **FR-010**: Users MUST be able to long-press nodes to access a context menu with color change and delete options
- **FR-011**: System MUST provide exactly three color options for nodes: yellow, sky blue, and mint
- **FR-012**: System MUST cascade-delete all connected links when a node is deleted
- **FR-013**: System MUST trigger a node selection panel when user types @ symbol during text editing, and dynamically filter the displayed nodes as user continues typing (e.g., "@meet" shows only nodes containing "meet")
- **FR-014**: System MUST automatically create a connection to the selected node when chosen from @mention panel
- **FR-015**: System MUST support pinch-to-zoom gestures with zoom range constrained between 0.5x and 3x, using gesture intent detection (fingers moving apart/together by >10px triggers zoom)
- **FR-016**: System MUST support two-finger pan gestures for canvas navigation, using gesture intent detection (fingers moving in parallel by >15px before spreading triggers pan)
- **FR-028**: System MUST resolve multi-touch gesture conflicts using intent detection thresholds, where the first detected gesture intent (zoom or pan) takes priority and blocks the alternative interpretation
- **FR-017**: System MUST provide settings to toggle grid background visibility
- **FR-018**: System MUST provide settings to toggle grid snapping behavior
- **FR-019**: System MUST display grid lines at 20-pixel intervals when grid display is enabled
- **FR-020**: System MUST render all node text using a handwritten-style font for warm, friendly aesthetics
- **FR-021**: System MUST persist all nodes, links, zoom level, and pan position in memory (note: data is lost on page refresh in this phase)
- **FR-022**: System MUST render circles and connection lines with hand-drawn appearance (rough/sketchy style)
- **FR-023**: System MUST assign unique identifiers to all nodes and links for tracking and manipulation
- **FR-024**: System MUST update node positions in real-time as user drags them across canvas
- **FR-025**: System MUST support displaying canvas at different viewport sizes (responsive to device screen dimensions)
- **FR-026**: System MUST render nodes with a diameter of 120 pixels, ensuring minimum touch target size of 44 pixels meets mobile accessibility standards
- **FR-027**: System MUST wrap text content within node boundaries and provide vertical scrolling with visual scroll indicator when text exceeds the visible area of the 120px circular space

### Key Entities

- **Node**: Represents a single idea or concept in the mind map. Has a unique identifier, position coordinates (x, y), text content (with multi-line wrapping and vertical scrolling for overflow), visual style (background color, stroke), fixed circular dimensions (120px diameter), and timestamps (created, updated). The 120px diameter provides a generous touch target exceeding the 44px mobile accessibility minimum. Text content automatically wraps within the circular boundary, and a scroll indicator appears when content exceeds visible space. Nodes are the fundamental building blocks of the graph.

- **Link/Edge**: Represents a connection between two nodes, expressing a relationship or dependency. Has a unique identifier, source node reference (fromId), target node reference (toId), and visual style (line pattern). While links are stored directionally (from → to) for data modeling purposes, they are rendered as bidirectional lines with no visual directional indicators (no arrow heads), emphasizing associative relationships over strict causal flows. Links transform isolated nodes into an interconnected graph structure.

- **Canvas**: The infinite workspace where nodes and links are rendered. Maintains current zoom level (0.5x to 3x), pan offset (x, y displacement), and grid settings (enabled/disabled, snap enabled/disabled). Users interact with the canvas through touch gestures.

- **Context Menu**: A modal interface displayed when user long-presses a node. Presents action options: three color choices (yellow, sky blue, mint) and a delete option. Provides node-level customization and management.

- **@Mention Panel**: A bottom sheet interface triggered by @ symbol during text input. Displays a dynamically filtered list of existing nodes that updates in real-time as the user continues typing after the @ symbol (e.g., typing "@mee" filters to show only nodes containing "mee"). Backspacing restores previously filtered nodes. This auto-filtering behavior enables quick connection creation and streamlines the workflow of linking related concepts, especially beneficial for power users managing many interconnected nodes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create 5 nodes and connect 3 of them within 2 minutes on first use
- **SC-002**: Node creation response time is under 100 milliseconds from FAB tap to node appearance
- **SC-003**: Drag operations maintain 60 frames per second smoothness during node repositioning
- **SC-004**: Touch gesture recognition responds within 50 milliseconds of user input
- **SC-005**: 80% of test users describe the interface as "intuitive" or "fast" in post-task feedback
- **SC-006**: Zero long tasks (>50ms blocking) detected in browser performance profiling during typical usage
- **SC-007**: Zoom and pan operations feel smooth and responsive with no visible lag or stuttering
- **SC-008**: Grid snapping provides clear visual feedback with nodes visibly "jumping" to alignment
- **SC-009**: @mention panel displays within 100 milliseconds of typing @ symbol
- **SC-010**: Application supports viewing and editing mind maps with up to 50 nodes without performance degradation
- **SC-011**: Link creation via @mention is completed 40% faster than manual link mode for users linking 10+ nodes
- **SC-012**: Users successfully recover from errors (e.g., accidental node deletion) without losing work (via real-time visual feedback)
- **SC-013**: Mobile keyboard transitions (show/hide) complete smoothly without disrupting canvas positioning
- **SC-014**: 95% of users successfully complete color customization task on first attempt without guidance
- **SC-015**: Hand-drawn visual style is perceived as "friendly" or "approachable" by 80% of users in aesthetic evaluation

## Assumptions

1. **Single-user context**: This phase does not support multi-user collaboration or real-time synchronization. Each user works in isolation.

2. **Client-side state only**: All data is stored in browser memory. Refreshing the page results in data loss. Persistence (localStorage, database) will be addressed in future phases.

3. **Mobile-first design**: Primary optimization target is mobile touch interfaces. Desktop mouse/keyboard interactions are functional but not optimized in this phase.

4. **Circular nodes only**: Only one node shape (circle) is supported. Additional shapes (rectangle, cloud, etc.) will be added in Milestone 5.

5. **Single line style**: Only dashed lines are supported for connections. Solid, curved, and arrow-tipped lines will be added in Milestone 5.

6. **Limited color palette**: Only 3 colors are provided (yellow, sky blue, mint). The full 8-color palette will be available in Milestone 5.

7. **No undo/redo**: Users cannot reverse actions. Undo/redo functionality is planned for Phase 2.

8. **No search**: Users cannot search node content. Search features will be added in Milestone 4.

9. **No export**: Users cannot save or export their mind maps. Import/export functionality is planned for future phases.

10. **Modern browser support**: Application targets modern mobile browsers (Chrome 90+, Safari 14+, Firefox 88+). Legacy browser support is not a requirement.

11. **Performance baseline**: Initial implementation targets 60fps performance with up to 50 nodes. Optimization for larger graphs (100+) will be addressed based on user feedback.

12. **Accessibility**: Basic accessibility (semantic HTML, keyboard navigation) is not prioritized in this prototype phase. Full WCAG compliance will be addressed in Milestone 4.

## Dependencies

- **Milestone 1 Completion**: The hand-drawn canvas prototype must be complete with rough.js integration and Nanum Pen Script font configuration established.

- **State Management Migration**: The static single-node prototype from Milestone 1 must be refactored to support dynamic node arrays with centralized state management.

- **Touch Gesture Library**: A gesture handling solution must be integrated to support pinch, pan, tap, long-press, and drag interactions reliably across mobile browsers.

- **Component Refactoring**: The existing Canvas component must be refactored from rendering a single static node to rendering a dynamic list of nodes from state.

## Constraints and Limitations

### Scope Boundaries

**In Scope for this Milestone:**
- Node CRUD operations (create, read, update, delete)
- Node positioning via drag-and-drop
- Link creation and deletion
- Basic node styling (3 colors)
- Touch gesture support (tap, long-press, drag, pinch, pan)
- Grid background and snap-to-grid
- @mention linking
- Canvas zoom (0.5x to 3x)
- Canvas pan

**Explicitly Out of Scope:**
- Multiple node shapes (coming in Milestone 5)
- Multiple line styles (coming in Milestone 5)
- Full color palette (coming in Milestone 5)
- Undo/redo (coming in Phase 2)
- Data persistence (coming in future phase)
- Search functionality (coming in Milestone 4)
- Export/import (coming in future phase)
- Accessibility features (coming in Milestone 4)
- Real-time collaboration (coming in future phase)
- Backend integration (coming in future phase)

### Technical Constraints

- **Memory limitations**: As a client-side only application, large mind maps (200+ nodes) may cause performance issues or browser memory constraints
- **Browser compatibility**: Application is optimized for modern mobile browsers; older browser versions may have degraded functionality
- **Touch gesture conflicts**: Multi-touch gestures are disambiguated using intent detection with movement thresholds (fingers moving apart/together >10px = zoom; parallel movement >15px before spreading = pan). The first detected intent takes priority, preventing mode conflicts while maintaining gesture fluidity. System must also avoid conflicts with native browser gestures
- **Performance threshold**: Target is 60fps for smooth interactions; achieving this with 50+ nodes requires careful rendering optimization

### User Experience Constraints

- **Learning curve**: New users unfamiliar with mind mapping tools may need brief orientation to understand node-linking workflow
- **Mobile keyboard occlusion**: When editing nodes near bottom of screen, keyboard may obscure the node being edited (no auto-scroll in this phase)
- **Data loss risk**: Users must be warned that refreshing the page will lose all work (addressed in future phase with auto-save)
- **Touch precision**: Nodes are sized at 120px diameter to ensure comfortable touch interaction and exceed the 44px minimum touch target standard; closely spaced nodes may still be difficult to interact with on small mobile screens
