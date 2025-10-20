/**
 * Layout Engine
 * Calculates node positions for radial and horizontal layouts
 *
 * Features (Constitution Principle VIII: Performance):
 * - O(n) radial layout using polar coordinates
 * - O(n) horizontal layout using level-based positioning
 * - Collision prevention using measuredSize-based spacing
 * - Result type pattern for error handling (Constitution Principle I)
 */

import type {
  MarkdownNode,
  Edge,
  LayoutType,
  LayoutError,
  Result,
} from '../types/markdown';
import { computeLevels } from './helpers';

/**
 * Layout constants
 */
export const LAYOUT_CONSTANTS = {
  RADIAL_CENTER: { x: 500, y: 500 }, // Center point for radial layout
  RADIAL_BASE_RADIUS: 200, // Base radius for first level
  RADIAL_LEVEL_SPACING: 150, // Additional radius per level
  HORIZONTAL_START: { x: 100, y: 100 }, // Starting point for horizontal layout
  HORIZONTAL_SPACING_X: 200, // Horizontal spacing between nodes
  HORIZONTAL_SPACING_Y: 120, // Vertical spacing between levels
  MIN_NODE_SPACING: 40, // Minimum padding between nodes
};

/**
 * T092-T093: Calculate radial positions for nodes
 * Places nodes in concentric circles around a center point
 *
 * Algorithm:
 * 1. Find root nodes (level 0)
 * 2. Position root at center (500, 500)
 * 3. For each level > 0, calculate radius based on level
 * 4. Distribute nodes evenly around circle using polar coordinates
 * 5. Collision prevention: ensure radius > totalNodesWidth / (2π)
 *
 * @returns Result with positioned nodes, or LayoutError if nodes missing measuredSize
 */
export function calculateRadialPositions(
  nodes: MarkdownNode[],
  edges: Edge[]
): Result<MarkdownNode[], LayoutError> {
  // Validate all nodes have measuredSize
  for (const node of nodes) {
    if (!node.measuredSize) {
      return {
        ok: false,
        error: {
          type: 'missing_measured_size',
          message: `Node "${node.content}" is missing measuredSize. Measure DOM elements before applying layout.`,
          nodeId: node.id,
        },
      };
    }
  }

  if (nodes.length === 0) {
    return { ok: true, value: [] };
  }

  // Compute levels using BFS
  const levels = computeLevels(nodes, edges);

  // Group nodes by level
  const nodesByLevel = new Map<number, MarkdownNode[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  }

  // Clone nodes to avoid mutating input
  const positionedNodes = nodes.map((n) => ({ ...n }));

  // Position nodes level by level
  const maxLevel = Math.max(...Array.from(levels.values()));
  for (let level = 0; level <= maxLevel; level++) {
    const levelNodes = nodesByLevel.get(level) || [];
    if (levelNodes.length === 0) continue;

    if (level === 0) {
      // T092: Position root node(s) at center
      if (levelNodes.length === 1) {
        const rootNode = positionedNodes.find((n) => n.id === levelNodes[0].id)!;
        rootNode.position = { ...LAYOUT_CONSTANTS.RADIAL_CENTER };
      } else {
        // Multiple roots: distribute around center
        const rootRadius = LAYOUT_CONSTANTS.RADIAL_BASE_RADIUS / 2;
        levelNodes.forEach((node, index) => {
          const angle = (index / levelNodes.length) * 2 * Math.PI;
          const positionedNode = positionedNodes.find((n) => n.id === node.id)!;
          positionedNode.position = {
            x: LAYOUT_CONSTANTS.RADIAL_CENTER.x + rootRadius * Math.cos(angle),
            y: LAYOUT_CONSTANTS.RADIAL_CENTER.y + rootRadius * Math.sin(angle),
          };
        });
      }
    } else {
      // T092-T093: Calculate radius with collision prevention
      const baseRadius = LAYOUT_CONSTANTS.RADIAL_BASE_RADIUS + level * LAYOUT_CONSTANTS.RADIAL_LEVEL_SPACING;

      // Calculate total width of nodes at this level
      const totalWidth = levelNodes.reduce((sum, node) => {
        return sum + (node.measuredSize?.width || 120);
      }, 0);

      // T093: Ensure radius large enough to fit all nodes without overlap
      const requiredCircumference = totalWidth + levelNodes.length * LAYOUT_CONSTANTS.MIN_NODE_SPACING;
      const adjustedRadius = Math.max(baseRadius, requiredCircumference / (2 * Math.PI));

      // Distribute nodes evenly around circle
      levelNodes.forEach((node, index) => {
        const angle = (index / levelNodes.length) * 2 * Math.PI - Math.PI / 2; // Start at top
        const positionedNode = positionedNodes.find((n) => n.id === node.id)!;
        positionedNode.position = {
          x: LAYOUT_CONSTANTS.RADIAL_CENTER.x + adjustedRadius * Math.cos(angle),
          y: LAYOUT_CONSTANTS.RADIAL_CENTER.y + adjustedRadius * Math.sin(angle),
        };
      });
    }
  }

  return { ok: true, value: positionedNodes };
}

/**
 * T094-T095: Calculate horizontal positions for nodes
 * Places nodes left-to-right with vertical levels
 *
 * Algorithm:
 * 1. Compute node levels using BFS
 * 2. Group nodes by level
 * 3. Position nodes left-to-right within each level
 * 4. Vertical spacing based on level (y = START_Y + level * SPACING_Y)
 * 5. Collision prevention: x spacing = nodeWidth + MIN_SPACING
 *
 * @returns Result with positioned nodes, or LayoutError if nodes missing measuredSize
 */
export function calculateHorizontalPositions(
  nodes: MarkdownNode[],
  edges: Edge[]
): Result<MarkdownNode[], LayoutError> {
  // Validate all nodes have measuredSize
  for (const node of nodes) {
    if (!node.measuredSize) {
      return {
        ok: false,
        error: {
          type: 'missing_measured_size',
          message: `Node "${node.content}" is missing measuredSize. Measure DOM elements before applying layout.`,
          nodeId: node.id,
        },
      };
    }
  }

  if (nodes.length === 0) {
    return { ok: true, value: [] };
  }

  // Compute levels using BFS
  const levels = computeLevels(nodes, edges);

  // Group nodes by level
  const nodesByLevel = new Map<number, MarkdownNode[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  }

  // Clone nodes to avoid mutating input
  const positionedNodes = nodes.map((n) => ({ ...n }));

  // Position nodes level by level
  const maxLevel = Math.max(...Array.from(levels.values()));
  for (let level = 0; level <= maxLevel; level++) {
    const levelNodes = nodesByLevel.get(level) || [];
    if (levelNodes.length === 0) continue;

    // T094: Calculate y position based on level
    const y = LAYOUT_CONSTANTS.HORIZONTAL_START.y + level * LAYOUT_CONSTANTS.HORIZONTAL_SPACING_Y;

    // T095: Position nodes left-to-right with collision prevention
    let currentX = LAYOUT_CONSTANTS.HORIZONTAL_START.x;
    levelNodes.forEach((node) => {
      const positionedNode = positionedNodes.find((n) => n.id === node.id)!;
      positionedNode.position = { x: currentX, y };

      // Advance x by node width + spacing
      currentX += (node.measuredSize?.width || 120) + LAYOUT_CONSTANTS.MIN_NODE_SPACING;
    });
  }

  return { ok: true, value: positionedNodes };
}

/**
 * T096-T097: Apply layout to nodes based on layout type
 * Main entry point for layout calculation
 *
 * @param nodes - Nodes to position (must have measuredSize)
 * @param edges - Edges for hierarchy calculation
 * @param layout - Layout type ('radial' or 'horizontal')
 * @returns Result with positioned nodes, or LayoutError
 */
export function applyLayout(
  nodes: MarkdownNode[],
  edges: Edge[],
  layout: LayoutType
): Result<MarkdownNode[], LayoutError> {
  // T097: Validate all nodes have measuredSize
  for (const node of nodes) {
    if (!node.measuredSize) {
      return {
        ok: false,
        error: {
          type: 'missing_measured_size',
          message: `Cannot apply layout: Node "${node.content}" is missing measuredSize. Measure DOM elements before applying layout.`,
          nodeId: node.id,
        },
      };
    }
  }

  // T096: Delegate to appropriate layout algorithm
  if (layout === 'radial') {
    return calculateRadialPositions(nodes, edges);
  } else if (layout === 'horizontal') {
    return calculateHorizontalPositions(nodes, edges);
  } else {
    return {
      ok: false,
      error: {
        type: 'invalid_layout_type',
        message: `Invalid layout type: "${layout}". Must be 'radial' or 'horizontal'.`,
      },
    };
  }
}
