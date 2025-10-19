# Feature Specification: Markdown File-Based Mind Map with Token System

**Feature Branch**: `003-markdown-file-tokens`
**Created**: 2025-10-19
**Status**: Draft
**Input**: User description: "목표: 마크다운 파일 기반 마인드맵 노트앱으로 전환하여 로컬 파일 저장, 텍스트 편집 가능성, 조합형 토큰 시스템을 구현한다..."

## User Scenarios & Testing

### User Story 1 - Create and Save First Note (Priority: P1)

A new user opens the app, creates their first mind map note, adds a few connected thoughts, and saves it as a local markdown file that they can edit later in any text editor.

**Why this priority**: This is the foundation of the entire feature - without the ability to create and save notes, no other functionality matters. It delivers immediate value by letting users capture thoughts and persist them.

**Independent Test**: Can be fully tested by launching the app, clicking "New Note", adding 2-3 nodes with text, pressing Cmd/Ctrl+S, and verifying the .knotly.md file is created with correct YAML frontmatter and markdown body structure.

**Acceptance Scenarios**:

1. **Given** user opens the app for the first time, **When** they see the start screen, **Then** they see "New Note" and "Open File" buttons clearly displayed
2. **Given** user clicks "New Note" button, **When** the canvas loads, **Then** they see an empty canvas with a basic token library pre-loaded
3. **Given** user has an empty canvas, **When** they double-click on blank space, **Then** a new node appears at that position and enters text input mode immediately
4. **Given** user has typed text in a node, **When** they press Enter or click outside, **Then** the text is saved and the node displays it
5. **Given** user has created one or more nodes, **When** they press Cmd/Ctrl+S, **Then** a save dialog appears prompting for filename
6. **Given** user enters filename "my-notes.knotly.md" and confirms, **When** save completes, **Then** the file is written to disk and filename appears in titlebar
7. **Given** user opens the saved .knotly.md file in a text editor, **When** they view the content, **Then** they see YAML frontmatter with tokens/nodes/edges sections and markdown body with [id] delimiters

---

### User Story 2 - Open and Edit Existing Note (Priority: P1)

A user has previously created notes and wants to reopen them, continue editing, and see their recent files for quick access.

**Why this priority**: This completes the basic read-write cycle - users need to reopen their work. Without this, the app would be write-only, making it unusable for ongoing work.

**Independent Test**: Can be tested by creating a sample .knotly.md file, clicking "Open File", selecting the file, and verifying all nodes and connections are restored to the canvas in correct positions.

**Acceptance Scenarios**:

1. **Given** user has a .knotly.md file on disk, **When** they click "Open File" button on start screen, **Then** a file picker dialog appears
2. **Given** file picker is open, **When** user selects a .knotly.md file and confirms, **Then** the canvas loads with all nodes, connections, and styles restored exactly as saved
3. **Given** user has a .knotly.md file in a folder, **When** they drag and drop the file onto the app window, **Then** the file loads and displays all content correctly
4. **Given** user has opened files before, **When** they view the start screen, **Then** they see a "Recent Files" list showing up to 5 previously opened files with filenames and last modified dates
5. **Given** user sees recent files list, **When** they click on a recent file entry, **Then** that file opens immediately without showing file picker
6. **Given** user has a file open, **When** they make changes to nodes or connections, **Then** a ● (dot) indicator appears next to the filename in titlebar
7. **Given** user saves changes with Cmd/Ctrl+S, **When** save completes, **Then** the ● indicator changes to ✓ (checkmark) for 2 seconds before disappearing

---

### User Story 3 - Connect Thoughts Quickly (Priority: P1)

A user is brainstorming and wants to rapidly create connected nodes to capture a flow of ideas without breaking their train of thought.

**Why this priority**: This is the core value proposition of a mind mapping tool - quickly capturing connected thoughts. The automatic connection on double-click is the killer feature for flow state.

**Independent Test**: Can be tested by selecting a node, double-clicking blank space, and verifying a new connected node appears with focus, allowing immediate typing without additional clicks.

**Acceptance Scenarios**:

1. **Given** user has a node selected (highlighted), **When** they double-click on blank canvas space, **Then** a new node appears at that position, automatically connects to the selected node with an edge, and immediately enters text input mode
2. **Given** user creates a connected node via double-click, **When** the new node appears, **Then** focus automatically moves to the new node for immediate text entry
3. **Given** user is on desktop, **When** they click and drag from a node's edge/border to another node and release, **Then** a connection line is created between the two nodes
4. **Given** user is on mobile/touch device, **When** they long-press a node for 500ms, **Then** the node enters "connection waiting" state with visual feedback (e.g., border highlight or glow)
5. **Given** user has a node in "connection waiting" state, **When** they tap another node, **Then** a connection is created between the two nodes and the waiting state clears
6. **Given** user creates a connection between nodes, **When** the edge appears, **Then** it is rendered with rough.js hand-drawn style matching the app aesthetic

---

### User Story 4 - Customize Node Appearance with Tokens (Priority: P2)

A user wants to visually organize their mind map by applying different colors, sizes, and styles to nodes using a simple token-based system.

**Why this priority**: Visual organization significantly improves information hierarchy and recall. This is the unique differentiator - the composable token system that's both powerful and editable in plain text.

**Independent Test**: Can be tested by right-clicking a node, selecting tokens from the style panel (e.g., "color-blue h3 neat"), and verifying the node updates immediately with combined styles.

**Acceptance Scenarios**:

1. **Given** user right-clicks on a node, **When** the context menu appears, **Then** a style selection panel displays with categorized token buttons (Colors, Sizes, Feel, Border)
2. **Given** style panel is open, **When** user clicks a token button (e.g., "color-blue"), **Then** the token is added to the node's style string and the node re-renders immediately with the new appearance
3. **Given** user has applied tokens to a node, **When** they click another token from the same category (e.g., "color-red" when "color-blue" is active), **Then** the previous token is replaced by the new one
4. **Given** user applies multiple tokens from different categories, **When** the style is applied, **Then** tokens are combined in order (e.g., "color-blue h4 neat") and the last token wins for conflicting properties
5. **Given** style panel is open, **When** user views the bottom of the panel, **Then** they see the current token combination string displayed (e.g., "color-blue h4 neat")
6. **Given** user has a token combination applied, **When** they click a currently active token button again, **Then** that token is removed from the combination string
7. **Given** user edits tokens section in .knotly.md file with text editor and adds a new token "highlight-yellow: 'color-yellow thick'", **When** they reopen the file in the app, **Then** the new token appears as an option in the style panel
8. **Given** user applies a composite token (e.g., "heading-primary" which expands to "color-blue h3 bold"), **When** the style renders, **Then** all constituent tokens are applied recursively and the final style matches the full expansion

---

### User Story 5 - Edit Notes in External Text Editor (Priority: P2)

A user prefers to edit some content in their favorite text editor (VS Code, Vim, etc.) and wants changes to sync when they reload the file in the app.

**Why this priority**: This unlocks power-user workflows and makes the file format truly portable. Users can leverage their existing editor tools for bulk edits, search-replace, version control, etc.

**Independent Test**: Can be tested by opening a .knotly.md file in VS Code, modifying node content in the markdown body and adding a new token in YAML frontmatter, saving, then reopening in the app to verify changes appear.

**Acceptance Scenarios**:

1. **Given** user has a .knotly.md file open in the app, **When** they open the same file in a text editor, **Then** they see human-readable YAML frontmatter with tokens/nodes/edges and markdown body with [id] sections
2. **Given** user edits node content in text editor by changing text under a [node-id-123] heading, **When** they save and reload in the app, **Then** the node displays the updated text
3. **Given** user adds a new node entry in YAML frontmatter with position and style, **When** they add corresponding [new-id] section in markdown body with content, **Then** the new node appears on canvas when file is reopened
4. **Given** user modifies a token definition in YAML (e.g., changes "color-blue" stroke value), **When** they reload the file, **Then** all nodes using that token display with the updated style
5. **Given** user has the file open in both app and text editor, **When** they make changes in the app and press Cmd/Ctrl+S, **Then** the text editor detects file change and prompts to reload (standard editor behavior)

---

### User Story 6 - Maintain Existing Canvas Features (Priority: P2)

A user who has been using the previous version (Milestone 2) wants all their familiar interactions - dragging nodes, zooming/panning the canvas, and touch gestures - to continue working seamlessly.

**Why this priority**: This ensures we don't regress existing functionality. Users should feel this is an enhancement, not a replacement with missing features.

**Independent Test**: Can be tested by performing all Milestone 2 gestures (drag node, pinch-zoom, two-finger pan, delete node) and verifying they work identically to before.

**Acceptance Scenarios**:

1. **Given** user has nodes on canvas, **When** they click and drag a node, **Then** the node moves smoothly to follow the cursor and updates its position
2. **Given** user is on a touch device, **When** they perform pinch gesture on canvas, **Then** the canvas zooms in/out smoothly around the pinch center point
3. **Given** user has zoomed in, **When** they perform two-finger pan gesture, **Then** the canvas viewport pans in the gesture direction
4. **Given** user has a node selected, **When** they press Delete/Backspace key or click delete button in context menu, **Then** the node and its connected edges are removed
5. **Given** canvas has grid enabled (from Milestone 2), **When** nodes are dragged, **Then** they snap to grid points for alignment
6. **Given** user interacts with any gesture, **When** the canvas re-renders, **Then** all nodes and edges are drawn with rough.js hand-drawn style for visual consistency

---

### Edge Cases

- **What happens when a .knotly.md file has malformed YAML frontmatter?**
  The app should display a user-friendly error message: "Unable to parse file: Invalid YAML format at line X" and offer to open in text editor for manual correction.

- **What happens when a node's style string references a non-existent token?**
  The token parser should skip unknown tokens silently and apply only recognized tokens. The node renders with default style for unrecognized properties.

- **What happens when a user tries to save a file but lacks write permissions?**
  The app should show an error dialog: "Failed to save: Permission denied" and offer to save to a different location.

- **What happens when a user drags a .txt or .md file (not .knotly.md) onto the canvas?**
  The app should display a message: "Unsupported file type. Please use .knotly.md files" and reject the drop operation.

- **What happens when the YAML frontmatter is missing the tokens section?**
  The app should initialize with default token library (8 colors, 6 sizes, 5 feels, 4 borders) and merge any existing partial tokens.

- **What happens when two nodes have the same ID in the YAML?**
  The file parser should detect the duplicate, generate a new unique ID for the second node, log a warning to the console (console.warn()), and proceed silently without user notification.

- **What happens when a node position in YAML is outside reasonable canvas bounds (e.g., pos: [999999, -999999])?**
  The app should clamp positions to a reasonable range (e.g., ±10,000 pixels from origin) and auto-pan viewport to show outlier nodes.

- **What happens when a user has unsaved changes and tries to close the browser tab?**
  The app should trigger browser's "beforeunload" confirmation: "You have unsaved changes. Are you sure you want to leave?" If user confirms, changes are lost (local file only, no cloud backup per constraints).

- **What happens when a user tries to open a 50MB .knotly.md file with 10,000 nodes?**
  The app should show a performance warning: "Large file detected (10,000 nodes). Performance may be degraded. Continue?" and allow the user to proceed without enforcing a hard limit, respecting user choice even for very large files.

- **What happens when user tries to create a connection from a node to itself?**
  The system should prevent self-loops - ignore the operation if the source and target node are the same, with no visual feedback (silent rejection).

## Requirements

### Functional Requirements

#### File I/O System

- **FR-001**: System MUST provide a start screen with "New Note" and "Open File" buttons as primary actions
- **FR-002**: System MUST create a new blank canvas with default token library pre-loaded when "New Note" is clicked
- **FR-003**: System MUST open file picker dialog when "Open File" is clicked, filtered to show .knotly.md files
- **FR-004**: System MUST support drag-and-drop of .knotly.md files onto the app window to open them
- **FR-005**: System MUST parse YAML frontmatter from .knotly.md files to extract tokens, nodes (id, pos, style), and edges data structures
- **FR-006**: System MUST parse markdown body using [id] delimiters to extract node content text
- **FR-007**: System MUST serialize current canvas state (tokens, nodes, edges) to YAML frontmatter format
- **FR-008**: System MUST serialize node content to markdown body format using [id]\n{content}\n\n pattern
- **FR-009**: System MUST save combined YAML + markdown to .knotly.md file when Cmd/Ctrl+S is pressed
- **FR-010**: System MUST display filename in titlebar when a file is open
- **FR-011**: System MUST display ● indicator next to filename when unsaved changes exist
- **FR-012**: System MUST display ✓ indicator for 2 seconds after successful save, then remove indicator
- **FR-013**: System MUST store list of recently opened files (filename and path) in browser localStorage
- **FR-014**: System MUST display up to 5 most recent files on start screen with filename and last modified date
- **FR-015**: System MUST open file immediately when user clicks on recent file entry (bypassing file picker)
- **FR-016**: System MUST show "beforeunload" browser confirmation if user tries to close tab with unsaved changes

#### Token System

- **FR-017**: System MUST define a default token library with 8 colors (color-blue, red, mint, yellow, gray, purple, orange, pink), 6 sizes (h1-h6), 5 feels (smooth, neat, rough, sketchy, messy), 4 borders (thin, normal, thick, bold), and 2 line styles (dashed, solid)
- **FR-018**: System MUST support atomic tokens (tokens that define style properties directly as objects)
- **FR-019**: System MUST support composite tokens (tokens that reference other tokens via space-separated string values)
- **FR-020**: System MUST parse node style strings by splitting on whitespace and looking up each token in the tokens definition object
- **FR-021**: System MUST merge token style objects in order using last-token-wins strategy for conflicting properties
- **FR-022**: System MUST recursively expand composite tokens (if a token value is a string, parse it as additional tokens)
- **FR-023**: System MUST convert final merged token style object to rough.js rendering parameters (stroke, fill, strokeWidth, roughness, fontSize, width, height)
- **FR-024**: System MUST allow tokens section in YAML frontmatter to be edited manually in text editor
- **FR-025**: System MUST load custom tokens from YAML frontmatter and merge them with default token library (custom tokens override defaults)

#### Style Editing UI

- **FR-026**: System MUST display a style selection panel when user right-clicks on a node
- **FR-027**: System MUST organize token buttons in the panel by category: Colors, Sizes, Feel, Border
- **FR-028**: System MUST highlight currently active tokens for the selected node in the panel
- **FR-029**: System MUST add token to node's style string when user clicks an inactive token button
- **FR-030**: System MUST remove token from node's style string when user clicks an active token button (toggle off)
- **FR-031**: System MUST replace existing token from same category when user clicks a different token in that category (e.g., color-blue → color-red)
- **FR-032**: System MUST update node rendering in real-time as token combination changes
- **FR-033**: System MUST display current token combination string at bottom of style panel (e.g., "color-blue h4 neat")

#### Node Connection System

- **FR-034**: System MUST create new node at double-click/double-tap position on blank canvas and enter text input mode immediately
- **FR-035**: System MUST create new node, auto-connect it to currently selected node, and move focus to new node when user double-clicks blank space with a node selected
- **FR-036**: System MUST create edge between two nodes when user drags from one node's border to another node and releases (desktop only)
- **FR-037**: System MUST enter "connection waiting" state with visual feedback when user long-presses a node for 500ms (mobile/touch only)
- **FR-038**: System MUST create edge and clear waiting state when user taps another node while in "connection waiting" state (mobile/touch only)
- **FR-039**: System MUST render all edges using rough.js with hand-drawn line style
- **FR-040**: System MUST prevent creation of self-loop edges (connections from node to itself)

#### Existing Feature Preservation (Milestone 2)

- **FR-041**: System MUST allow nodes to be dragged to new positions via click-and-drag gesture
- **FR-042**: System MUST support pinch-to-zoom gesture on touch devices to zoom canvas in/out around pinch center
- **FR-043**: System MUST support two-finger pan gesture on touch devices to pan canvas viewport
- **FR-044**: System MUST delete node and its connected edges when user presses Delete/Backspace or selects delete from context menu
- **FR-045**: System MUST snap node positions to grid points during drag operations (grid alignment feature from Milestone 2)
- **FR-046**: System MUST render all nodes and edges with rough.js hand-drawn style for visual consistency
- **FR-047**: System MUST maintain canvas zoom level and pan offset across interactions
- **FR-048**: System MUST achieve 60fps performance for gesture interactions (zoom, pan, drag) for smooth UX

### Key Entities

- **Note File (.knotly.md)**: Represents a single mind map document stored as markdown file with YAML frontmatter. Contains all tokens, nodes, edges, and node content for one mind map. Stored locally on user's file system (no cloud sync).

- **Token Definition**: Represents a reusable style unit that can be atomic (direct style properties) or composite (combination of other tokens). Stored in YAML frontmatter tokens section. Examples: "color-blue: {stroke: '#3b82f6'}" or "heading-primary: 'color-blue h3 bold'".

- **Node**: Represents a single thought/idea box on the canvas. Has unique ID, position [x, y], style (token combination string), and text content. Position stored in YAML frontmatter, content stored in markdown body under [id] delimiter.

- **Edge**: Represents a connection/relationship between two nodes. Has unique ID, source node ID (fromId), target node ID (toId), line style (dashed/solid). Stored in YAML frontmatter as [fromId, toId] tuples for brevity.

- **Canvas State**: Represents the complete working state of the mind map editor. Includes all nodes, edges, token definitions, current file path, unsaved changes flag, and viewport transform (zoom, pan). Stored in application state (Zustand store) during editing session.

- **Recent Files List**: Represents user's file access history for quick reopening. Stores file paths and last modified timestamps. Persisted in browser localStorage (not in .knotly.md files).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a new note, add 10 nodes with text and connections, and save to .knotly.md file in under 90 seconds
- **SC-002**: Users can open an existing .knotly.md file and see all nodes/edges restored to canvas in under 3 seconds for files with up to 100 nodes
- **SC-003**: Users can apply a token combination to a node and see visual update in under 100ms (feels instant)
- **SC-004**: Users can edit a .knotly.md file in external text editor, make changes to 5 nodes, and reload in app with all changes reflected correctly
- **SC-005**: 95% of users can successfully create their first connected node (double-click workflow) without reading documentation (intuitive UX)
- **SC-006**: Users can create connections between nodes using either double-click auto-connect or drag-to-connect in under 5 seconds per connection
- **SC-007**: Canvas maintains 60fps performance during zoom/pan/drag gestures with up to 50 nodes visible
- **SC-008**: Users can define a new custom token in text editor and see it appear in style panel within one reload cycle
- **SC-009**: Recent files list accurately displays last 5 opened files and allows one-click reopening
- **SC-010**: File save operation completes in under 1 second for files with up to 100 nodes, with visual feedback (● → ✓ indicator)

### Assumptions

- Users have modern web browsers with File System Access API support (Chrome/Edge 86+, Safari 15.2+, not IE)
- Users understand basic markdown syntax if they want to edit files manually (target audience: developers, knowledge workers)
- .knotly.md files are stored locally on user's device; no cloud storage or sync (explicit constraint)
- Token names follow CSS-like naming convention (lowercase with hyphens); users editing YAML understand this pattern
- Default token library provides sufficient variety for 80% of use cases; power users can define custom tokens
- Browser localStorage is available and persistent for storing recent files list
- Rough.js library performance is acceptable for rendering up to 100 nodes/edges simultaneously
- File permissions on user's OS allow reading/writing .knotly.md files in user-selected directories
