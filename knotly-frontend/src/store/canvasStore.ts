import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Node, Edge, CanvasStore } from '../types/canvas';

/**
 * Zustand Canvas Store
 *
 * Central state management for the interactive graph editor.
 * Manages:
 * - Node array with CRUD operations
 * - Edge array with CRUD operations
 * - Canvas state (zoom, pan, grid settings)
 *
 * All mutations are immutable using Zustand's set() pattern with spread operators.
 * No persistence middleware - data lost on page refresh (client-side only per spec).
 */

export const useCanvasStore = create<CanvasStore>((set) => ({
  // ============================================
  // Initial State
  // ============================================
  nodes: [],
  edges: [],
  zoom: 1, // Default 100% zoom
  pan: { x: 0, y: 0 }, // Default no pan
  gridEnabled: false, // Grid hidden by default
  snapEnabled: false, // Snap disabled by default
  selectedEdgeId: null, // No edge selected initially

  // ============================================
  // Node Actions
  // ============================================

  /**
   * Create a new node at the specified canvas position
   * - Generates UUID for global uniqueness
   * - Applies grid snapping if enabled
   * - Sets default yellow style
   * - Records creation timestamp
   */
  createNode: (position) =>
    set((state) => {
      // Apply grid snapping if enabled
      const snappedPosition = state.snapEnabled
        ? {
            x: Math.round(position.x / 20) * 20,
            y: Math.round(position.y / 20) * 20,
          }
        : position;

      const newNode: Node = {
        id: uuidv4(),
        position: snappedPosition,
        content: '', // Empty initially, user will edit
        type: 'circle',
        style: {
          backgroundColor: '#FFE082', // Default yellow
          strokeColor: '#000',
          strokeWidth: 2,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return {
        nodes: [...state.nodes, newNode],
      };
    }),

  /**
   * Update node fields (content, style, position, type)
   * Cannot update: id (immutable), createdAt (immutable)
   * Automatically updates the updatedAt timestamp
   */
  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, ...updates, updatedAt: Date.now() }
          : node
      ),
    })),

  /**
   * Move node to new position
   * Applies grid snapping if snapEnabled is true (rounds to nearest 20px)
   * Updates position only, leaves other fields intact
   */
  moveNode: (id, position) =>
    set((state) => {
      // Apply grid snapping if enabled
      const finalPosition = state.snapEnabled
        ? {
            x: Math.round(position.x / 20) * 20,
            y: Math.round(position.y / 20) * 20,
          }
        : position;

      return {
        nodes: state.nodes.map((node) =>
          node.id === id
            ? { ...node, position: finalPosition, updatedAt: Date.now() }
            : node
        ),
      };
    }),

  /**
   * Delete node and cascade-delete all connected edges
   * - Removes node from nodes array
   * - Removes all edges where fromId or toId matches this node
   * - Maintains referential integrity
   */
  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.fromId !== id && edge.toId !== id
      ),
    })),

  // ============================================
  // Edge Actions
  // ============================================

  /**
   * Create new edge connecting two nodes
   * - Generates UUID for global uniqueness
   * - No validation of node existence (deferred to production)
   * - Always uses dashed line style
   * - Records creation timestamp
   */
  createEdge: (fromId, toId) =>
    set((state) => {
      const newEdge: Edge = {
        id: uuidv4(),
        fromId,
        toId,
        lineStyle: 'dashed',
        createdAt: Date.now(),
      };

      return {
        edges: [...state.edges, newEdge],
      };
    }),

  /**
   * Delete edge by ID
   * Removes from edges array by matching ID
   */
  deleteEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
    })),

  /**
   * Select edge for visual highlighting
   * Sets selectedEdgeId to provided ID or null to clear
   */
  selectEdge: (id) =>
    set({
      selectedEdgeId: id,
    }),

  // ============================================
  // Canvas Navigation Actions
  // ============================================

  /**
   * Set zoom level
   * Clamped to range [0.5, 3.0] to maintain usability
   * 0.5 = 50% zoom out (see overview)
   * 1.0 = 100% (default)
   * 3.0 = 300% zoom in (see detail)
   */
  setZoom: (zoom) =>
    set({
      zoom: Math.max(0.5, Math.min(3.0, zoom)),
    }),

  /**
   * Set pan offset for viewport translation
   * No clamping - infinite canvas support
   * Pan is in canvas coordinates, not screen pixels
   */
  setPan: (pan) =>
    set({
      pan,
    }),

  // ============================================
  // Grid Settings Actions
  // ============================================

  /**
   * Toggle grid background visibility
   * Only affects visual rendering, not snapping
   */
  toggleGrid: () =>
    set((state) => ({
      gridEnabled: !state.gridEnabled,
    })),

  /**
   * Toggle snap-to-grid behavior
   * When enabled: nodes snap to 20px grid intersections on move/create
   * Only affects moveNode and createNode actions
   * Independent of gridEnabled (grid can be hidden but snap enabled)
   */
  toggleSnap: () =>
    set((state) => ({
      snapEnabled: !state.snapEnabled,
    })),
}));

/**
 * Zustand Store Documentation
 *
 * Usage in Components:
 *
 * 1. Subscribe to full state (re-renders on any change):
 *    const state = useCanvasStore();
 *
 * 2. Subscribe to specific fields (selective re-render):
 *    const nodes = useCanvasStore((state) => state.nodes);
 *    const zoom = useCanvasStore((state) => state.zoom);
 *
 * 3. Subscribe to multiple fields:
 *    const { nodes, edges, zoom } = useCanvasStore((state) => ({
 *      nodes: state.nodes,
 *      edges: state.edges,
 *      zoom: state.zoom,
 *    }));
 *
 * 4. Call actions:
 *    const { createNode, deleteNode } = useCanvasStore();
 *    createNode({ x: 100, y: 100 });
 *    deleteNode('node-id-123');
 *
 * Performance Considerations:
 * - Zustand uses shallow comparison for selector changes
 * - Component re-renders only when selected fields change
 * - Use specific selectors to minimize unnecessary re-renders
 * - Grid rendering uses useMemo to prevent line re-creation
 *
 * Immutability Rules:
 * - ALL updates use spread operators or map/filter
 * - NEVER mutate state directly: state.nodes.push(x) ❌
 * - ALWAYS create new objects: [...state.nodes, newNode] ✅
 *
 * State Persistence:
 * - Currently no persistence middleware (data lost on refresh)
 * - Future: Can add persist() middleware from Zustand for localStorage
 * - Per spec: Client-side only, no backend persistence in this phase
 */
