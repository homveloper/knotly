import { useRef, useState, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { useCanvasStore } from '../store/canvasStore';
import { NodeComponent } from './NodeComponent';
import { EdgeComponent } from './EdgeComponent';
import { GridBackground } from './GridBackground';

/**
 * Canvas Component - Read-only SVG visualization for markdown mind map
 *
 * Renders a read-only SVG canvas for visualizing markdown mind maps with zoom/pan navigation.
 * All editing is done via MarkdownEditor (Feature 004).
 *
 * Features:
 * - Subscribes to Zustand store for nodes, edges, and canvas state (zoom, pan)
 * - Maps over nodes and edges arrays to render components
 * - Applies zoom and pan transforms to canvas group
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
 * - NodeComponents: rendered last (above everything, read-only)
 *
 * Rendering Order (bottom to top):
 * 1. Grid background (20px spacing, gray lines)
 * 2. Edges/links (dashed lines between nodes)
 * 3. Nodes (circles with text content, read-only)
 *
 * Gesture Intent Detection:
 * - Pinch: detect when fingers move apart/together >10px
 * - Pan: detect when parallel movement >15px with 2+ touches
 *
 * Performance:
 * - Selector subscriptions minimize re-renders
 * - Grid uses useMemo to prevent line re-creation
 * - Edges render efficiently with rough.js seeding
 *
 * Note: Canvas is read-only. No node creation, dragging, or editing.
 * Layout controlled via markdown comments in MarkdownEditor.
 */

export const Canvas: React.FC = () => {
  // Subscribe to store state with selectors (read-only)
  // Using specific selectors to minimize re-renders
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const zoom = useCanvasStore((state) => state.zoom);
  const pan = useCanvasStore((state) => state.pan);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setPan = useCanvasStore((state) => state.setPan);

  // SVG ref for gesture binding
  const svgRef = useRef<SVGSVGElement>(null);

  // ViewBox size state - dynamically set to actual SVG container size
  const [viewBoxSize, setViewBoxSize] = useState({ width: 1000, height: 1000 });

  // Measure actual SVG size and update viewBox
  useEffect(() => {
    const measureSize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setViewBoxSize({ width: rect.width, height: rect.height });
      }
    };

    // Initial measurement
    measureSize();

    // Listen for resize events
    const resizeObserver = new ResizeObserver(measureSize);
    if (svgRef.current) {
      resizeObserver.observe(svgRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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

  return (
    <svg
      ref={svgRef}
      {...bind()}
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewBoxSize.width} ${viewBoxSize.height}`}
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
        {/* Dashed lines connecting nodes */}
        {edges.map((edge) => (
          <EdgeComponent key={edge.id} edge={edge} />
        ))}

        {/* Render all nodes from store - rendered last so they appear on top */}
        {/* Each node is read-only (no dragging, no editing) */}
        {nodes.map((node) => (
          <NodeComponent key={node.id} node={node} />
        ))}
      </g>
    </svg>
  );
};
