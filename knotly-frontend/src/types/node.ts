/**
 * TypeScript Type Contracts for Handdrawn Canvas Prototype
 *
 * Feature: 001-handdrawn-canvas-prototype
 * Purpose: Define type-safe contracts for Node entity and related value objects
 *
 * These types enforce the data model documented in data-model.md at compile time.
 * TypeScript strict mode is enabled, ensuring null safety and complete type coverage.
 */

/**
 * Position Value Object
 *
 * Represents 2D coordinates for a node's center point on the canvas.
 *
 * Coordinate System:
 * - Origin (0, 0) is top-left corner of canvas
 * - x increases rightward (max: 800 for this prototype)
 * - y increases downward (max: 600 for this prototype)
 *
 * @property x - Horizontal position in pixels from left edge
 * @property y - Vertical position in pixels from top edge
 */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/**
 * NodeStyle Value Object
 *
 * Visual styling properties for rendering a node with hand-drawn appearance.
 * These properties map directly to rough.js rendering options.
 *
 * @property backgroundColor - Fill color in hex format (e.g., "#FFE082")
 * @property strokeColor - Outline color in hex format (e.g., "#000")
 * @property strokeWidth - Outline thickness in pixels (typically 1-5)
 */
export interface NodeStyle {
  readonly backgroundColor: string;
  readonly strokeColor: string;
  readonly strokeWidth: number;
}

/**
 * NodeType Enumeration
 *
 * Defines available shape types for nodes.
 * Currently only "circle" is supported in this prototype.
 * Other types are reserved for future milestones.
 */
export type NodeType = "circle" | "rectangle" | "cloud";

/**
 * Node Entity
 *
 * Represents a single visual element on the canvas with hand-drawn styling.
 * In this prototype, exactly one node is rendered at a fixed position.
 *
 * Immutability:
 * All properties are readonly to enforce immutability (Constitution Principle V).
 * Mutations should create new Node objects rather than modifying existing ones.
 *
 * @property id - Unique identifier (e.g., "node-1")
 * @property position - Center coordinates of the node
 * @property content - Text displayed inside the node (supports Korean text)
 * @property type - Shape type (only "circle" supported in prototype)
 * @property style - Visual styling properties
 */
export interface Node {
  readonly id: string;
  readonly position: Position;
  readonly content: string;
  readonly type: NodeType;
  readonly style: NodeStyle;
}

/**
 * Prototype Node Data
 *
 * Hardcoded node used for design validation in this prototype.
 * This is the only node that will be rendered.
 *
 * Specifications:
 * - Positioned at canvas center (400, 300) for 800x600 viewport
 * - Yellow background (#FFE082) for warmth and friendliness
 * - Black outline (#000) for contrast and definition
 * - 2px stroke width for visible but non-intrusive outline
 * - Korean text to validate internationalization
 *
 * Performance Note:
 * This static data ensures the prototype meets the <1s load time requirement (SC-003).
 */
export const PROTOTYPE_NODE: Node = {
  id: "node-1",
  position: {
    x: 400, // Horizontal center of 800px canvas
    y: 300, // Vertical center of 600px canvas
  },
  content: "손글씨 노트 프로토타입", // Korean: "Handwritten note prototype"
  type: "circle",
  style: {
    backgroundColor: "#FFE082", // Yellow (warm color)
    strokeColor: "#000",        // Black (high contrast)
    strokeWidth: 2,             // 2px outline
  },
} as const; // 'as const' ensures complete immutability

/**
 * Rendering Configuration
 *
 * Additional constants used during rendering that are not part of the data model.
 * These are separated to keep the Node entity clean and focused on data.
 */
export const RENDERING_CONFIG = {
  /**
   * Canvas dimensions (fixed for prototype)
   */
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  CANVAS_BACKGROUND: "#fafafa", // Light gray background

  /**
   * Circle node rendering parameters
   */
  CIRCLE_DIAMETER: 150, // Size of the circle in pixels
  ROUGHNESS: 1.2,       // Slight hand-drawn imperfection (per spec)
  FILL_STYLE: "solid",  // Solid fill (not hatched or crosshatched)

  /**
   * Text rendering parameters
   */
  FONT_FAMILY: "'Nanum Pen Script', cursive", // Primary + fallback fonts
  FONT_SIZE: 18,         // 18px font size (per spec)
  LINE_SPACING: 1.5,     // Line height multiplier
  TEXT_COLOR: "#333",    // Dark gray text
  TEXT_Y_OFFSET: 5,      // Vertical offset for visual centering
} as const;

/**
 * Type Guards
 *
 * Runtime type checking functions for defensive programming.
 * These are useful when integrating with untyped external data in future milestones.
 */

/**
 * Checks if a given type string is a valid NodeType
 */
export function isNodeType(type: unknown): type is NodeType {
  return (
    typeof type === "string" &&
    (type === "circle" || type === "rectangle" || type === "cloud")
  );
}

/**
 * Checks if an object is a valid Position
 */
export function isPosition(obj: unknown): obj is Position {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "x" in obj &&
    "y" in obj &&
    typeof obj.x === "number" &&
    typeof obj.y === "number"
  );
}

/**
 * Checks if an object is a valid NodeStyle
 */
export function isNodeStyle(obj: unknown): obj is NodeStyle {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "backgroundColor" in obj &&
    "strokeColor" in obj &&
    "strokeWidth" in obj &&
    typeof obj.backgroundColor === "string" &&
    typeof obj.strokeColor === "string" &&
    typeof obj.strokeWidth === "number"
  );
}

/**
 * Checks if an object is a valid Node
 */
export function isNode(obj: unknown): obj is Node {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "position" in obj &&
    "content" in obj &&
    "type" in obj &&
    "style" in obj &&
    typeof obj.id === "string" &&
    isPosition(obj.position) &&
    typeof obj.content === "string" &&
    isNodeType(obj.type) &&
    isNodeStyle(obj.style)
  );
}

/**
 * Validation Result Type (for future use)
 *
 * Error-as-value pattern per Constitution Principle I.
 * Not used in prototype (data is hardcoded and known valid),
 * but included for forward compatibility.
 */
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Validates a Position object
 *
 * Ensures coordinates are within canvas bounds and non-negative.
 * Returns error-as-value per Constitution Principle I.
 */
export function validatePosition(pos: Position): ValidationResult<Position> {
  if (pos.x < 0 || pos.x > RENDERING_CONFIG.CANVAS_WIDTH) {
    return {
      ok: false,
      error: `Position x (${pos.x}) is out of canvas bounds (0-${RENDERING_CONFIG.CANVAS_WIDTH})`,
    };
  }
  if (pos.y < 0 || pos.y > RENDERING_CONFIG.CANVAS_HEIGHT) {
    return {
      ok: false,
      error: `Position y (${pos.y}) is out of canvas bounds (0-${RENDERING_CONFIG.CANVAS_HEIGHT})`,
    };
  }
  return { ok: true, value: pos };
}

/**
 * Validates a hex color string
 *
 * Ensures color is in valid hex format (#RGB or #RRGGBB).
 */
export function validateHexColor(color: string): ValidationResult<string> {
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  if (!hexPattern.test(color)) {
    return {
      ok: false,
      error: `Invalid hex color: ${color}. Must be #RGB or #RRGGBB format.`,
    };
  }
  return { ok: true, value: color };
}

/**
 * Validates a NodeStyle object
 *
 * Checks that colors are valid hex and stroke width is positive.
 */
export function validateNodeStyle(style: NodeStyle): ValidationResult<NodeStyle> {
  const bgResult = validateHexColor(style.backgroundColor);
  if (!bgResult.ok) return bgResult;

  const strokeResult = validateHexColor(style.strokeColor);
  if (!strokeResult.ok) return strokeResult;

  if (style.strokeWidth <= 0) {
    return {
      ok: false,
      error: `Stroke width must be positive, got ${style.strokeWidth}`,
    };
  }

  return { ok: true, value: style };
}

/**
 * Validates a Node object
 *
 * Comprehensive validation of all node properties.
 * Returns error-as-value per Constitution Principle I.
 */
export function validateNode(node: Node): ValidationResult<Node> {
  if (!node.id || node.id.trim() === "") {
    return { ok: false, error: "Node ID must be non-empty string" };
  }

  const posResult = validatePosition(node.position);
  if (!posResult.ok) return posResult;

  if (!node.content || node.content.trim() === "") {
    return { ok: false, error: "Node content must be non-empty string" };
  }

  if (node.type !== "circle") {
    return {
      ok: false,
      error: `Node type "${node.type}" is not supported in this prototype. Only "circle" is supported.`,
    };
  }

  const styleResult = validateNodeStyle(node.style);
  if (!styleResult.ok) return styleResult;

  return { ok: true, value: node };
}

/**
 * Usage Example (for documentation)
 *
 * This comment block shows how these types and functions should be used.
 * It is not executable code, just documentation.
 *
 * ```typescript
 * import { PROTOTYPE_NODE, RENDERING_CONFIG, validateNode } from './contracts/node-structure';
 *
 * // Access hardcoded prototype node
 * const node = PROTOTYPE_NODE;
 *
 * // Validate node (always passes for PROTOTYPE_NODE)
 * const result = validateNode(node);
 * if (!result.ok) {
 *   console.error(result.error);
 *   return; // Early return per Constitution I
 * }
 *
 * // Use node data for rendering
 * const { position, content, style } = result.value;
 * const config = RENDERING_CONFIG;
 *
 * // Render with rough.js
 * const circle = roughSvg.circle(
 *   position.x,
 *   position.y,
 *   config.CIRCLE_DIAMETER,
 *   {
 *     roughness: config.ROUGHNESS,
 *     fill: style.backgroundColor,
 *     stroke: style.strokeColor,
 *     strokeWidth: style.strokeWidth,
 *     fillStyle: config.FILL_STYLE,
 *   }
 * );
 * ```
 */
