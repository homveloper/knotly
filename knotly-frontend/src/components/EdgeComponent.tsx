import { useCanvasStore } from '../store/canvasStore';
import type { Edge } from '../types/canvas';
import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

/**
 * EdgeComponent - Renders a hand-drawn dashed connection line between two nodes
 *
 * Features:
 * - Finds fromNode and toNode by ID from store
 * - Calculates line endpoints from circle edges (not centers)
 * - Renders with rough.js using edge.id as seed for consistency
 * - Stroke color: gray (#999) by default, blue (#2196F3) when selected
 * - onClick selects the edge (highlights in blue)
 * - Long-press (500ms) deletes the edge
 * - Line pattern: dashed [5,5] per specification
 *
 * Performance:
 * - useRef for SVG element to avoid re-renders
 * - useEffect only re-renders when nodes, selection state, or edge changes
 *
 * Edge Cases:
 * - Returns null if fromNode or toNode doesn't exist (prevents rendering broken edges)
 * - Handles zero-distance edges (prevents division by zero)
 */

interface EdgeComponentProps {
  edge: Edge;
}

const NODE_RADIUS = 60; // 120px diameter circle radius

export const EdgeComponent: React.FC<EdgeComponentProps> = ({ edge }) => {
  // Store subscriptions
  const nodes = useCanvasStore((state) => state.nodes);
  const selectedEdgeId = useCanvasStore((state) => state.selectedEdgeId);
  const selectEdge = useCanvasStore((state) => state.selectEdge);
  const deleteEdge = useCanvasStore((state) => state.deleteEdge);

  // Long-press state
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(
    null
  );

  // SVG ref for rough.js rendering
  const svgRef = useRef<SVGSVGElement>(null);

  // Find the nodes this edge connects
  const fromNode = nodes.find((n) => n.id === edge.fromId);
  const toNode = nodes.find((n) => n.id === edge.toId);

  // Don't render if nodes don't exist
  if (!fromNode || !toNode) {
    return null;
  }

  // Calculate vector from fromNode to toNode
  const dx = toNode.position.x - fromNode.position.x;
  const dy = toNode.position.y - fromNode.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Edge case: prevent division by zero for same-position nodes
  if (distance === 0) {
    return null;
  }

  // Calculate line endpoints at circle edges (not at centers)
  // Direction vector: (dx/distance, dy/distance)
  // Start: fromNode center + direction * radius
  // End: toNode center - direction * radius
  const startX = fromNode.position.x + (dx / distance) * NODE_RADIUS;
  const startY = fromNode.position.y + (dy / distance) * NODE_RADIUS;
  const endX = toNode.position.x - (dx / distance) * NODE_RADIUS;
  const endY = toNode.position.y - (dy / distance) * NODE_RADIUS;

  // Generate seed from edge ID for consistent rough.js rendering
  // Same algorithm as NodeComponent: hash the ID string to get deterministic seed
  let hash = 0;
  for (let i = 0; i < edge.id.length; i++) {
    const char = edge.id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  const seed = Math.abs(hash);

  // Render using rough.js when selection state or positions change
  useEffect(() => {
    if (!svgRef.current) return;

    // Create rough.js instance with seed for consistent rendering
    const rc = rough.svg(svgRef.current);

    // Determine stroke color based on selection
    const isSelected = selectedEdgeId === edge.id;
    const strokeColor = isSelected ? '#2196F3' : '#999999';
    const strokeWidth = isSelected ? 3 : 2;

    // Draw dashed line with rough.js
    const line = rc.line(startX, startY, endX, endY, {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      strokeLineDash: [5, 5],
      seed: seed,
    });

    // Clear and append the line
    svgRef.current.innerHTML = '';
    svgRef.current.appendChild(line);
  }, [selectedEdgeId, edge.id, startX, startY, endX, endY, seed]);

  // Handle edge selection on click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent canvas click
    selectEdge(edge.id);
  };

  // Handle long-press for edge deletion
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const timer = setTimeout(() => {
      deleteEdge(edge.id);
      setLongPressTimer(null);
    }, 500); // 500ms long-press threshold
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <g
      ref={svgRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'pointer' }}
    />
  );
};
