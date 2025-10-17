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
  style: {
    backgroundColor: string; // Hex color: '#FFE082' (yellow), '#90CAF9' (sky blue), '#A5D6A7' (mint)
    strokeColor: string; // Border color, default '#000'
    strokeWidth: number; // Border thickness in pixels, default 2
  };

  // Metadata
  createdAt: number; // Unix timestamp in milliseconds
  updatedAt: number; // Unix timestamp in milliseconds, updated on content/style changes
}

/**
 * Represents a directional connection between two nodes
 * - Stored directionally (from → to) for data modeling
 * - Rendered as bidirectional dashed lines with no arrow heads
 * - Links transform isolated nodes into an interconnected graph structure
 */
export interface Edge {
  // Identity
  id: string; // UUID v4 for global uniqueness

  // Topology
  fromId: string; // Source node ID (must reference existing Node)
  toId: string; // Target node ID (must reference existing Node)

  // Visual Style
  lineStyle: 'dashed'; // Line pattern (only dashed in this phase, future: solid, curved, arrow)

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

  // === Node Actions ===
  /** Create new node at canvas position with default style (yellow background) */
  createNode: (position: { x: number; y: number }) => void;

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
}
