/**
 * Type definitions for Markdown Mind Map Editor
 * Extends canvas.ts with markdown-specific node types and state
 * Based on specs/004-markdown-mindmap-editor/contracts/markdown-api.ts
 */

// ============================================================================
// Result Type (Error as Value Pattern - Constitution Principle I)
// ============================================================================

/**
 * Result type for error as value pattern
 * All repository functions return Result instead of throwing exceptions
 */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// ============================================================================
// Node Types (Discriminated Union - Constitution Principle II)
// ============================================================================

/**
 * Base properties shared by all markdown node types
 */
export interface BaseNode {
  id: string;                     // UUID v4
  content: string;                // Display text (cleaned, no style tokens)
  style: string;                  // Space-separated style classes (e.g., "color-red h3")
  position: { x: number; y: number }; // Canvas coordinates
  measuredSize?: {                // Size measured after rendering
    width: number;                // px
    height: number;               // px
  };
  groupId?: string;               // Optional group identifier (from --- separator)
}

/**
 * Text node (list items)
 * Represents markdown list items (`- Item`, `  - Nested`)
 */
export interface TextNode extends BaseNode {
  type: 'text';
  level: number;                  // List indentation depth (1-5)
}

/**
 * Header node (markdown headers)
 * Represents markdown headers (`#`, `##`, `###`, etc.)
 */
export interface HeaderNode extends BaseNode {
  type: 'header';
  level: number;                  // Header depth (1-6 for h1-h6)
}

/**
 * Code node (code blocks)
 * Represents fenced code blocks (` ```language `)
 */
export interface CodeNode extends BaseNode {
  type: 'code';
  language: string;               // Syntax language (e.g., 'javascript', 'python')
  expanded?: boolean;             // UI state: preview (false) or full (true)
}

/**
 * Image node (images)
 * Represents markdown images (`![alt](url)`)
 */
export interface ImageNode extends BaseNode {
  type: 'image';
  imageUrl: string;               // Image source URL
  altText: string;                // Alternative text
}

/**
 * Discriminated union of all markdown node types
 */
export type MarkdownNode = TextNode | HeaderNode | CodeNode | ImageNode;

/**
 * Edge representing hierarchical relationship
 * Created automatically based on markdown structure
 */
export interface Edge {
  id: string;                     // UUID v4
  sourceId: string;               // Parent node ID
  targetId: string;               // Child node ID
}

/**
 * Layout algorithm type
 */
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
