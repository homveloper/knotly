/**
 * Markdown Serializer
 * Converts graph structure (nodes + edges) back to markdown text
 */

import type {
  MarkdownNode,
  Edge,
  LayoutType,
  SerializeError,
  Result,
} from '../types/markdown';
import { restoreStyleTokens } from './helpers';

/**
 * Serialize nodes and edges to markdown text
 *
 * @param nodes - Array of nodes to serialize
 * @param edges - Array of edges (for hierarchy)
 * @param layout - Current layout type
 * @returns Result with markdown text, or SerializeError
 *
 * Implementation:
 * 1. Add layout comment at top (<!-- knotly-layout: TYPE -->)
 * 2. Group nodes by groupId (--- separator between groups)
 * 3. Serialize each node type:
 *    - header: '#'.repeat(level) + content + styleTokens
 *    - text: '  '.repeat(level-1) + '- ' + content + styleTokens
 *    - code: ```language + styleTokens + '\n' + content + '\n```'
 *    - image: '![' + altText + '](' + imageUrl + ')' + styleTokens
 * 4. Reconstruct hierarchy using edges (indentation, nesting)
 * 5. Return pure markdown string
 *
 * Note: Free-form edges (link mode) are NOT persisted to markdown
 */
export function serializeToMarkdown(
  nodes: MarkdownNode[],
  edges: Edge[],
  layout: LayoutType
): Result<string, SerializeError> {
  try {
    const lines: string[] = [];

    // T043: Add layout comment at top
    lines.push(`<!-- knotly-layout: ${layout} -->`);
    lines.push(''); // Empty line after comment

    // Handle empty node list
    if (nodes.length === 0) {
      return { ok: true, value: lines.join('\n') };
    }

    // Build adjacency map for quick parent/child lookup
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();

    for (const edge of edges) {
      if (!childrenMap.has(edge.sourceId)) {
        childrenMap.set(edge.sourceId, []);
      }
      childrenMap.get(edge.sourceId)!.push(edge.targetId);
      parentMap.set(edge.targetId, edge.sourceId);
    }

    // Find root nodes (no parent)
    const rootNodes = nodes.filter((n) => !parentMap.has(n.id));

    // Track visited nodes to prevent infinite loops
    const visited = new Set<string>();

    // Serialize nodes in depth-first order
    const serializeNode = (node: MarkdownNode) => {
      if (visited.has(node.id)) {
        return; // Prevent circular references
      }
      visited.add(node.id);

      // Extract style tokens
      const tokens = node.style
        ? node.style.split(/\s+/).filter((t) => t.length > 0)
        : [];

      if (node.type === 'header') {
        // T044: Serialize header
        const prefix = '#'.repeat(node.level);
        const text = restoreStyleTokens(node.content, tokens);
        lines.push(`${prefix} ${text}`);
        lines.push(''); // Empty line after header
      } else if (node.type === 'text') {
        // T045: Serialize list item with indentation
        const indent = '  '.repeat(node.level - 1);
        const text = restoreStyleTokens(node.content, tokens);
        lines.push(`${indent}- ${text}`);
      } else if (node.type === 'code') {
        // Code node serialization (Phase 5)
        const text = restoreStyleTokens(node.language, tokens);
        lines.push(`\`\`\`${text}`);
        lines.push(node.content);
        lines.push('```');
        lines.push(''); // Empty line after code block
      } else if (node.type === 'image') {
        // Image node serialization (Phase 5)
        const text = restoreStyleTokens(
          `![${node.altText}](${node.imageUrl})`,
          tokens
        );
        lines.push(text);
        lines.push(''); // Empty line after image
      }

      // Recursively serialize children
      const children = childrenMap.get(node.id) || [];
      for (const childId of children) {
        const childNode = nodes.find((n) => n.id === childId);
        if (childNode) {
          serializeNode(childNode);
        }
      }
    };

    // Group nodes by groupId
    const groupedNodes = new Map<string | undefined, MarkdownNode[]>();
    for (const node of rootNodes) {
      const groupId = node.groupId;
      if (!groupedNodes.has(groupId)) {
        groupedNodes.set(groupId, []);
      }
      groupedNodes.get(groupId)!.push(node);
    }

    // Serialize each group
    const groups = Array.from(groupedNodes.entries());
    for (let i = 0; i < groups.length; i++) {
      const [groupId, groupRoots] = groups[i];

      // Add horizontal rule between groups (except before first group)
      if (i > 0 && groupId !== undefined) {
        lines.push('---');
        lines.push('');
      }

      // Serialize all roots in this group
      for (const root of groupRoots) {
        serializeNode(root);
      }
    }

    // Remove trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    return { ok: true, value: lines.join('\n') };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'invalid_node',
        message: error instanceof Error ? error.message : 'Unknown serialization error',
      },
    };
  }
}
