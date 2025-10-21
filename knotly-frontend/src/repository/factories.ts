/**
 * Factory functions for creating markdown nodes and edges
 * Returns Result types for error handling (Constitution Principle IV)
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  TextNode,
  HeaderNode,
  CodeNode,
  ImageNode,
  Edge,
  Result,
  ValidationError,
} from '../types/markdown';
import { LAYOUT_CONSTANTS } from '../types/markdown';
import {
  validateLevel,
  validateNonEmptyString,
  validateUrl,
} from './helpers';

// ============================================================================
// Node Factory Functions
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
  style: string = ''
): Result<TextNode, ValidationError> {
  // Validate content
  const contentResult = validateNonEmptyString(content, 'content');
  if (!contentResult.ok) {
    return contentResult;
  }

  // Validate level
  const levelResult = validateLevel(level, 1, LAYOUT_CONSTANTS.MAX_LIST_LEVEL, 'level');
  if (!levelResult.ok) {
    return levelResult;
  }

  return {
    ok: true,
    value: {
      id: uuidv4(),
      type: 'text',
      content: content.trim(),
      level,
      style,
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
      groupId: undefined,
    },
  };
}

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
  style: string = ''
): Result<HeaderNode, ValidationError> {
  // Validate content
  const contentResult = validateNonEmptyString(content, 'content');
  if (!contentResult.ok) {
    return contentResult;
  }

  // Validate level
  const levelResult = validateLevel(level, 1, LAYOUT_CONSTANTS.MAX_HEADER_LEVEL, 'level');
  if (!levelResult.ok) {
    return levelResult;
  }

  return {
    ok: true,
    value: {
      id: uuidv4(),
      type: 'header',
      content: content.trim(),
      level,
      style,
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
      groupId: undefined,
    },
  };
}

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
  style: string = ''
): Result<CodeNode, ValidationError> {
  // Validate content (can be empty for empty code blocks)
  if (typeof content !== 'string') {
    return {
      ok: false,
      error: {
        type: 'invalid_field',
        message: 'content must be a string',
        field: 'content',
        value: content,
      },
    };
  }

  // Validate language
  const languageResult = validateNonEmptyString(language, 'language');
  if (!languageResult.ok) {
    return languageResult;
  }

  return {
    ok: true,
    value: {
      id: uuidv4(),
      type: 'code',
      content,
      language: language.trim().toLowerCase(),
      style,
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
      expanded: false, // Default to collapsed
      groupId: undefined,
    },
  };
}

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
  style: string = ''
): Result<ImageNode, ValidationError> {
  // Validate altText
  const altTextResult = validateNonEmptyString(altText, 'altText');
  if (!altTextResult.ok) {
    return altTextResult;
  }

  // Validate imageUrl
  const urlResult = validateUrl(imageUrl, 'imageUrl');
  if (!urlResult.ok) {
    return urlResult;
  }

  return {
    ok: true,
    value: {
      id: uuidv4(),
      type: 'image',
      content: altText.trim(), // Use altText as content for display
      altText: altText.trim(),
      imageUrl,
      style,
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
      groupId: undefined,
    },
  };
}

// ============================================================================
// Edge Factory Function
// ============================================================================

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
): Result<Edge, ValidationError> {
  // Validate sourceId
  const sourceResult = validateNonEmptyString(sourceId, 'sourceId');
  if (!sourceResult.ok) {
    return sourceResult;
  }

  // Validate targetId
  const targetResult = validateNonEmptyString(targetId, 'targetId');
  if (!targetResult.ok) {
    return targetResult;
  }

  // Validate no self-loops
  if (sourceId === targetId) {
    return {
      ok: false,
      error: {
        type: 'invalid_field',
        message: 'Cannot create edge with same source and target (self-loop)',
        field: 'targetId',
        value: targetId,
      },
    };
  }

  return {
    ok: true,
    value: {
      id: uuidv4(),
      sourceId,
      targetId,
    },
  };
}
