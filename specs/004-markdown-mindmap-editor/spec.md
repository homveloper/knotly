# Feature Specification: Markdown Mind Map Editor

**Feature Branch**: `004-markdown-mindmap-editor`
**Created**: 2025-10-20
**Status**: Draft
**Input**: User description: "Markdown Split Editor with Mind Map - 사용자 요구사항 명세"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-time Bidirectional Sync (Priority: P1)

Users can type markdown text in the left editor panel and immediately see nodes and edges appear in the right mind map canvas, reflecting the hierarchical structure defined by headers and list indentation. Conversely, when users edit or drag nodes in the canvas, the markdown text in the left editor updates automatically.

**Why this priority**: This is the core value proposition of the hybrid tool - enabling fast keyboard input while maintaining visual structure awareness. Without bidirectional sync, the tool becomes either a plain markdown editor or a traditional mind map tool, losing its unique advantage.

**Independent Test**: Can be fully tested by typing a simple markdown document with headers and lists, verifying nodes appear in the canvas, then editing a node in the canvas and verifying the markdown text updates. Delivers immediate value for users who want to combine text speed with visual organization.

**Acceptance Scenarios**:

1. **Given** an empty editor, **When** user types markdown headers with different levels (`#`, `##`, `###`), **Then** corresponding nodes appear in the canvas with parent-child edges reflecting the header hierarchy
2. **Given** an empty editor, **When** user types a bulleted list with indentation, **Then** list items appear as nodes with edges connecting child items to parent items based on indentation level
3. **Given** existing nodes in the canvas, **When** user double-clicks a node to edit its text content directly in the canvas, **Then** the corresponding markdown line in the editor updates to reflect the new text
4. **Given** existing nodes in the canvas, **When** user clicks the delete button (×) on a node or presses the Delete key while a node is selected, **Then** the corresponding markdown line is removed from the editor
5. **Given** markdown text being typed in the editor, **When** text changes occur, **Then** canvas updates are debounced to 300ms to prevent performance issues while maintaining real-time feel

---

### User Story 2 - Node Styling with Markdown Tokens (Priority: P2)

Users can apply visual styling to nodes by adding token syntax (e.g., `{.color-red .h3}`) after markdown elements, controlling node color and size without leaving the markdown workflow.

**Why this priority**: Enables visual customization while maintaining pure markdown format. This differentiates the tool from competitors by keeping all styling inline and portable, rather than requiring proprietary metadata.

**Independent Test**: Can be tested by creating a markdown document, adding style tokens to various elements, and verifying that nodes render with the specified colors and sizes. Delivers value for users who want visual hierarchy beyond structural hierarchy.

**Acceptance Scenarios**:

1. **Given** a markdown header, **When** user appends `{.color-red}` after the header text, **Then** the corresponding node in the canvas renders with red color
2. **Given** a markdown list item, **When** user appends `{.h3}` after the item text, **Then** the corresponding node renders at h3 size (larger than default)
3. **Given** a markdown element with multiple tokens like `{.color-blue .h1}`, **When** the element is parsed, **Then** the node applies all specified styles (blue color and h1 size)
4. **Given** a styled node in the canvas, **When** user edits the node's style in the canvas UI, **Then** the token syntax in the markdown editor updates to reflect the new style

---

### User Story 3 - Multi-node Type Support (Priority: P2)

Users can include code blocks and images in their markdown, and these elements render as distinct node types in the mind map with appropriate visual representations (code blocks show preview/expanded states, images show as thumbnails).

**Why this priority**: Extends the tool's utility beyond simple text hierarchies, supporting rich content commonly found in technical documentation and knowledge management. Essential for users working with mixed content types.

**Independent Test**: Can be tested by creating a markdown document with code blocks and images, verifying they appear as specialized nodes in the canvas with correct preview behavior. Delivers value for technical users documenting code alongside concepts.

**Acceptance Scenarios**:

1. **Given** a markdown code block with language specification, **When** the editor parses the content, **Then** a code node appears in the canvas with syntax language indicated
2. **Given** a code node in preview state, **When** user clicks to expand, **Then** the full code content becomes visible in the node
3. **Given** a markdown image reference `![alt text](url)`, **When** the editor parses the content, **Then** an image node appears in the canvas showing a thumbnail of the image
4. **Given** a code block or image in the markdown, **When** it appears directly after a header or list item, **Then** the code/image node is automatically connected as a child of that element
5. **Given** a code block or image at the file's top, **When** parsed, **Then** it appears as a root node with no parent connection

---

### User Story 4 - Adjustable Split View (Priority: P3)

Users can drag the divider between the editor and canvas panels to adjust the split ratio according to their current focus, with the ratio persisting between sessions.

**Why this priority**: Supports different user workflows - some users prefer larger editor space for heavy typing, others prefer larger canvas for visual work. Persistence ensures the tool adapts to individual preferences.

**Independent Test**: Can be tested by dragging the split divider, verifying the panel sizes update, and reopening the application to confirm the ratio is restored. Delivers value for users with consistent workflow preferences.

**Acceptance Scenarios**:

1. **Given** the default 50-50 split view, **When** user drags the divider left or right, **Then** the editor and canvas panels resize accordingly in real-time
2. **Given** user dragging the divider, **When** the ratio reaches 30% or 70%, **Then** further dragging is prevented (split ratio constrained to 30%-70% range)
3. **Given** a customized split ratio, **When** user closes and reopens the application, **Then** the split ratio is restored to the previously saved value from LocalStorage
4. **Given** a customized split ratio, **When** user adjusts the browser window size, **Then** the split ratio percentage is maintained (panels scale proportionally)

---

### User Story 5 - Layout Switching (Priority: P3)

Users can switch between radial and horizontal layout modes using buttons in the canvas toolbar, with the selected layout automatically repositioning all nodes and persisting in the markdown file.

**Why this priority**: Different content structures benefit from different layouts - radial works well for concept maps with a central theme, horizontal works well for processes and timelines. Persistence ensures the author's intended visualization is preserved.

**Independent Test**: Can be tested by creating a mind map, clicking the layout toggle buttons, verifying all nodes reposition according to the new algorithm, and saving/reopening the file to confirm layout persistence. Delivers value for users presenting the same content in different contexts.

**Acceptance Scenarios**:

1. **Given** a mind map in radial layout, **When** user clicks the "➡️ Horizontal" button, **Then** all nodes reposition to horizontal layout with parents on the left and children to the right
2. **Given** a mind map in horizontal layout, **When** user clicks the "🌟 Radial" button, **Then** all nodes reposition to radial layout with root nodes centered and children radiating outward
3. **Given** a layout change, **When** the file is saved, **Then** the layout comment `<!-- knotly-layout: radial -->` or `<!-- knotly-layout: horizontal -->` is updated at the top of the markdown file
4. **Given** a markdown file with a layout comment, **When** the file is loaded, **Then** the mind map renders in the specified layout from the comment (or defaults to radial if comment is missing)
5. **Given** node positions after a layout change, **When** user drags nodes manually, **Then** node positions are visual only and not persisted (next layout switch or file reload recalculates positions)

---

### Edge Cases

- What happens when markdown contains syntax errors (e.g., unclosed code blocks)? System should render nodes for parseable content and ignore unparseable sections without crashing
- What happens when a user drags a node while the editor is still debouncing text changes? The ongoing debounce should be cancelled and the canvas state should take priority, updating the editor immediately
- What happens when a markdown file contains thousands of nodes? System should warn when node count exceeds 500 and suggest splitting the content, but still attempt to render (with potential performance degradation)
- How does the system handle circular reference attempts (e.g., header levels that skip or decrease illogically)? Treat each header as a child of the most recent header with a lower level, creating a logical hierarchy even from irregular markdown
- What happens when user edits markdown text while cursor is in the middle of a line? System must preserve cursor position after debounced updates to prevent disorienting cursor jumps
- What happens when images fail to load or code blocks contain extremely long lines? Image nodes should show a placeholder icon, code blocks should wrap or scroll horizontally within the node bounds
- What happens when two users edit the same markdown file concurrently (file system race condition)? System relies on standard file system behavior (last write wins); real-time collaboration is out of scope

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse markdown text in real-time (300ms debounce) and convert headers, lists, code blocks, images, and horizontal rules into a graph data structure with nodes and edges
- **FR-002**: System MUST render nodes in the canvas using the existing rough.js hand-drawn style, with node type (text/header/code/image) determining visual appearance
- **FR-003**: System MUST create edges between nodes based on markdown hierarchy (header levels create parent-child relationships, list indentation creates parent-child relationships)
- **FR-004**: System MUST allow users to edit node text directly in the canvas, with changes immediately updating the corresponding markdown text in the editor
- **FR-005**: System MUST allow users to delete nodes in the canvas, with deletions immediately removing the corresponding markdown line in the editor
- **FR-006**: System MUST preserve cursor position in the markdown editor after canvas-triggered updates to prevent disorienting cursor jumps
- **FR-007**: System MUST prevent circular updates between editor and canvas using dirty flags (when editor triggers canvas update, canvas must not trigger editor update)
- **FR-008**: System MUST parse style tokens in the format `{.token1 .token2}` after markdown elements and apply corresponding visual styles to nodes (color, size)
- **FR-009**: System MUST support code block nodes with toggle between preview (collapsed) and expanded states, preserving language syntax information
- **FR-010**: System MUST support image nodes rendering as thumbnails, extracting URL and alt text from markdown image syntax `![alt](url)`
- **FR-011**: System MUST connect code blocks and images as children of the immediately preceding header or list item, or as root nodes if they appear at the file's beginning
- **FR-012**: System MUST allow users to drag a divider to adjust the split ratio between editor and canvas panels, constrained to 30%-70% range
- **FR-013**: System MUST persist the split ratio to LocalStorage and restore it on application reload
- **FR-014**: System MUST provide layout toggle buttons in the canvas toolbar (🌟 Radial, ➡️ Horizontal) to switch node positioning algorithms
- **FR-015**: System MUST recalculate all node positions when layout mode changes, using each node's measured size to prevent overlaps
- **FR-016**: System MUST save the current layout mode as a layout comment `<!-- knotly-layout: radial -->` or `<!-- knotly-layout: horizontal -->` at the top of the markdown file
- **FR-017**: System MUST parse the layout comment from markdown files on load and apply the specified layout (defaulting to radial if comment is absent)
- **FR-018**: System MUST ignore manually dragged node positions when saving (positions are always recalculated by layout algorithm on next load)
- **FR-019**: System MUST serialize the graph back to pure markdown format, preserving headers, lists, code blocks, images, style tokens, and layout comment
- **FR-020**: System MUST ensure output files are compatible with standard markdown parsers (Git diff/merge, Obsidian, Notion) by using only standard markdown syntax plus layout comments

### Key Entities *(include if feature involves data)*

- **Node**: Represents a markdown element in the graph. Contains unique ID, type (text/header/code/image), text content, hierarchy level, style tokens, 2D position coordinates, measured size (width/height), and group identifier. Code nodes additionally store language and source code. Image nodes additionally store URL and alt text.
- **Edge**: Represents hierarchical relationship between two nodes. Contains source node ID and target node ID. Created automatically based on markdown structure (header levels, list indentation, code/image attachment rules).
- **Layout State**: Represents the current layout algorithm mode (radial or horizontal). Determines how node positions are calculated. Persisted in markdown file as layout comment.
- **Split Ratio**: Represents the percentage division between editor and canvas panels. Constrained to 30%-70% range. Persisted in LocalStorage for session continuity.
- **Markdown File**: Input and output artifact. Pure `.md` file containing standard markdown with optional layout comment for layout mode and optional style tokens in `{.class}` format. Must remain compatible with external markdown tools.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can type markdown text continuously without interruption, with canvas updates appearing smoothly within 300ms of text changes
- **SC-002**: Users can edit node content in the canvas and see markdown editor text update instantly (under 100ms) without cursor position jumping
- **SC-003**: System correctly parses and renders 100% of standard markdown elements (headers, lists, code blocks, images) as distinct node types with appropriate visual styling
- **SC-004**: Style tokens (e.g., `{.color-red .h3}`) apply visual changes to nodes with 100% accuracy, and all style changes made in the canvas are serialized back to token syntax in markdown
- **SC-005**: Layout switching (radial ↔ horizontal) completes within 1 second for documents with up to 100 nodes, with all nodes repositioned without overlap
- **SC-006**: Split panel ratio adjustments feel responsive (under 16ms frame time) and persist correctly across 100% of browser sessions when using LocalStorage
- **SC-007**: Output markdown files are byte-for-byte identical to input files (except for layout comment updates), passing Git diff validation and loading correctly in Obsidian and Notion
- **SC-008**: Zero circular update loops occur during normal editing operations, verified by logging update triggers during 100 consecutive edit actions
- **SC-009**: System handles edge cases gracefully: syntax errors do not crash the parser, images with broken URLs show placeholders, and documents with 500+ nodes display performance warnings

## Assumptions

- **Assumption 1**: Users have modern browsers with support for File System Access API (Chromium-based) or fallback to file input/download (Safari/Firefox)
- **Assumption 2**: Users understand basic markdown syntax (headers, lists, code blocks, images) and are comfortable editing plain text
- **Assumption 3**: Markdown files edited by this tool will primarily be used for personal knowledge management and documentation, not for collaborative real-time editing
- **Assumption 4**: Standard markdown conventions apply: headers use `#` prefix, lists use `-` or `*` bullets, code blocks use triple backticks, images use `![alt](url)` syntax
- **Assumption 5**: Layout algorithms (radial, horizontal) will use deterministic positioning based on node hierarchy and measured size, not user-defined coordinates
- **Assumption 6**: Style tokens use CSS class naming conventions (e.g., `.color-red`, `.h3`) without requiring formal CSS definitions (styling is handled by the application's theme)
- **Assumption 7**: Performance target is 60fps for canvas interactions and under 300ms for text-to-graph parsing on documents with up to 100 nodes
- **Assumption 8**: Horizontal rule separators (`---`) in markdown define visual groups but do not affect node hierarchy (they create group IDs for visual organization only)
- **Assumption 9**: Browser LocalStorage is available and persistent for storing UI preferences like split ratio
- **Assumption 10**: Users will manually save files after editing (auto-save is out of scope for MVP)
