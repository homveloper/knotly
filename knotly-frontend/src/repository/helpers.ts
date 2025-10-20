/**
 * Helper functions for markdown parsing, serialization, and layout
 * Pure functions with no side effects (Constitution Principle V)
 */

import type { MarkdownNode, Edge, Result, ValidationError } from '../types/markdown';

// ============================================================================
// Style Token Helpers
// ============================================================================

/**
 * Extract style tokens from text
 *
 * Removes tokens like {.color-red .h3} from the end of content
 *
 * @param text - Text with potential style tokens
 * @returns Object with cleaned content and extracted tokens array
 *
 * @example
 * extractStyleTokens("Header {.color-blue .h1}")
 * // Returns: { content: "Header", tokens: ["color-blue", "h1"] }
 *
 * extractStyleTokens("No tokens")
 * // Returns: { content: "No tokens", tokens: [] }
 */
export function extractStyleTokens(text: string): {
  content: string;
  tokens: string[];
} {
  // Regex: \s*\{(\.[\w-]+(?:\s+\.[\w-]+)*)\}\s*$
  // Matches: optional whitespace + { + .token1 .token2 + } + optional whitespace at end
  const regex = /\s*\{(\.[\w-]+(?:\s+\.[\w-]+)*)\}\s*$/;
  const match = text.match(regex);

  if (!match) {
    return { content: text, tokens: [] };
  }

  const content = text.slice(0, match.index).trimEnd();
  const tokenString = match[1]; // e.g., ".color-blue .h1"
  const tokens = tokenString
    .split(/\s+/)
    .map((t) => t.replace(/^\./, '')) // Remove leading dots
    .filter((t) => t.length > 0);

  return { content, tokens };
}

/**
 * Restore style tokens to text
 *
 * Inverse of extractStyleTokens - adds tokens back to content
 *
 * @param content - Clean text content
 * @param tokens - Array of style token names
 * @returns Text with tokens appended
 *
 * @example
 * restoreStyleTokens("Header", ["color-blue", "h1"])
 * // Returns: "Header {.color-blue .h1}"
 *
 * restoreStyleTokens("No tokens", [])
 * // Returns: "No tokens"
 */
export function restoreStyleTokens(content: string, tokens: string[]): string {
  if (tokens.length === 0) {
    return content;
  }

  const tokenString = tokens.map((t) => `.${t}`).join(' ');
  return `${content} {${tokenString}}`;
}

// ============================================================================
// Graph Traversal Helpers
// ============================================================================

/**
 * Compute node levels using BFS
 *
 * Assigns level numbers to nodes based on graph hierarchy.
 * Level 0 = root nodes (no incoming edges)
 * Level 1 = children of roots
 * Level 2 = children of level 1, etc.
 *
 * @param nodes - Array of nodes
 * @param edges - Array of edges (defines parent-child)
 * @returns Map of nodeId → level
 *
 * @example
 * const levels = computeLevels(nodes, edges);
 * const rootLevel = levels.get(rootNodeId); // 0
 * const childLevel = levels.get(childNodeId); // 1
 */
export function computeLevels(
  nodes: MarkdownNode[],
  edges: Edge[]
): Map<string, number> {
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  // Find root nodes (no incoming edges)
  const rootNodeIds = findRootNodes(nodes, edges);

  // BFS from all roots
  const queue: Array<{ nodeId: string; level: number }> = rootNodeIds.map(
    (id) => ({ nodeId: id, level: 0 })
  );

  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;

    if (visited.has(nodeId)) {
      continue;
    }

    visited.add(nodeId);
    levels.set(nodeId, level);

    // Add children to queue
    const childrenIds = findChildren(nodeId, edges);
    for (const childId of childrenIds) {
      if (!visited.has(childId)) {
        queue.push({ nodeId: childId, level: level + 1 });
      }
    }
  }

  // Handle orphaned nodes (no incoming or outgoing edges)
  for (const node of nodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  }

  return levels;
}

/**
 * Find root nodes (no incoming edges)
 *
 * @param nodes - Array of nodes
 * @param edges - Array of edges
 * @returns Array of root node IDs
 */
export function findRootNodes(nodes: MarkdownNode[], edges: Edge[]): string[] {
  const targetIds = new Set(edges.map((e) => e.targetId));
  return nodes.filter((n) => !targetIds.has(n.id)).map((n) => n.id);
}

/**
 * Find children of a node
 *
 * @param nodeId - Parent node ID
 * @param edges - Array of edges
 * @returns Array of child node IDs
 */
export function findChildren(nodeId: string, edges: Edge[]): string[] {
  return edges.filter((e) => e.sourceId === nodeId).map((e) => e.targetId);
}

/**
 * Find parent of a node
 *
 * @param nodeId - Child node ID
 * @param edges - Array of edges
 * @returns Parent node ID or null if root
 */
export function findParent(nodeId: string, edges: Edge[]): string | null {
  const parentEdge = edges.find((e) => e.targetId === nodeId);
  return parentEdge ? parentEdge.sourceId : null;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate node level is within acceptable range
 *
 * @param level - Level to validate
 * @param minLevel - Minimum acceptable level
 * @param maxLevel - Maximum acceptable level
 * @returns Result with true or ValidationError
 */
export function validateLevel(
  level: number,
  minLevel: number,
  maxLevel: number,
  fieldName: string
): Result<true, ValidationError> {
  if (!Number.isInteger(level)) {
    return {
      ok: false,
      error: {
        type: 'invalid_field',
        message: `${fieldName} must be an integer`,
        field: fieldName,
        value: level,
      },
    };
  }

  if (level < minLevel || level > maxLevel) {
    return {
      ok: false,
      error: {
        type: 'out_of_range',
        message: `${fieldName} must be between ${minLevel} and ${maxLevel}`,
        field: fieldName,
        value: level,
      },
    };
  }

  return { ok: true, value: true };
}

/**
 * Validate non-empty string
 *
 * @param value - String to validate
 * @param fieldName - Field name for error message
 * @returns Result with true or ValidationError
 */
export function validateNonEmptyString(
  value: string,
  fieldName: string
): Result<true, ValidationError> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {
      ok: false,
      error: {
        type: 'required_field',
        message: `${fieldName} is required and must be a non-empty string`,
        field: fieldName,
        value,
      },
    };
  }

  return { ok: true, value: true };
}

/**
 * Validate URL format
 *
 * @param url - URL string to validate
 * @param fieldName - Field name for error message
 * @returns Result with true or ValidationError
 */
export function validateUrl(
  url: string,
  fieldName: string
): Result<true, ValidationError> {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        ok: false,
        error: {
          type: 'invalid_field',
          message: `${fieldName} must use http or https protocol`,
          field: fieldName,
          value: url,
        },
      };
    }
    return { ok: true, value: true };
  } catch {
    return {
      ok: false,
      error: {
        type: 'invalid_field',
        message: `${fieldName} must be a valid URL`,
        field: fieldName,
        value: url,
      },
    };
  }
}
