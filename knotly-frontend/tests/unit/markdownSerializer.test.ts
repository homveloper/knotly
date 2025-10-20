/**
 * Unit tests for markdownSerializer
 * Tests serialization of nodes and edges back to markdown text
 * Following Given-When-Then structure (Constitution Principle VI)
 */

import { describe, it, expect } from 'vitest';
import { serializeToMarkdown } from '../../src/repository/markdownSerializer';
import { createHeaderNode, createTextNode, createEdge } from '../../src/repository/factories';

describe('markdownSerializer', () => {
  // T039: Single header test
  describe('serializing single header', () => {
    it('should serialize a single h1 header', () => {
      // Given: a single header node
      const headerResult = createHeaderNode('Hello World', 1, '');
      expect(headerResult.ok).toBe(true);
      if (!headerResult.ok) return;

      const nodes = [headerResult.value];
      const edges: any[] = [];

      // When: serializing to markdown
      const result = serializeToMarkdown(nodes, edges, 'radial');

      // Then: should return markdown with h1 header and layout comment
      expect(result.ok).toBe(true);
      if (result.ok) {
        const markdown = result.value;
        expect(markdown).toContain('<!-- knotly-layout: radial -->');
        expect(markdown).toContain('# Hello World');
      }
    });

    it('should serialize header with style tokens', () => {
      // Given: header node with style tokens
      const headerResult = createHeaderNode('Styled Header', 2, 'color-blue h1');
      expect(headerResult.ok).toBe(true);
      if (!headerResult.ok) return;

      const nodes = [headerResult.value];
      const edges: any[] = [];

      // When: serializing to markdown
      const result = serializeToMarkdown(nodes, edges, 'radial');

      // Then: should include style tokens in output
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toContain('## Styled Header {.color-blue .h1}');
      }
    });
  });

  // T040: Nested headers test
  describe('serializing nested headers', () => {
    it('should serialize nested headers with correct order', () => {
      // Given: h1 → h2 → h3 hierarchy
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

      // When: serializing to markdown
      const result = serializeToMarkdown(nodes, edges, 'horizontal');

      // Then: should return headers in hierarchical order
      expect(result.ok).toBe(true);
      if (result.ok) {
        const markdown = result.value;
        expect(markdown).toContain('<!-- knotly-layout: horizontal -->');
        expect(markdown).toContain('# Level 1');
        expect(markdown).toContain('## Level 2');
        expect(markdown).toContain('### Level 3');

        // Verify order
        const idx1 = markdown.indexOf('# Level 1');
        const idx2 = markdown.indexOf('## Level 2');
        const idx3 = markdown.indexOf('### Level 3');
        expect(idx1).toBeLessThan(idx2);
        expect(idx2).toBeLessThan(idx3);
      }
    });

    it('should handle multiple root headers', () => {
      // Given: two h1 headers (both roots)
      const h1aResult = createHeaderNode('First Topic', 1, '');
      const h1bResult = createHeaderNode('Second Topic', 1, '');

      expect(h1aResult.ok && h1bResult.ok).toBe(true);
      if (!h1aResult.ok || !h1bResult.ok) return;

      const nodes = [h1aResult.value, h1bResult.value];
      const edges: any[] = [];

      // When: serializing to markdown
      const result = serializeToMarkdown(nodes, edges, 'radial');

      // Then: should list both headers
      expect(result.ok).toBe(true);
      if (result.ok) {
        const markdown = result.value;
        expect(markdown).toContain('# First Topic');
        expect(markdown).toContain('# Second Topic');
      }
    });
  });

  // T041: Nested lists test
  describe('serializing nested lists', () => {
    it('should serialize flat list', () => {
      // Given: 3 top-level list items
      const item1Result = createTextNode('Item 1', 1, '');
      const item2Result = createTextNode('Item 2', 1, '');
      const item3Result = createTextNode('Item 3', 1, '');

      expect(item1Result.ok && item2Result.ok && item3Result.ok).toBe(true);
      if (!item1Result.ok || !item2Result.ok || !item3Result.ok) return;

      const nodes = [item1Result.value, item2Result.value, item3Result.value];
      const edges: any[] = [];

      // When: serializing to markdown
      const result = serializeToMarkdown(nodes, edges, 'radial');

      // Then: should return unindented list items
      expect(result.ok).toBe(true);
      if (result.ok) {
        const markdown = result.value;
        expect(markdown).toContain('- Item 1');
        expect(markdown).toContain('- Item 2');
        expect(markdown).toContain('- Item 3');
      }
    });

    it('should serialize nested list with correct indentation', () => {
      // Given: Parent → Child → Grandchild
      const parentResult = createTextNode('Parent', 1, '');
      const childResult = createTextNode('Child', 2, '');
      const grandchildResult = createTextNode('Grandchild', 3, '');

      expect(parentResult.ok && childResult.ok && grandchildResult.ok).toBe(true);
      if (!parentResult.ok || !childResult.ok || !grandchildResult.ok) return;

      const nodes = [parentResult.value, childResult.value, grandchildResult.value];

      const edge1Result = createEdge(parentResult.value.id, childResult.value.id);
      const edge2Result = createEdge(childResult.value.id, grandchildResult.value.id);

      expect(edge1Result.ok && edge2Result.ok).toBe(true);
      if (!edge1Result.ok || !edge2Result.ok) return;

      const edges = [edge1Result.value, edge2Result.value];

      // When: serializing to markdown
      const result = serializeToMarkdown(nodes, edges, 'radial');

      // Then: should return list with proper indentation (2 spaces per level)
      expect(result.ok).toBe(true);
      if (result.ok) {
        const markdown = result.value;
        expect(markdown).toContain('- Parent');
        expect(markdown).toContain('  - Child');
        expect(markdown).toContain('    - Grandchild');

        // Verify indentation order
        const lines = markdown.split('\n');
        const parentLine = lines.find(l => l.includes('Parent'));
        const childLine = lines.find(l => l.includes('Child'));
        const grandchildLine = lines.find(l => l.includes('Grandchild'));

        expect(parentLine).toMatch(/^- Parent/);
        expect(childLine).toMatch(/^  - Child/);
        expect(grandchildLine).toMatch(/^    - Grandchild/);
      }
    });

    it('should serialize mixed headers and lists', () => {
      // Given: Header with nested list
      const headerResult = createHeaderNode('Main Topic', 1, '');
      const item1Result = createTextNode('Point 1', 1, '');
      const item2Result = createTextNode('Sub-point 1.1', 2, '');

      expect(headerResult.ok && item1Result.ok && item2Result.ok).toBe(true);
      if (!headerResult.ok || !item1Result.ok || !item2Result.ok) return;

      const nodes = [headerResult.value, item1Result.value, item2Result.value];

      const edge1Result = createEdge(headerResult.value.id, item1Result.value.id);
      const edge2Result = createEdge(item1Result.value.id, item2Result.value.id);

      expect(edge1Result.ok && edge2Result.ok).toBe(true);
      if (!edge1Result.ok || !edge2Result.ok) return;

      const edges = [edge1Result.value, edge2Result.value];

      // When: serializing to markdown
      const result = serializeToMarkdown(nodes, edges, 'radial');

      // Then: should return header followed by list
      expect(result.ok).toBe(true);
      if (result.ok) {
        const markdown = result.value;
        expect(markdown).toContain('# Main Topic');
        expect(markdown).toContain('- Point 1');
        expect(markdown).toContain('  - Sub-point 1.1');

        // Verify order
        const headerIdx = markdown.indexOf('# Main Topic');
        const listIdx = markdown.indexOf('- Point 1');
        expect(headerIdx).toBeLessThan(listIdx);
      }
    });
  });

  // Edge cases
  describe('edge cases', () => {
    it('should handle empty node list', () => {
      // Given: empty nodes and edges
      const nodes: any[] = [];
      const edges: any[] = [];

      // When: serializing to markdown
      const result = serializeToMarkdown(nodes, edges, 'radial');

      // Then: should return only layout comment
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toContain('<!-- knotly-layout: radial -->');
        expect(result.value.trim().split('\n').length).toBeLessThanOrEqual(2);
      }
    });

    it('should preserve style tokens', () => {
      // Given: nodes with style tokens
      const headerResult = createHeaderNode('Styled', 1, 'color-red h2 neat');
      const textResult = createTextNode('List', 1, 'color-blue');

      expect(headerResult.ok && textResult.ok).toBe(true);
      if (!headerResult.ok || !textResult.ok) return;

      const nodes = [headerResult.value, textResult.value];
      const edges: any[] = [];

      // When: serializing to markdown
      const result = serializeToMarkdown(nodes, edges, 'radial');

      // Then: should include all tokens
      expect(result.ok).toBe(true);
      if (result.ok) {
        const markdown = result.value;
        expect(markdown).toContain('{.color-red .h2 .neat}');
        expect(markdown).toContain('{.color-blue}');
      }
    });
  });
});
