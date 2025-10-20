/**
 * API Contracts for Markdown Mind Map Editor
 *
 * This file defines TypeScript interfaces for the repository layer functions
 * that handle markdown parsing, serialization, and layout calculations.
 *
 * All functions follow Constitution Principles:
 * - Principle I: Error as Value (Result types, no exceptions)
 * - Principle II: Composition over Inheritance (no class hierarchies)
 * - Principle III: Explicit Dependencies (all deps passed as args)
 * - Principle IV: Factory Functions (no constructors)
 */

// ============================================================================
// Result Type (Error as Value Pattern)
// ============================================================================

/**
 * Result type for error as value pattern (Constitution Principle I)
 * All repository functions return Result instead of throwing exceptions
 */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// ============================================================================
// Node Types (from data-model.md)
// ============================================================================

export interface BaseNode {
  id: string;
  content: string;
  style: string;
  position: { x: number; y: number };
  measuredSize?: { width: number; height: number };
  groupId?: string;
}

export interface TextNode extends BaseNode {
  type: 'text';
  level: number; // 1-5 for list indentation
}

export interface HeaderNode extends BaseNode {
  type: 'header';
  level: number; // 1-6 for h1-h6
}

export interface CodeNode extends BaseNode {
  type: 'code';
  language: string;
  expanded?: boolean; // UI state only
}

export interface ImageNode extends BaseNode {
  type: 'image';
  imageUrl: string;
  altText: string;
}

export type Node = TextNode | HeaderNode | CodeNode | ImageNode;

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

export type LayoutType = 'radial' | 'horizontal';

// ============================================================================
// Error Types
// ============================================================================

export interface ParseError {
  type: 'syntax_error' | 'token_extraction_error' | 'invalid_structure';
  message: string;
  line?: number;
  column?: number;
  token?: string;
}

export interface SerializeError {
  type: 'invalid_node' | 'invalid_edge' | 'circular_reference';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface LayoutError {
  type: 'missing_measured_size' | 'circular_dependency' | 'invalid_layout_type';
  message: string;
  nodeId?: string;
}

export interface ValidationError {
  type: 'invalid_field' | 'out_of_range' | 'required_field';
  message: string;
  field: string;
  value?: any;
}

// ============================================================================
// Parser API
// ============================================================================

/**
 * Markdown Parser Interface
 * Converts markdown text into graph structure (nodes + edges)
 */
export interface IMarkdownParser {
  /**
   * Parse markdown text into nodes and edges
   *
   * @param text - Raw markdown text
   * @returns Result with parsed nodes, edges, and layout, or ParseError
   *
   * @example
   * const result = parser.parse('# Hello\n- World');
   * if (result.ok) {
   *   const { nodes, edges, layout } = result.value;
   * } else {
   *   console.error(result.error.message);
   * }
   */
  parse(text: string): Result<
    { nodes: Node[]; edges: Edge[]; layout: LayoutType },
    ParseError
  >;
}

/**
 * Parse markdown text into nodes and edges (function signature)
 *
 * @param text - Raw markdown text
 * @returns Result with parsed nodes, edges, and layout, or ParseError
 *
 * Implementation should:
 * 1. Extract layout comment (<!-- knotly-layout: TYPE -->)
 * 2. Use marked.lexer() to tokenize markdown
 * 3. Process tokens (heading, list, code, image, hr)
 * 4. Extract style tokens with extractStyleTokens()
 * 5. Build node hierarchy using nodeStack for headers/lists
 * 6. Create edges based on parent-child relationships
 * 7. Apply layout algorithm to calculate positions
 */
export function parseMarkdown(text: string): Result<
  { nodes: Node[]; edges: Edge[]; layout: LayoutType },
  ParseError
>;

// ============================================================================
// Serializer API
// ============================================================================

/**
 * Markdown Serializer Interface
 * Converts graph structure (nodes + edges) back to markdown text
 */
export interface IMarkdownSerializer {
  /**
   * Serialize nodes and edges to markdown text
   *
   * @param nodes - Array of nodes to serialize
   * @param edges - Array of edges (for hierarchy)
   * @param layout - Current layout type
   * @returns Result with markdown text, or SerializeError
   *
   * @example
   * const result = serializer.serialize(nodes, edges, 'radial');
   * if (result.ok) {
   *   await saveFile(result.value);
   * } else {
   *   console.error(result.error.message);
   * }
   */
  serialize(
    nodes: Node[],
    edges: Edge[],
    layout: LayoutType
  ): Result<string, SerializeError>;
}

/**
 * Serialize nodes and edges to markdown text (function signature)
 *
 * @param nodes - Array of nodes to serialize
 * @param edges - Array of edges (for hierarchy)
 * @param layout - Current layout type
 * @returns Result with markdown text, or SerializeError
 *
 * Implementation should:
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
  nodes: Node[],
  edges: Edge[],
  layout: LayoutType
): Result<string, SerializeError>;

// ============================================================================
// Layout Engine API
// ============================================================================

/**
 * Layout Engine Interface
 * Calculates node positions based on layout algorithm
 */
export interface ILayoutEngine {
  /**
   * Apply layout algorithm to nodes
   *
   * @param nodes - Array of nodes (requires measuredSize)
   * @param edges - Array of edges (defines hierarchy)
   * @param layout - Layout algorithm to use
   * @returns Result with nodes updated with new positions, or LayoutError
   *
   * @example
   * const result = layoutEngine.applyLayout(nodes, edges, 'radial');
   * if (result.ok) {
   *   setState({ nodes: result.value });
   * }
   */
  applyLayout(
    nodes: Node[],
    edges: Edge[],
    layout: LayoutType
  ): Result<Node[], LayoutError>;
}

/**
 * Apply layout algorithm to nodes (function signature)
 *
 * @param nodes - Array of nodes (requires measuredSize)
 * @param edges - Array of edges (defines hierarchy)
 * @param layout - Layout algorithm to use
 * @returns Result with nodes updated with new positions, or LayoutError
 *
 * Implementation should:
 * 1. Validate all nodes have measuredSize
 * 2. Compute node levels using BFS (computeLevels helper)
 * 3. Apply layout-specific algorithm:
 *    - radial: Center-out circular, radius = sum(maxHeightPerLevel)
 *    - horizontal: Left-to-right tree, x = sum(maxWidthPerLevel)
 * 4. Return new node array (immutable update)
 */
export function applyLayout(
  nodes: Node[],
  edges: Edge[],
  layout: LayoutType
): Result<Node[], LayoutError>;

// ============================================================================
// Helper Functions
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
};

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
export function restoreStyleTokens(content: string, tokens: string[]): string;

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
  nodes: Node[],
  edges: Edge[]
): Map<string, number>;

/**
 * Find root nodes (no incoming edges)
 *
 * @param nodes - Array of nodes
 * @param edges - Array of edges
 * @returns Array of root node IDs
 */
export function findRootNodes(nodes: Node[], edges: Edge[]): string[];

/**
 * Find children of a node
 *
 * @param nodeId - Parent node ID
 * @param edges - Array of edges
 * @returns Array of child node IDs
 */
export function findChildren(nodeId: string, edges: Edge[]): string[];

/**
 * Calculate radial layout positions
 *
 * Center-out circular layout with collision prevention
 *
 * @param nodes - Array of nodes with measuredSize
 * @param levels - Map of nodeId → level from computeLevels
 * @param center - Center point coordinates
 * @returns Map of nodeId → position
 */
export function calculateRadialPositions(
  nodes: Node[],
  levels: Map<string, number>,
  center: { x: number; y: number }
): Map<string, { x: number; y: number }>;

/**
 * Calculate horizontal layout positions
 *
 * Left-to-right tree layout with collision prevention
 *
 * @param nodes - Array of nodes with measuredSize
 * @param levels - Map of nodeId → level from computeLevels
 * @param start - Starting point coordinates
 * @returns Map of nodeId → position
 */
export function calculateHorizontalPositions(
  nodes: Node[],
  levels: Map<string, number>,
  start: { x: number; y: number }
): Map<string, { x: number; y: number }>;

// ============================================================================
// Factory Functions (Constitution Principle IV)
// ============================================================================

/**
 * Create a text node (list item)
 *
 * @param content - Display text
 * @param level - List indentation depth (1-5)
 * @param style - Space-separated style classes
 * @returns Result with TextNode or ValidationError
 */
export function createTextNode(
  content: string,
  level: number,
  style: string
): Result<TextNode, ValidationError>;

/**
 * Create a header node
 *
 * @param content - Display text
 * @param level - Header depth (1-6)
 * @param style - Space-separated style classes
 * @returns Result with HeaderNode or ValidationError
 */
export function createHeaderNode(
  content: string,
  level: number,
  style: string
): Result<HeaderNode, ValidationError>;

/**
 * Create a code node
 *
 * @param content - Code source
 * @param language - Syntax language
 * @param style - Space-separated style classes
 * @returns Result with CodeNode or ValidationError
 */
export function createCodeNode(
  content: string,
  language: string,
  style: string
): Result<CodeNode, ValidationError>;

/**
 * Create an image node
 *
 * @param altText - Alternative text
 * @param imageUrl - Image URL
 * @param style - Space-separated style classes
 * @returns Result with ImageNode or ValidationError
 */
export function createImageNode(
  altText: string,
  imageUrl: string,
  style: string
): Result<ImageNode, ValidationError>;

/**
 * Create an edge
 *
 * @param sourceId - Parent node ID
 * @param targetId - Child node ID
 * @returns Result with Edge or ValidationError
 */
export function createEdge(
  sourceId: string,
  targetId: string
): Result<Edge, ValidationError>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a node
 *
 * @param node - Node to validate
 * @returns Result with true or ValidationError
 */
export function validateNode(node: Node): Result<true, ValidationError>;

/**
 * Validate an edge
 *
 * @param edge - Edge to validate
 * @param nodes - Array of nodes (to check sourceId/targetId exist)
 * @returns Result with true or ValidationError
 */
export function validateEdge(
  edge: Edge,
  nodes: Node[]
): Result<true, ValidationError>;

/**
 * Validate layout type
 *
 * @param layout - Layout string to validate
 * @returns Result with LayoutType or ValidationError
 */
export function validateLayout(
  layout: string
): Result<LayoutType, ValidationError>;

// ============================================================================
// Constants
// ============================================================================

/**
 * Layout algorithm constants
 */
export const LAYOUT_CONSTANTS = {
  // Radial layout
  RADIAL_CENTER: { x: 500, y: 500 },
  RADIAL_LEVEL_PADDING: 40, // px between levels
  RADIAL_NODE_PADDING: 20, // px between nodes in same level

  // Horizontal layout
  HORIZONTAL_START: { x: 100, y: 100 },
  HORIZONTAL_LEVEL_PADDING_X: 50, // px between levels (x-axis)
  HORIZONTAL_NODE_PADDING_Y: 20, // px between nodes in same level (y-axis)

  // Validation
  MAX_HEADER_LEVEL: 6,
  MAX_LIST_LEVEL: 5,
  MIN_SPLIT_RATIO: 30,
  MAX_SPLIT_RATIO: 70,
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
  LAYOUT: 'radial' as LayoutType,
  SPLIT_RATIO: 50,
  STYLE: '',
  CODE_LANGUAGE: 'text',
} as const;
