// Token parser for composable style system
// Implements pure functions with no side effects (constitution.md)

import type { TokenDefinitions, StyleObject } from '../types/canvas';

/**
 * Default token library with 8 colors, 6 sizes, 5 feels, 4 borders, 4 shapes
 * Pre-validated at build time (all tokens follow naming conventions)
 */
export const DEFAULT_TOKENS: TokenDefinitions = {
  // Colors (8)
  'color-blue': { stroke: '#2563eb', fill: '#dbeafe' },
  'color-red': { stroke: '#dc2626', fill: '#fee2e2' },
  'color-mint': { stroke: '#059669', fill: '#d1fae5' },
  'color-yellow': { stroke: '#ca8a04', fill: '#fef9c3' },
  'color-gray': { stroke: '#64748b', fill: '#f1f5f9' },
  'color-purple': { stroke: '#7c3aed', fill: '#ede9fe' },
  'color-orange': { stroke: '#ea580c', fill: '#fed7aa' },
  'color-pink': { stroke: '#db2777', fill: '#fce7f3' },

  // Sizes (6) - fontSize only, width/height are auto-calculated based on content
  h1: { fontSize: 24 },
  h2: { fontSize: 20 },
  h3: { fontSize: 18 },
  h4: { fontSize: 16 },
  h5: { fontSize: 14 },
  h6: { fontSize: 12 },

  // Feel (5) - roughness levels for hand-drawn appearance
  smooth: { roughness: 0.5 },
  neat: { roughness: 1.0 },
  rough: { roughness: 1.5 },
  sketchy: { roughness: 2.0 },
  messy: { roughness: 2.5 },

  // Border (4) - stroke width
  thin: { strokeWidth: 1 },
  normal: { strokeWidth: 2 },
  thick: { strokeWidth: 3 },
  bold: { strokeWidth: 4 },

  // Shape (4) - geometric forms
  'shape-none': { shape: 'none' }, // No background shape (text only)
  'shape-rect': { shape: 'rect' }, // Rectangle
  'shape-circle': { shape: 'circle' }, // Circle
  'shape-rounded': { shape: 'rounded' }, // Rounded rectangle
};

/**
 * Parse a space-separated token string into a merged StyleObject
 * Resolves composite tokens recursively with depth limit
 * Last token wins for conflicting properties (Object.assign behavior)
 *
 * @param style - Space-separated token names (e.g., "color-blue h4 neat")
 * @param tokenDefinitions - Token library (DEFAULT_TOKENS + custom user tokens)
 * @param depth - Recursion depth counter (default 0, max 10)
 * @returns Merged StyleObject with all resolved properties
 *
 * @example
 * parseTokens('color-blue h4 neat', DEFAULT_TOKENS)
 * // Returns: { stroke: '#2563eb', fill: '#dbeafe', width: 200, height: 140, fontSize: 16, roughness: 1.0 }
 */
export function parseTokens(
  style: string,
  tokenDefinitions: TokenDefinitions,
  depth = 0
): StyleObject {
  // T093: Performance tracking for parseTokens (only at depth 0 to avoid nested logging)
  const isTopLevel = depth === 0;
  if (isTopLevel) {
    performance.mark('parseTokens-start');
  }

  // Recursion depth limit prevents infinite loops
  if (depth > 10) {
    console.warn(
      `Token recursion depth exceeded (max 10 levels). Style: "${style}"`
    );
    return {};
  }

  const tokens = style.split(' ').filter(Boolean);
  let result: StyleObject = {};

  for (const tokenName of tokens) {
    const resolvedStyle = resolveToken(tokenName, tokenDefinitions, depth);
    // Last token wins (Object.assign merges properties, overwriting conflicts)
    Object.assign(result, resolvedStyle);
  }

  // T093: Log if parsing is slow (>10ms)
  if (isTopLevel) {
    performance.mark('parseTokens-end');
    performance.measure('parseTokens', 'parseTokens-start', 'parseTokens-end');
    const measure = performance.getEntriesByName('parseTokens')[0];
    if (measure.duration > 10) {
      console.warn(
        `Slow token parsing detected: ${measure.duration.toFixed(2)}ms for "${style}"`
      );
    }
  }

  return result;
}

/**
 * Resolve a single token to its StyleObject
 * Handles both atomic (object) and composite (string) tokens
 *
 * @param tokenName - Single token name to resolve
 * @param tokenDefinitions - Token library
 * @param depth - Current recursion depth
 * @returns Resolved StyleObject (empty if token not found)
 */
export function resolveToken(
  tokenName: string,
  tokenDefinitions: TokenDefinitions,
  depth: number
): StyleObject {
  const value = tokenDefinitions[tokenName];

  if (!value) {
    console.warn(`Unknown token: "${tokenName}"`);
    return {};
  }

  // Atomic token: return style object directly
  if (typeof value === 'object') {
    return value;
  }

  // Composite token: recursively parse the string reference
  if (typeof value === 'string') {
    return parseTokens(value, tokenDefinitions, depth + 1);
  }

  // Should never reach here due to TypeScript types, but defensive check
  console.warn(`Invalid token value type for "${tokenName}":`, value);
  return {};
}
