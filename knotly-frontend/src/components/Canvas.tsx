import { useRef, useState } from 'react';
import { useGesture } from '@use-gesture/react';
import { useCanvasStore } from '../store/canvasStore';
import { NodeComponent } from './NodeComponent';
import { EdgeComponent } from './EdgeComponent';
import { GridBackground } from './GridBackground';
import { getNodeCenter } from '../utils/canvasHelpers';
import { useLinkMode } from './LinkModeButton';

/**
 * Canvas Component - Interactive SVG canvas for graph editor
 *
 * Renders an interactive SVG canvas for the graph editor with full support for nodes, edges, grid, and navigation.
 *
 * Features:
 * - Subscribes to Zustand store for nodes, edges, and canvas state (zoom, pan)
 * - Maps over nodes and edges arrays to render components
 * - Applies zoom and pan transforms to canvas group
 * - Provides infinite canvas support
 * - Touch gesture handling:
 *   - Pinch gesture: zoom in/out (0.5x - 3.0x range)
 *   - Two-finger pan: move viewport
 * - Gesture intent detection to disambiguate overlapping gestures
 *
 * Architecture:
 * - SVG root: gesture bindings attached here
 * - Transform group: applies zoom and pan to all content
 * - GridBackground: rendered first (beneath all content)
 * - EdgeComponents: rendered second (beneath nodes but above grid)
 * - NodeComponents: rendered last (above everything)
 *
 * Rendering Order (bottom to top):
 * 1. Grid background (20px spacing, gray lines)
 * 2. Edges/links (dashed lines between nodes)
 * 3. Nodes (circles with text content)
 *
 * Gesture Intent Detection:
 * - Pinch: detect when fingers move apart/together >10px
 * - Pan: detect when parallel movement >15px with 2+ touches
 * - Prevents conflict between single-finger node drag and two-finger pan
 *
 * Performance:
 * - Selector subscriptions minimize re-renders
 * - Grid uses useMemo to prevent line re-creation
 * - Edges render efficiently with rough.js seeding
 */

export const Canvas: React.FC = () => {
  // Subscribe to store state with selectors
  // Using specific selectors to minimize re-renders
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const zoom = useCanvasStore((state) => state.zoom);
  const pan = useCanvasStore((state) => state.pan);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const editingNodeId = useCanvasStore((state) => state.editingNodeId);
  const connectingFrom = useCanvasStore((state) => state.connectingFrom);
  const tokenDefinitions = useCanvasStore((state) => state.tokenDefinitions);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setPan = useCanvasStore((state) => state.setPan);
  const createNode = useCanvasStore((state) => state.createNode);
  const setSelectedNode = useCanvasStore((state) => state.setSelectedNode);
  const setEditingNode = useCanvasStore((state) => state.setEditingNode);

  // Link mode state for cancellation on canvas click
  const { cancelConnectMode } = useLinkMode();

  // Track mouse position for temporary connection line (T068)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // SVG ref for gesture binding
  const svgRef = useRef<SVGSVGElement>(null);

  // Click timer ref for double-click detection
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gesture intent detection state
  const gestureStateRef = useRef({
    initialDistance: 0,
    initialScale: 1,
    panStartX: 0,
    panStartY: 0,
  });

  // Pinch gesture handler (zoom control)
  const handlePinch = ({ offset: [scale] }: any) => {
    // offset[0] is the scale multiplier from the pinch gesture
    // Clamp to valid zoom range (0.5x - 3.0x)
    const newZoom = Math.max(0.5, Math.min(3.0, scale));
    setZoom(newZoom);
  };

  // Drag gesture handler (two-finger pan)
  const handleDrag = ({ touches, delta: [dx, dy], first }: any) => {
    // Only pan if 2 or more fingers detected (two-finger pan)
    if (touches && touches < 2) {
      return;
    }

    // Check gesture intent: movement >15px indicates pan intent
    if (first) {
      // Starting new gesture - store initial position
      gestureStateRef.current.panStartX = 0;
      gestureStateRef.current.panStartY = 0;
    }

    // Accumulate movement
    gestureStateRef.current.panStartX += dx;
    gestureStateRef.current.panStartY += dy;

    const totalDistance = Math.sqrt(
      gestureStateRef.current.panStartX ** 2 + gestureStateRef.current.panStartY ** 2
    );

    // Only apply pan if intent threshold exceeded (>15px total movement)
    if (totalDistance > 15) {
      // Update pan position
      setPan({
        x: pan.x + dx,
        y: pan.y + dy,
      });
    }
  };

  // Bind gesture handlers to SVG element
  const bind = useGesture({
    onPinch: handlePinch,
    onDrag: handleDrag,
  });

  // Double-click handler: create new node with auto-connect
  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only handle if clicking empty canvas (not a node or child element)
    if (e.target !== e.currentTarget) {
      return;
    }

    // IMPORTANT: Cancel single-click timer to prevent deselection
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    // Priority 1: Exit editing mode if active
    if (editingNodeId) {
      setEditingNode(null);
      // Continue to create new node after exiting editing mode
    }

    // Get click position in screen coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Transform to canvas coordinates (account for pan and zoom)
    const canvasX = (screenX - pan.x) / zoom;
    const canvasY = (screenY - pan.y) / zoom;

    // Create node at click position, auto-connect to selected node
    // selectedNodeId is preserved because timer was cancelled
    createNode({ x: canvasX, y: canvasY }, selectedNodeId);
  };

  // Mouse move handler: track cursor position for temporary connection line (T068)
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!connectingFrom) {
      setMousePos(null);
      return;
    }

    // Get mouse position in screen coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Transform to canvas coordinates (account for pan and zoom)
    const canvasX = (screenX - pan.x) / zoom;
    const canvasY = (screenY - pan.y) / zoom;

    setMousePos({ x: canvasX, y: canvasY });
  };

  // Handle external click to deselect nodes
  // Uses timer to distinguish between single click and double-click
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only handle if clicking empty canvas (not a node or child element)
    if (e.target === e.currentTarget) {
      // Clear existing timer
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }

      // Set timer for 300ms - will be cancelled if double-click occurs
      clickTimerRef.current = setTimeout(() => {
        // Priority 1: Exit editing mode if active
        if (editingNodeId) {
          setEditingNode(null);
        }
        // Priority 2: Deselect node (only if NOT double-clicking)
        setSelectedNode(null);

        // Priority 3: Cancel connect mode if active
        cancelConnectMode();

        clickTimerRef.current = null;
      }, 300);
    }
  };

  return (
    <svg
      ref={svgRef}
      {...bind()}
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      width="100%"
      height="100%"
      viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      className="touch-none"
      style={{
        background: '#fafafa',
        display: 'block',
        touchAction: 'none', // Prevent default touch behaviors
      }}
    >
      {/* Main canvas group with zoom and pan transforms */}
      {/* Transform order: translate applied first, then scale */}
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {/* Grid background - rendered first so it appears beneath all content */}
        <GridBackground width={2000} height={2000} spacing={20} />

        {/* Edges/links - rendered after grid but before nodes so they appear beneath nodes */}
        {/* Dashed lines connecting nodes, selected edge highlighted in blue */}
        {edges.map((edge) => (
          <EdgeComponent key={edge.id} edge={edge} />
        ))}

        {/* T068: Temporary connection line when in connecting mode */}
        {connectingFrom && mousePos && (() => {
          const sourceNode = nodes.find((n) => n.id === connectingFrom);
          if (!sourceNode) return null;

          // Calculate center of source node for connection line
          const sourceCenter = getNodeCenter(sourceNode, tokenDefinitions);

          return (
            <line
              x1={sourceCenter.x}
              y1={sourceCenter.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5,5"
              opacity={0.6}
              style={{
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="10"
                dur="0.5s"
                repeatCount="indefinite"
              />
            </line>
          );
        })()}

        {/* Render all nodes from store - rendered last so they appear on top */}
        {/* Each node is a 120px circle with text content, draggable, and editable */}
        {nodes.map((node) => (
          <NodeComponent key={node.id} node={node} />
        ))}
      </g>
    </svg>
  );
};
