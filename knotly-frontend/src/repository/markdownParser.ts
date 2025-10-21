/**
 * Markdown Parser
 * Converts markdown text into graph structure (nodes + edges)
 * Uses marked.js lexer for tokenization
 */

import { marked } from 'marked';
import type {
  MarkdownNode,
  Edge,
  LayoutType,
  ParseError,
  Result,
} from '../types/markdown';
import { DEFAULTS } from '../types/markdown';
import { createHeaderNode, createTextNode, createEdge } from './factories';
import { extractStyleTokens } from './helpers';

/**
 * Parse markdown text into nodes and edges
 *
 * @param text - Raw markdown text
 * @returns Result with parsed nodes, edges, and layout, or ParseError
 *
 * Implementation:
 * 1. Extract layout comment (<!-- knotly-layout: TYPE -->)
 * 2. Use marked.lexer() to tokenize markdown
 * 3. Process tokens (heading, list, code, image, hr)
 * 4. Extract style tokens with extractStyleTokens()
 * 5. Build node hierarchy using nodeStack for headers/lists
 * 6. Create edges based on parent-child relationships
 */
export function parseMarkdown(text: string): Result<
  { nodes: MarkdownNode[]; edges: Edge[]; layout: LayoutType },
  ParseError
> {
  // T035: Extract layout comment
  const layout = extractLayoutComment(text);

  // Handle empty or whitespace-only input
  if (!text || text.trim().length === 0) {
    return {
      ok: true,
      value: { nodes: [], edges: [], layout },
    };
  }

  try {
    // T034: Use marked.lexer() to tokenize
    const tokens = marked.lexer(text);

    const nodes: MarkdownNode[] = [];
    const edges: Edge[] = [];

    // Node stack for tracking hierarchy
    // Stack maintains current parent at each level
    // Example: [h1Node, h2Node, h3Node] means h3 is child of h2, h2 is child of h1
    const nodeStack: Array<{ node: MarkdownNode; level: number }> = [];

    let currentGroupId: string | undefined = undefined;

    // T036, T037, T038: Process each token
    for (const token of tokens) {
      if (token.type === 'heading') {
        // T036: Process heading tokens
        const { content, tokens: styleTokens } = extractStyleTokens(token.text);
        const styleString = styleTokens.join(' ');

        const nodeResult = createHeaderNode(content, token.depth, styleString);
        if (!nodeResult.ok) {
          return {
            ok: false,
            error: {
              type: 'token_extraction_error',
              message: `Failed to create header node: ${nodeResult.error.message}`,
            },
          };
        }

        const headerNode = nodeResult.value;
        headerNode.groupId = currentGroupId;
        nodes.push(headerNode);

        // Find parent in node stack
        // Parent is the most recent node with lower level
        let parentNode: MarkdownNode | null = null;
        for (let i = nodeStack.length - 1; i >= 0; i--) {
          const stackEntry = nodeStack[i];
          if (
            stackEntry.node.type === 'header' &&
            stackEntry.node.level < token.depth
          ) {
            parentNode = stackEntry.node;
            break;
          }
        }

        // Create edge if parent exists
        if (parentNode) {
          const edgeResult = createEdge(parentNode.id, headerNode.id);
          if (edgeResult.ok) {
            edges.push(edgeResult.value);
          }
        }

        // Update node stack: remove all nodes at >= current level, then add current
        const newStack = nodeStack.filter(
          (entry) => entry.node.type !== 'header' || entry.node.level < token.depth
        );
        newStack.push({ node: headerNode, level: token.depth });
        nodeStack.length = 0;
        nodeStack.push(...newStack);
      } else if (token.type === 'list') {
        // T037: Process list tokens with indentation-based edges
        processListToken(token, nodes, edges, nodeStack, currentGroupId);
      } else if (token.type === 'hr') {
        // T038: Horizontal rule creates new group
        currentGroupId = crypto.randomUUID();
        // HR also clears node stack (new section)
        nodeStack.length = 0;
      }
      // Note: code and image tokens will be handled in Phase 5 (User Story 3)
    }

    return {
      ok: true,
      value: { nodes, edges, layout },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'syntax_error',
        message: error instanceof Error ? error.message : 'Unknown parsing error',
      },
    };
  }
}

/**
 * Extract layout comment from markdown text
 * Looks for: <!-- knotly-layout: radial --> or <!-- knotly-layout: horizontal -->
 *
 * @param text - Raw markdown text
 * @returns Layout type ('radial' or 'horizontal', defaults to 'radial')
 */
function extractLayoutComment(text: string): LayoutType {
  const regex = /<!--\s*knotly-layout:\s*(radial|horizontal)\s*-->/i;
  const match = text.match(regex);

  if (match && (match[1] === 'radial' || match[1] === 'horizontal')) {
    return match[1] as LayoutType;
  }

  return DEFAULTS.LAYOUT;
}

/**
 * Process list token recursively
 * Handles nested lists with indentation-based parent-child relationships
 *
 * @param listToken - List token from marked.lexer()
 * @param nodes - Nodes array to append to
 * @param edges - Edges array to append to
 * @param nodeStack - Current node stack for hierarchy
 * @param currentGroupId - Current group identifier
 */
function processListToken(
  listToken: marked.Tokens.List,
  nodes: MarkdownNode[],
  edges: Edge[],
  nodeStack: Array<{ node: MarkdownNode; level: number }>,
  currentGroupId: string | undefined
): void {
  // Calculate list level based on indentation
  // marked.js doesn't directly expose indentation, so we infer from nesting depth
  const calculateLevel = (depth: number): number => Math.min(depth + 1, 5); // Max level 5

  const processListItems = (
    items: marked.Tokens.ListItem[],
    currentLevel: number,
    parentNode: MarkdownNode | null
  ) => {
    for (const item of items) {
      // Extract text content from list item
      const textContent = extractListItemText(item);
      const { content, tokens: styleTokens } = extractStyleTokens(textContent);
      const styleString = styleTokens.join(' ');

      const nodeResult = createTextNode(content, currentLevel, styleString);
      if (!nodeResult.ok) {
        continue; // Skip invalid nodes
      }

      const textNode = nodeResult.value;
      textNode.groupId = currentGroupId;
      nodes.push(textNode);

      // Create edge to parent if exists
      if (parentNode) {
        const edgeResult = createEdge(parentNode.id, textNode.id);
        if (edgeResult.ok) {
          edges.push(edgeResult.value);
        }
      } else {
        // Top-level list item - check if it's child of header
        const lastHeaderInStack = nodeStack
          .slice()
          .reverse()
          .find((entry) => entry.node.type === 'header');
        if (lastHeaderInStack) {
          const edgeResult = createEdge(lastHeaderInStack.node.id, textNode.id);
          if (edgeResult.ok) {
            edges.push(edgeResult.value);
          }
        }
      }

      // Update node stack
      const newStack = nodeStack.filter(
        (entry) => entry.node.type !== 'text' || entry.level < currentLevel
      );
      newStack.push({ node: textNode, level: currentLevel });
      nodeStack.length = 0;
      nodeStack.push(...newStack);

      // Process nested lists recursively
      if (item.tokens) {
        for (const subToken of item.tokens) {
          if (subToken.type === 'list') {
            processListItems(subToken.items, currentLevel + 1, textNode);
          }
        }
      }
    }
  };

  processListItems(listToken.items, 1, null);
}

/**
 * Extract text content from list item token
 * Handles inline text, paragraphs, and other content types
 *
 * @param item - List item token
 * @returns Plain text content
 */
function extractListItemText(item: marked.Tokens.ListItem): string {
  if (!item.tokens || item.tokens.length === 0) {
    return item.text || '';
  }

  // Extract text from first token (usually text or paragraph)
  const firstToken = item.tokens[0];

  if (firstToken.type === 'text') {
    return firstToken.text;
  } else if (firstToken.type === 'paragraph') {
    return firstToken.text;
  }

  return item.text || '';
}
