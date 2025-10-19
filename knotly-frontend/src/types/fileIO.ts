// Type definitions for file I/O operations
// Implements "Error as Value" pattern from constitution.md

/**
 * Generic Result type for operations that can fail
 * Returns success with data or failure with error message
 * @template T - The type of data returned on success
 */
export type FileResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Data structure returned when loading a .knotly.md file
 * Contains parsed YAML frontmatter and extracted markdown content
 */
export interface LoadFileData {
  tokens: TokenDefinitions;
  nodes: NodeMetadata[];
  edges: EdgeTuple[];
  nodeContents: Map<string, string>; // node ID -> markdown content
}

/**
 * Token definitions from YAML frontmatter
 * Maps token names to either style properties (atomic) or composite strings
 */
export type TokenDefinitions = {
  [tokenName: string]: StyleObject | string;
};

/**
 * Style properties for atomic tokens
 */
export interface StyleObject {
  stroke?: string; // CSS color
  fill?: string; // CSS color
  strokeWidth?: number; // 1-10
  width?: number; // 80-400 px
  height?: number; // 60-300 px
  fontSize?: number; // 10-32 px
  fontWeight?: number; // 100-900
  roughness?: number; // 0-3 (hand-drawn feel)
}

/**
 * Node metadata from YAML frontmatter
 * Compact representation for file storage
 */
export interface NodeMetadata {
  id: string;
  pos: [number, number]; // [x, y] tuple
  style: string; // Space-separated token names
}

/**
 * Edge as compact [fromId, toId] tuple for file storage
 */
export type EdgeTuple = [string, string];

/**
 * Data structure for saving a .knotly.md file
 * Contains canvas state to be serialized to YAML + markdown
 */
export interface SaveFileData {
  tokens: TokenDefinitions;
  nodes: NodeMetadata[];
  edges: EdgeTuple[];
  nodeContents: Map<string, string>;
}
