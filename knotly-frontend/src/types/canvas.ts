// Type definitions for Interactive Graph Editor canvas state and entities
// Based on data-model.md specification

/**
 * Represents a single idea or concept in the mind map
 * - Stored with position coordinates in canvas space (not screen pixels)
 * - Rendered as 120px diameter circle with hand-drawn appearance
 * - Text content wraps within circle with vertical scrolling for overflow
 */
export interface Node {
  // Identity
  id: string; // UUID v4 for global uniqueness

  // Positioning
  position: {
    x: number; // Canvas x-coordinate (can be negative for infinite canvas)
    y: number; // Canvas y-coordinate (can be negative for infinite canvas)
  };

  // Content
  content: string; // User-entered text (unlimited length, wrapped with scroll)

  // Visual Style
  type: 'circle'; // Shape type (only circles in this phase, future: rectangle, cloud, etc)
  style: string; // Space-separated token names (e.g., "color-yellow h4 neat")

  // Cached Measurements (optional, for performance)
  measuredSize?: {
    width: number; // Measured width from DOM (includes content + padding)
    height: number; // Measured height from DOM (includes content + padding)
  };

  // Metadata
  createdAt: number; // Unix timestamp in milliseconds
  updatedAt: number; // Unix timestamp in milliseconds, updated on content/style changes
}

/**
 * Represents a directional connection between two nodes
 * - Stored directionally (from → to) for data modeling
 * - Rendered as bidirectional lines with hand-drawn appearance (rough.js)
 * - Links transform isolated nodes into an interconnected graph structure
 */
export interface Edge {
  // Identity
  id: string; // UUID v4 for global uniqueness

  // Topology
  fromId: string; // Source node ID (must reference existing Node)
  toId: string; // Target node ID (must reference existing Node)

  // Visual Style
  lineStyle: 'solid' | 'dashed'; // Line pattern (rendered with rough.js)

  // Metadata
  createdAt: number; // Unix timestamp in milliseconds
}

/**
 * Represents the viewport and navigation state of the infinite canvas
 * - Maintains zoom level for magnification control (0.5x-3.0x range)
 * - Maintains pan offset for viewport translation
 * - Stores grid settings for display and snapping preferences
 */
export interface CanvasState {
  // Navigation
  zoom: number; // Zoom level, clamped to range [0.5, 3.0], default 1.0 (100%)
  pan: {
    x: number; // Horizontal pan offset in canvas coordinates
    y: number; // Vertical pan offset in canvas coordinates
  };

  // Grid Settings
  gridEnabled: boolean; // Show/hide grid background with 20px spacing
  snapEnabled: boolean; // Enable/disable snap-to-grid on node movement (20px intervals)
}

/**
 * Complete Zustand store interface combining all entities and actions
 * Manages canvas state immutably using Zustand's set() pattern
 */
export interface CanvasStore {
  // Domain Entities
  nodes: Node[];
  edges: Edge[];

  // Canvas State
  zoom: number;
  pan: { x: number; y: number };
  gridEnabled: boolean;
  snapEnabled: boolean;
  selectedEdgeId: string | null; // Current selected edge for visual highlighting
  selectedNodeId: string | null; // Current selected node for auto-connect workflow
  editingNodeId: string | null; // Node currently being edited (text input active)
  connectingFrom: string | null; // Node ID when in drag-to-connect mode

  // File Management State
  tokenDefinitions: TokenDefinitions; // Current token library (DEFAULT_TOKENS + custom)
  currentFilePath: string | null; // Filename or null for unsaved notes
  currentFileHandle: FileSystemFileHandle | null; // File handle for save operations
  hasUnsavedChanges: boolean; // Track dirty state for unsaved changes indicator
  recentFiles: string[]; // Last 5 opened file paths (persisted in localStorage)

  // Markdown Editor State (Feature 004)
  layout: 'radial' | 'horizontal'; // Current layout type for mind map
  markdown: string; // Current markdown text
  splitRatio: number[]; // Split pane ratio [leftPercent, rightPercent]

  // === Node Actions ===
  /** Create new node at canvas position, optionally auto-connect to selected node */
  createNode: (position: { x: number; y: number }, selectedNodeId?: string | null) => void;

  /** Update node fields (content, style, type, position) */
  updateNode: (id: string, updates: Partial<Omit<Node, 'id' | 'createdAt'>>) => void;

  /** Move node to new position (applies grid snapping if enabled) */
  moveNode: (id: string, position: { x: number; y: number }) => void;

  /** Delete node (cascade-deletes all connected edges) */
  deleteNode: (id: string) => void;

  // === Edge Actions ===
  /** Create new edge connecting two nodes */
  createEdge: (fromId: string, toId: string) => void;

  /** Delete edge by ID */
  deleteEdge: (id: string) => void;

  /** Select edge for visual highlighting (null to clear) */
  selectEdge: (id: string | null) => void;

  // === Canvas Actions ===
  /** Set zoom level (clamped to 0.5-3.0) */
  setZoom: (zoom: number) => void;

  /** Set pan offset for viewport translation */
  setPan: (pan: { x: number; y: number }) => void;

  /** Toggle grid background visibility */
  toggleGrid: () => void;

  /** Toggle snap-to-grid behavior */
  toggleSnap: () => void;

  // === Node Selection Actions ===
  /** Set selected node (for auto-connect workflow) */
  setSelectedNode: (id: string | null) => void;

  /** Set editing node (activate text input) */
  setEditingNode: (id: string | null) => void;

  /** Set connecting mode (drag-to-connect) */
  setConnectingFrom: (id: string | null) => void;

  /** Set split ratio for editor/canvas panes (Feature 004 - Phase 6) */
  setSplitRatio: (ratio: number[]) => void;

  /** Set layout and recalculate node positions (Feature 004 - Phase 7) */
  setLayout: (layout: 'radial' | 'horizontal') => void;

  /** Re-apply current layout to nodes (Feature 004 - Phase 7) */
  applyCurrentLayout: () => void;

  // === File Management Actions ===
  /** Mark canvas as having unsaved changes */
  markDirty: () => void;

  /** Add file to recent files list (max 5, persisted to localStorage) */
  addRecentFile: (filePath: string) => void;

  /** Save canvas state to file (creates new file if handle is null) */
  saveFile: (fileHandle?: FileSystemFileHandle | null) => Promise<void>;

  /** Load canvas state from file */
  loadFile: (fileHandle: FileSystemFileHandle | File) => Promise<void>;

  /** Initialize new note with default tokens */
  newNote: () => void;
}

/**
 * Token definitions mapping token names to style properties or composite references
 * Used by the token parser to resolve style strings like "color-blue h4 neat"
 */
export type TokenDefinitions = {
  [tokenName: string]: StyleObject | string;
};

/**
 * Style properties that can be applied to a node via tokens
 * Atomic tokens define these properties directly
 * Composite tokens reference other tokens (resolved recursively)
 */
export interface StyleObject {
  stroke?: string; // CSS color for outline
  fill?: string; // CSS color for background
  strokeWidth?: number; // Line thickness (1-10px)
  width?: number; // Node width (80-400px)
  height?: number; // Node height (60-300px)
  fontSize?: number; // Text size (10-32px)
  fontWeight?: number; // Text weight (100-900)
  roughness?: number; // Hand-drawn feel (0=smooth, 3=very rough)
  shape?: string; // Shape type (none, rect, circle, rounded)
}
