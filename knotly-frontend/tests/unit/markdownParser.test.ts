/**
 * Unit tests for markdownParser
 * Tests markdown parsing with headers, lists, and layout comments
 * Following Given-When-Then structure (Constitution Principle VI)
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../../src/repository/markdownParser';

describe('markdownParser', () => {
  // T029: Single header test
  describe('parsing single header', () => {
    it('should parse a single h1 header', () => {
      // Given: markdown text with a single h1 header
      const markdown = '# Hello World';

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should return 1 header node with correct properties
      expect(result.ok).toBe(true);
      if (result.ok) {
        const { nodes, edges, layout } = result.value;
        expect(nodes).toHaveLength(1);
        expect(nodes[0].type).toBe('header');
        expect(nodes[0].content).toBe('Hello World');
        expect(nodes[0].level).toBe(1);
        expect(edges).toHaveLength(0); // No edges for single node
        expect(layout).toBe('radial'); // Default layout
      }
    });

    it('should parse a single h2 header', () => {
      // Given: markdown text with a single h2 header
      const markdown = '## Section Title';

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should return 1 header node with level 2
      expect(result.ok).toBe(true);
      if (result.ok) {
        const { nodes } = result.value;
        expect(nodes).toHaveLength(1);
        expect(nodes[0].type).toBe('header');
        expect(nodes[0].level).toBe(2);
      }
    });
  });

  // T030: Nested headers test
  describe('parsing nested headers', () => {
    it('should parse nested headers with parent-child edges', () => {
      // Given: markdown with h1 → h2 → h3 hierarchy
      const markdown = `# Level 1
## Level 2
### Level 3`;

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should return 3 nodes with 2 edges connecting them
      expect(result.ok).toBe(true);
      if (result.ok) {
        const { nodes, edges } = result.value;
        expect(nodes).toHaveLength(3);

        // Verify node types and levels
        expect(nodes[0].type).toBe('header');
        expect(nodes[0].level).toBe(1);
        expect(nodes[1].type).toBe('header');
        expect(nodes[1].level).toBe(2);
        expect(nodes[2].type).toBe('header');
        expect(nodes[2].level).toBe(3);

        // Verify edges connect correctly (L1 → L2, L2 → L3)
        expect(edges).toHaveLength(2);
        expect(edges[0].sourceId).toBe(nodes[0].id);
        expect(edges[0].targetId).toBe(nodes[1].id);
        expect(edges[1].sourceId).toBe(nodes[1].id);
        expect(edges[1].targetId).toBe(nodes[2].id);
      }
    });

    it('should handle skipped header levels', () => {
      // Given: markdown with h1 → h4 (skipping h2, h3)
      const markdown = `# Top Level
#### Sub Level`;

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should still create edge from h1 to h4
      expect(result.ok).toBe(true);
      if (result.ok) {
        const { nodes, edges } = result.value;
        expect(nodes).toHaveLength(2);
        expect(edges).toHaveLength(1);
        expect(edges[0].sourceId).toBe(nodes[0].id);
        expect(edges[0].targetId).toBe(nodes[1].id);
      }
    });
  });

  // T031: Simple list test
  describe('parsing simple list', () => {
    it('should parse a flat bulleted list', () => {
      // Given: markdown with 3 top-level list items
      const markdown = `- Item 1
- Item 2
- Item 3`;

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should return 3 text nodes with no edges (flat list)
      expect(result.ok).toBe(true);
      if (result.ok) {
        const { nodes, edges } = result.value;
        expect(nodes).toHaveLength(3);
        expect(nodes[0].type).toBe('text');
        expect(nodes[0].level).toBe(1);
        expect(nodes[0].content).toBe('Item 1');
        expect(edges).toHaveLength(0); // Flat list has no hierarchy
      }
    });

    it('should parse list with different bullet types', () => {
      // Given: markdown with -, *, + bullets
      const markdown = `- Dash item
* Star item
+ Plus item`;

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should treat all as equivalent text nodes
      expect(result.ok).toBe(true);
      if (result.ok) {
        const { nodes } = result.value;
        expect(nodes).toHaveLength(3);
        nodes.forEach(node => {
          expect(node.type).toBe('text');
          expect(node.level).toBe(1);
        });
      }
    });
  });

  // T032: Nested lists test
  describe('parsing nested lists', () => {
    it('should parse 3-level nested list with edges', () => {
      // Given: markdown with 3 levels of indentation
      const markdown = `- Parent
  - Child
    - Grandchild`;

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should return 3 nodes with 2 edges (Parent → Child → Grandchild)
      expect(result.ok).toBe(true);
      if (result.ok) {
        const { nodes, edges } = result.value;
        expect(nodes).toHaveLength(3);

        // Verify levels
        expect(nodes[0].level).toBe(1); // Parent
        expect(nodes[1].level).toBe(2); // Child (indented once)
        expect(nodes[2].level).toBe(3); // Grandchild (indented twice)

        // Verify edges
        expect(edges).toHaveLength(2);
        expect(edges[0].sourceId).toBe(nodes[0].id); // Parent → Child
        expect(edges[0].targetId).toBe(nodes[1].id);
        expect(edges[1].sourceId).toBe(nodes[1].id); // Child → Grandchild
        expect(edges[1].targetId).toBe(nodes[2].id);
      }
    });

    it('should handle mixed list and header hierarchy', () => {
      // Given: markdown with header followed by nested list
      const markdown = `# Main Topic
- Point 1
  - Sub-point 1.1`;

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: list items should be children of header
      expect(result.ok).toBe(true);
      if (result.ok) {
        const { nodes, edges } = result.value;
        expect(nodes).toHaveLength(3);
        expect(edges).toHaveLength(2);

        // Header should be parent of first list item
        const headerNode = nodes.find(n => n.type === 'header');
        const topListNode = nodes.find(n => n.type === 'text' && n.level === 1);
        expect(headerNode).toBeDefined();
        expect(topListNode).toBeDefined();

        const headerToListEdge = edges.find(e => e.sourceId === headerNode!.id);
        expect(headerToListEdge?.targetId).toBe(topListNode!.id);
      }
    });
  });

  // T033: Layout comment test
  describe('handling layout comment', () => {
    it('should parse radial layout comment', () => {
      // Given: markdown with radial layout comment
      const markdown = `<!-- knotly-layout: radial -->

# Header`;

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should return layout as 'radial'
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.layout).toBe('radial');
      }
    });

    it('should parse horizontal layout comment', () => {
      // Given: markdown with horizontal layout comment
      const markdown = `<!-- knotly-layout: horizontal -->

# Header`;

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should return layout as 'horizontal'
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.layout).toBe('horizontal');
      }
    });

    it('should default to radial when no comment present', () => {
      // Given: markdown without layout comment
      const markdown = '# Header';

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should return default layout 'radial'
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.layout).toBe('radial');
      }
    });

    it('should ignore invalid layout comment', () => {
      // Given: markdown with invalid layout comment
      const markdown = `<!-- knotly-layout: invalid -->

# Header`;

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should fallback to default 'radial'
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.layout).toBe('radial');
      }
    });
  });

  // Error handling tests
  describe('error handling', () => {
    it('should handle empty string', () => {
      // Given: empty markdown text
      const markdown = '';

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should return empty arrays
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.nodes).toHaveLength(0);
        expect(result.value.edges).toHaveLength(0);
      }
    });

    it('should handle whitespace-only string', () => {
      // Given: whitespace-only markdown
      const markdown = '   \n\n  \t  ';

      // When: parsing the markdown
      const result = parseMarkdown(markdown);

      // Then: should return empty arrays
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.nodes).toHaveLength(0);
        expect(result.value.edges).toHaveLength(0);
      }
    });
  });
});
