import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Node, Edge, CanvasStore } from '../types/canvas';
import { DEFAULT_TOKENS } from '../utils/tokenParser';
import { saveKnotlyFile, loadKnotlyFile } from '../utils/fileIO';
import type { NodeMetadata, EdgeTuple } from '../types/fileIO';

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

export const useCanvasStore = create<CanvasStore>((set, get) => ({
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
  selectedNodeId: null, // No node selected initially
  editingNodeId: null, // No node being edited initially
  connectingFrom: null, // Not in connecting mode initially

  // File Management State
  tokenDefinitions: DEFAULT_TOKENS,
  currentFilePath: null,
  currentFileHandle: null,
  hasUnsavedChanges: false,
  recentFiles: JSON.parse(localStorage.getItem('knotly-recent-files') || '[]'),

  // Markdown Editor State (Feature 004)
  layout: 'radial' as 'radial' | 'horizontal', // Default to radial layout
  markdown: '', // Current markdown text

  // ============================================
  // Node Actions
  // ============================================

  /**
   * Create a new node at the specified canvas position
   * - Generates UUID for global uniqueness
   * - Applies grid snapping if enabled
   * - Sets default token-based style "color-yellow h4 neat"
   * - Auto-creates edge if selectedNodeId is provided
   * - Activates text editing on new node
   * - Records creation timestamp
   * - Marks canvas as dirty (unsaved changes)
   */
  createNode: (position, selectedNodeId) => {
    const state = get();
    // Apply grid snapping if enabled
    let snappedPosition = state.snapEnabled
      ? {
          x: Math.round(position.x / 20) * 20,
          y: Math.round(position.y / 20) * 20,
        }
      : position;

    // T090: Clamp position to prevent extreme coordinates (±10,000 pixels)
    snappedPosition = {
      x: Math.max(-10000, Math.min(10000, snappedPosition.x)),
      y: Math.max(-10000, Math.min(10000, snappedPosition.y)),
    };

    const newNode: Node = {
      id: uuidv4(),
      position: snappedPosition,
      content: '', // Empty initially, user will edit
      type: 'circle',
      style: 'h4', // Minimal style: size only, no shape or color
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Auto-create edge if selectedNodeId is provided
    const newEdges = [...state.edges];
    if (selectedNodeId && state.nodes.find((n) => n.id === selectedNodeId)) {
      const newEdge: Edge = {
        id: uuidv4(),
        fromId: selectedNodeId,
        toId: newNode.id,
        lineStyle: 'solid',
        createdAt: Date.now(),
      };
      newEdges.push(newEdge);
    }

    set({
      nodes: [...state.nodes, newNode],
      edges: newEdges,
      selectedNodeId: newNode.id, // Select new node for chaining
      editingNodeId: newNode.id, // Activate text editing immediately
      hasUnsavedChanges: true,
    });
  },

  /**
   * Update node fields (content, style, position, type)
   * Cannot update: id (immutable), createdAt (immutable)
   * Automatically updates the updatedAt timestamp
   * Marks canvas as dirty (unsaved changes)
   */
  updateNode: (id, updates) =>
    set((state) => {
      // T091: Warn if content is very large (>5000 chars)
      if (updates.content && updates.content.length > 5000) {
        console.warn(
          `Node content is very large (${updates.content.length} characters). ` +
            'This may impact performance. Consider splitting into multiple nodes.'
        );
      }

      return {
        nodes: state.nodes.map((node) =>
          node.id === id
            ? { ...node, ...updates, updatedAt: Date.now() }
            : node
        ),
        hasUnsavedChanges: true,
      };
    }),

  /**
   * Move node to new position
   * Applies grid snapping if snapEnabled is true (rounds to nearest 20px)
   * Updates position only, leaves other fields intact
   * Marks canvas as dirty (unsaved changes)
   */
  moveNode: (id, position) =>
    set((state) => {
      // Apply grid snapping if enabled
      let finalPosition = state.snapEnabled
        ? {
            x: Math.round(position.x / 20) * 20,
            y: Math.round(position.y / 20) * 20,
          }
        : position;

      // T090: Clamp position to prevent extreme coordinates (±10,000 pixels)
      finalPosition = {
        x: Math.max(-10000, Math.min(10000, finalPosition.x)),
        y: Math.max(-10000, Math.min(10000, finalPosition.y)),
      };

      return {
        nodes: state.nodes.map((node) =>
          node.id === id
            ? { ...node, position: finalPosition, updatedAt: Date.now() }
            : node
        ),
        hasUnsavedChanges: true,
      };
    }),

  /**
   * Delete node and cascade-delete all connected edges
   * - Removes node from nodes array
   * - Removes all edges where fromId or toId matches this node
   * - Maintains referential integrity
   * - Marks canvas as dirty (unsaved changes)
   */
  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.fromId !== id && edge.toId !== id
      ),
      hasUnsavedChanges: true,
    })),

  // ============================================
  // Edge Actions
  // ============================================

  /**
   * Create new edge connecting two nodes
   * - Generates UUID for global uniqueness
   * - Validates both nodes exist
   * - Prevents self-loops (fromId === toId)
   * - Prevents duplicate edges
   * - Uses solid line style
   * - Records creation timestamp
   * - Marks canvas as dirty
   */
  createEdge: (fromId, toId) =>
    set((state) => {
      // Validation: Check both nodes exist
      const fromNode = state.nodes.find((n) => n.id === fromId);
      const toNode = state.nodes.find((n) => n.id === toId);
      if (!fromNode || !toNode) {
        console.warn('Cannot create edge: one or both nodes do not exist');
        return state;
      }

      // Validation: Prevent self-loops
      if (fromId === toId) {
        console.warn('Cannot create edge: self-loops not allowed');
        return state;
      }

      // Validation: Prevent duplicate edges (bidirectional check)
      const edgeExists = state.edges.some(
        (edge) =>
          (edge.fromId === fromId && edge.toId === toId) ||
          (edge.fromId === toId && edge.toId === fromId)
      );
      if (edgeExists) {
        console.warn('Cannot create edge: edge already exists');
        return state;
      }

      const newEdge: Edge = {
        id: uuidv4(),
        fromId,
        toId,
        lineStyle: 'solid',
        createdAt: Date.now(),
      };

      return {
        edges: [...state.edges, newEdge],
        hasUnsavedChanges: true,
      };
    }),

  /**
   * Delete edge by ID
   * Removes from edges array by matching ID
   * Marks canvas as dirty
   */
  deleteEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      hasUnsavedChanges: true,
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

  // ============================================
  // Node Selection Actions
  // ============================================

  /**
   * Set selected node (for auto-connect workflow)
   * Selected node is used when creating new nodes via double-click
   */
  setSelectedNode: (id) =>
    set({
      selectedNodeId: id,
    }),

  /**
   * Set editing node (activate text input)
   * Only one node can be edited at a time
   */
  setEditingNode: (id) =>
    set({
      editingNodeId: id,
    }),

  /**
   * Set connecting mode (drag-to-connect)
   * When set, user is dragging from this node to create an edge
   */
  setConnectingFrom: (id) =>
    set({
      connectingFrom: id,
    }),

  // ============================================
  // File Management Actions
  // ============================================

  /**
   * Mark canvas as having unsaved changes
   * Sets hasUnsavedChanges flag to true
   */
  markDirty: () =>
    set({
      hasUnsavedChanges: true,
    }),

  /**
   * Add a file to recent files list
   * Maintains max 5 entries, persists to localStorage
   * Moves file to top if already in list
   */
  addRecentFile: (filePath: string) => {
    const state = get();
    const recentFiles = [
      filePath,
      ...state.recentFiles.filter((f) => f !== filePath),
    ].slice(0, 5);
    localStorage.setItem('knotly-recent-files', JSON.stringify(recentFiles));
    set({ recentFiles });
  },

  /**
   * Save canvas state to .knotly.md file
   * Uses File System Access API with fallback to Blob download
   * Clears hasUnsavedChanges flag on success
   */
  saveFile: async (fileHandle) => {
    // T092: Performance monitoring
    performance.mark('saveFile-start');

    const state = get();

    // Prepare save data
    const nodes: NodeMetadata[] = state.nodes.map((node) => ({
      id: node.id,
      pos: [node.position.x, node.position.y] as [number, number],
      style: node.style,
    }));

    const edges: EdgeTuple[] = state.edges.map((edge) => [
      edge.fromId,
      edge.toId,
    ]);

    const nodeContents = new Map<string, string>();
    state.nodes.forEach((node) => {
      nodeContents.set(node.id, node.content);
    });

    const saveData = {
      tokens: state.tokenDefinitions,
      nodes,
      edges,
      nodeContents,
    };

    // Save file
    const result = await saveKnotlyFile(
      fileHandle || state.currentFileHandle,
      saveData
    );

    if (result.success) {
      // Update state with file handle and clear dirty flag
      set({
        currentFileHandle: result.data,
        currentFilePath: result.data.name,
        hasUnsavedChanges: false,
      });

      // Add to recent files
      get().addRecentFile(result.data.name);

      // T092: Measure performance
      performance.mark('saveFile-end');
      performance.measure('saveFile', 'saveFile-start', 'saveFile-end');
      const measure = performance.getEntriesByName('saveFile')[0];
      console.log(`File saved in ${measure.duration.toFixed(2)}ms`);
    } else {
      // T088: Enhanced error handling with user guidance
      console.error('Failed to save file:', result.error);

      // Check for permission errors
      if (result.error?.includes('permission') || result.error?.includes('write')) {
        alert(`Cannot save file: ${result.error}\n\nTry saving to a different location with File → Save As`);
      } else {
        alert(`Failed to save file: ${result.error}`);
      }
    }
  },

  /**
   * Load canvas state from .knotly.md file
   * Replaces current canvas state with loaded data
   */
  loadFile: async (fileHandle) => {
    // T092: Performance monitoring
    performance.mark('loadFile-start');

    const result = await loadKnotlyFile(fileHandle);

    if (!result.success) {
      console.error('Failed to load file:', result.error);
      return;
    }

    const { tokens, nodes: nodeMetadata, edges: edgeTuples, nodeContents } = result.data;

    // Convert loaded data to canvas state
    const nodes: Node[] = nodeMetadata.map((meta) => ({
      id: meta.id,
      position: { x: meta.pos[0], y: meta.pos[1] },
      content: nodeContents.get(meta.id) || '',
      type: 'circle' as const,
      style: meta.style,
      createdAt: Date.now(), // Preserve timestamps not stored in file
      updatedAt: Date.now(),
    }));

    const edges: Edge[] = edgeTuples.map((tuple) => ({
      id: uuidv4(),
      fromId: tuple[0],
      toId: tuple[1],
      lineStyle: 'solid' as const,
      createdAt: Date.now(),
    }));

    // Update store with loaded state
    const fileName = 'getFile' in fileHandle ? (await (fileHandle as FileSystemFileHandle).getFile()).name : (fileHandle as File).name;

    set({
      nodes,
      edges,
      tokenDefinitions: { ...DEFAULT_TOKENS, ...tokens },
      currentFileHandle: 'getFile' in fileHandle ? (fileHandle as FileSystemFileHandle) : null,
      currentFilePath: fileName,
      hasUnsavedChanges: false,
    });

    // Add to recent files
    get().addRecentFile(fileName);

    // T092 & T094: Measure performance and warn for large files
    performance.mark('loadFile-end');
    performance.measure('loadFile', 'loadFile-start', 'loadFile-end');
    const measure = performance.getEntriesByName('loadFile')[0];
    console.log(`File loaded in ${measure.duration.toFixed(2)}ms (${nodes.length} nodes)`);

    // T094: Warn if file is very large (>10,000 nodes)
    if (nodes.length > 10000) {
      console.warn(
        `Large file detected: ${nodes.length} nodes. ` +
          'Performance may be impacted. Consider splitting into smaller files.'
      );
      alert(
        `Warning: This file contains ${nodes.length} nodes.\n\n` +
          'Loading large files may impact performance. The application will continue to load.'
      );
    }
  },

  /**
   * Initialize new note with default tokens and empty state
   * Clears current canvas and file association
   * Sets currentFilePath to "Untitled Note" to trigger Canvas view
   */
  newNote: () =>
    set({
      nodes: [],
      edges: [],
      tokenDefinitions: DEFAULT_TOKENS,
      currentFilePath: 'Untitled Note',
      currentFileHandle: null,
      hasUnsavedChanges: false,
      zoom: 1,
      pan: { x: 0, y: 0 },
    }),
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
