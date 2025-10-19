// Canvas helper utilities for node/edge calculations

import type { Node, TokenDefinitions } from '../types/canvas';
import { parseTokens } from './tokenParser';

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

/**
 * Estimate node size based on content length
 * Used as initial size before DOM measurement
 *
 * @param content - Text content of node
 * @param fontSize - Font size in pixels
 * @returns Estimated {width, height} in pixels
 */
export function estimateNodeSize(
  content: string,
  fontSize: number
): { width: number; height: number } {
  if (!content || content.trim() === '') {
    // Empty content: minimum size
    return { width: 100, height: 60 };
  }

  const lines = content.split('\n');
  const maxLineLength = Math.max(...lines.map((l) => l.length), 5);
  const lineCount = Math.max(lines.length, 1);

  // Average character width: ~0.6em for mixed Korean/English
  const charWidth = fontSize * 0.6;
  const lineHeight = fontSize * 1.5;

  const estimatedWidth = maxLineLength * charWidth + 20;
  const estimatedHeight = lineCount * lineHeight + 20;

  return {
    width: estimatedWidth,
    height: estimatedHeight,
  };
}

/**
 * Calculate the center point of a node
 * Parses node style tokens to get width/height, then calculates center
 *
 * @param node - Node to calculate center for
 * @param tokenDefinitions - Token library for parsing style
 * @returns Center coordinates {x, y} in canvas space
 */
export function getNodeCenter(
  node: Node,
  tokenDefinitions: TokenDefinitions
): { x: number; y: number } {
  // Use measured size if available, otherwise estimate
  let width: number;
  let height: number;

  if (node.measuredSize) {
    width = node.measuredSize.width;
    height = node.measuredSize.height;
  } else {
    // Estimate from content
    const parsedStyle = parseTokens(node.style, tokenDefinitions);
    const fontSize = parsedStyle.fontSize || 16;
    const estimated = estimateNodeSize(node.content, fontSize);
    width = estimated.width;
    height = estimated.height;
  }

  // Calculate center from top-left position
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}

