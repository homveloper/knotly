// Canvas helper utilities for node/edge calculations

import type { Node } from '../types/canvas';

/**
 * Find node at a given canvas position
 * Used for drag-to-connect: when user drags from one node and releases over another
 *
 * @param nodes - Array of all nodes
 * @param x - Canvas x-coordinate
 * @param y - Canvas y-coordinate
 * @param excludeId - Optional node ID to exclude (e.g., the node being dragged from)
 * @returns Node at position, or null if no node found
 */
export function findNodeAtPosition(
  nodes: Node[],
  x: number,
  y: number,
  excludeId?: string
): Node | null {
  // Assume NODE_RADIUS = 60 (120px diameter)
  const NODE_RADIUS = 60;

  for (const node of nodes) {
    // Skip excluded node
    if (excludeId && node.id === excludeId) {
      continue;
    }

    // Calculate distance from position to node center
    const dx = x - node.position.x;
    const dy = y - node.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if position is within node radius
    if (distance <= NODE_RADIUS) {
      return node;
    }
  }

  return null;
}

/**
 * Calculate position on canvas from screen coordinates
 * Accounts for zoom and pan transformations
 *
 * @param screenX - Screen x-coordinate (from mouse/touch event)
 * @param screenY - Screen y-coordinate
 * @param rect - Bounding rect of SVG element
 * @param zoom - Current zoom level
 * @param pan - Current pan offset {x, y}
 * @returns Canvas coordinates {x, y}
 */
export function screenToCanvasCoords(
  screenX: number,
  screenY: number,
  rect: DOMRect,
  zoom: number,
  pan: { x: number; y: number }
): { x: number; y: number } {
  const relativeX = screenX - rect.left;
  const relativeY = screenY - rect.top;

  return {
    x: (relativeX - pan.x) / zoom,
    y: (relativeY - pan.y) / zoom,
  };
}
