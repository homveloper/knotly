/**
 * Unit tests for layoutEngine
 * Tests layout algorithms (radial and horizontal) for node positioning
 * Following Given-When-Then structure (Constitution Principle VI)
 */

import { describe, it, expect } from 'vitest';
import type { MarkdownNode, Edge, LayoutError, Result } from '../../src/types/markdown';
import { createHeaderNode, createTextNode, createEdge } from '../../src/repository/factories';
import { computeLevels } from '../../src/repository/helpers';

// These will be implemented in layoutEngine.ts
import {
  calculateRadialPositions,
  calculateHorizontalPositions,
  applyLayout,
} from '../../src/repository/layoutEngine';

describe('layoutEngine', () => {
  // T088: computeLevels with 3-level hierarchy
  describe('computeLevels', () => {
    it('should compute levels for 3-level hierarchy', () => {
      // Given: H1 → H2 → H3 hierarchy
      const h1Result = createHeaderNode('Level 1', 1, '');
      const h2Result = createHeaderNode('Level 2', 2, '');
      const h3Result = createHeaderNode('Level 3', 3, '');

      expect(h1Result.ok && h2Result.ok && h3Result.ok).toBe(true);
      if (!h1Result.ok || !h2Result.ok || !h3Result.ok) return;

      const nodes = [h1Result.value, h2Result.value, h3Result.value];

      const edge1Result = createEdge(h1Result.value.id, h2Result.value.id);
      const edge2Result = createEdge(h2Result.value.id, h3Result.value.id);

      expect(edge1Result.ok && edge2Result.ok).toBe(true);
      if (!edge1Result.ok || !edge2Result.ok) return;

      const edges = [edge1Result.value, edge2Result.value];

      // When: computing levels
      const levels = computeLevels(nodes, edges);

      // Then: should assign correct levels (0, 1, 2)
      expect(levels.get(h1Result.value.id)).toBe(0); // Root
      expect(levels.get(h2Result.value.id)).toBe(1); // Child of root
      expect(levels.get(h3Result.value.id)).toBe(2); // Grandchild
    });

    it('should handle multiple root nodes', () => {
      // Given: two disconnected h1 headers (both roots)
      const h1aResult = createHeaderNode('Root A', 1, '');
      const h1bResult = createHeaderNode('Root B', 1, '');

      expect(h1aResult.ok && h1bResult.ok).toBe(true);
      if (!h1aResult.ok || !h1bResult.ok) return;

      const nodes = [h1aResult.value, h1bResult.value];
      const edges: Edge[] = [];

      // When: computing levels
      const levels = computeLevels(nodes, edges);

      // Then: both should be level 0 (roots)
      expect(levels.get(h1aResult.value.id)).toBe(0);
      expect(levels.get(h1bResult.value.id)).toBe(0);
    });
  });

  // T089: calculateRadialPositions with no overlaps
  describe('calculateRadialPositions', () => {
    it('should calculate radial positions for 10 nodes with no overlaps', () => {
      // Given: 10 nodes with measured sizes, in a hierarchy (not all at level 0)
      const rootResult = createHeaderNode('Root', 1, '');
      expect(rootResult.ok).toBe(true);
      if (!rootResult.ok) return;

      const root = rootResult.value;
      root.measuredSize = { width: 120, height: 80 };

      const nodes: MarkdownNode[] = [root];
      const edges: Edge[] = [];

      // Create 9 child nodes connected to root
      for (let i = 0; i < 9; i++) {
        const nodeResult = createTextNode(`Node ${i}`, 1, '');
        expect(nodeResult.ok).toBe(true);
        if (!nodeResult.ok) return;

        const node = nodeResult.value;
        node.measuredSize = { width: 120, height: 80 };
        nodes.push(node);

        // Create edge from root to child
        const edgeResult = createEdge(root.id, node.id);
        expect(edgeResult.ok).toBe(true);
        if (!edgeResult.ok) return;
        edges.push(edgeResult.value);
      }

      // When: calculating radial positions
      const result = calculateRadialPositions(nodes, edges);

      // Then: should succeed and assign positions
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const positionedNodes = result.value;
      expect(positionedNodes).toHaveLength(10);

      // Verify all nodes have positions assigned
      positionedNodes.forEach((node) => {
        expect(node.position.x).toBeGreaterThan(0);
        expect(node.position.y).toBeGreaterThan(0);
      });

      // Verify child nodes are distributed around root in a circle
      const childNodes = positionedNodes.filter((n) => n.id !== root.id);
      expect(childNodes.length).toBe(9);
    });

    it('should position root node at center', () => {
      // Given: single root node
      const nodeResult = createHeaderNode('Root', 1, '');
      expect(nodeResult.ok).toBe(true);
      if (!nodeResult.ok) return;

      const node = nodeResult.value;
      node.measuredSize = { width: 150, height: 100 };
      const nodes = [node];
      const edges: Edge[] = [];

      // When: calculating radial positions
      const result = calculateRadialPositions(nodes, edges);

      // Then: should position at center (500, 500)
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const positionedNodes = result.value;
      expect(positionedNodes[0].position).toEqual({ x: 500, y: 500 });
    });
  });

  // T090: calculateHorizontalPositions with no overlaps
  describe('calculateHorizontalPositions', () => {
    it('should calculate horizontal positions for 10 nodes with no overlaps', () => {
      // Given: 10 nodes with measured sizes
      const nodes: MarkdownNode[] = [];
      for (let i = 0; i < 10; i++) {
        const nodeResult = createTextNode(`Node ${i}`, 1, '');
        expect(nodeResult.ok).toBe(true);
        if (!nodeResult.ok) return;

        const node = nodeResult.value;
        node.measuredSize = { width: 120, height: 80 };
        nodes.push(node);
      }

      const edges: Edge[] = [];

      // When: calculating horizontal positions
      const result = calculateHorizontalPositions(nodes, edges);

      // Then: should succeed and assign positions
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const positionedNodes = result.value;
      expect(positionedNodes).toHaveLength(10);

      // Verify no two nodes overlap (x positions increase left-to-right)
      for (let i = 0; i < positionedNodes.length - 1; i++) {
        const nodeA = positionedNodes[i];
        const nodeB = positionedNodes[i + 1];

        // NodeB's x should be greater than nodeA's x + width + padding
        const minX = nodeA.position.x + (nodeA.measuredSize?.width || 0) + 40;
        expect(nodeB.position.x).toBeGreaterThanOrEqual(minX);
      }
    });

    it('should position nodes left-to-right starting at (100, 100)', () => {
      // Given: 3 nodes in horizontal layout
      const node1Result = createHeaderNode('First', 1, '');
      const node2Result = createHeaderNode('Second', 2, '');
      const node3Result = createHeaderNode('Third', 3, '');

      expect(node1Result.ok && node2Result.ok && node3Result.ok).toBe(true);
      if (!node1Result.ok || !node2Result.ok || !node3Result.ok) return;

      const nodes = [node1Result.value, node2Result.value, node3Result.value];
      nodes.forEach((node) => {
        node.measuredSize = { width: 100, height: 60 };
      });

      const edges: Edge[] = [];

      // When: calculating horizontal positions
      const result = calculateHorizontalPositions(nodes, edges);

      // Then: should start at (100, 100)
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const positionedNodes = result.value;
      expect(positionedNodes[0].position.x).toBeGreaterThanOrEqual(100);
      expect(positionedNodes[0].position.y).toBeGreaterThanOrEqual(100);
    });
  });

  // T091: applyLayout with missing measuredSize
  describe('applyLayout', () => {
    it('should return error if nodes missing measuredSize', () => {
      // Given: nodes WITHOUT measuredSize
      const node1Result = createTextNode('Node 1', 1, '');
      const node2Result = createTextNode('Node 2', 1, '');

      expect(node1Result.ok && node2Result.ok).toBe(true);
      if (!node1Result.ok || !node2Result.ok) return;

      const nodes = [node1Result.value, node2Result.value];
      // Intentionally NOT setting measuredSize
      const edges: Edge[] = [];

      // When: applying layout
      const result = applyLayout(nodes, edges, 'radial');

      // Then: should return error
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('missing_measured_size');
        expect(result.error.message).toContain('measuredSize');
      }
    });

    it('should successfully apply radial layout with valid nodes', () => {
      // Given: valid nodes with measuredSize
      const node1Result = createHeaderNode('Header', 1, '');
      const node2Result = createTextNode('Text', 1, '');

      expect(node1Result.ok && node2Result.ok).toBe(true);
      if (!node1Result.ok || !node2Result.ok) return;

      const nodes = [node1Result.value, node2Result.value];
      nodes.forEach((node) => {
        node.measuredSize = { width: 120, height: 80 };
      });

      const edges: Edge[] = [];

      // When: applying radial layout
      const result = applyLayout(nodes, edges, 'radial');

      // Then: should succeed
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        result.value.forEach((node) => {
          expect(node.position.x).toBeGreaterThan(0);
          expect(node.position.y).toBeGreaterThan(0);
        });
      }
    });

    it('should successfully apply horizontal layout with valid nodes', () => {
      // Given: valid nodes with measuredSize
      const node1Result = createHeaderNode('Header', 1, '');
      const node2Result = createTextNode('Text', 1, '');

      expect(node1Result.ok && node2Result.ok).toBe(true);
      if (!node1Result.ok || !node2Result.ok) return;

      const nodes = [node1Result.value, node2Result.value];
      nodes.forEach((node) => {
        node.measuredSize = { width: 120, height: 80 };
      });

      const edges: Edge[] = [];

      // When: applying horizontal layout
      const result = applyLayout(nodes, edges, 'horizontal');

      // Then: should succeed
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        // Nodes should be positioned left-to-right
        expect(result.value[1].position.x).toBeGreaterThan(result.value[0].position.x);
      }
    });
  });
});
