import { useEffect, useRef, useMemo } from 'react';
import rough from 'roughjs';
import { useCanvasStore } from '../store/canvasStore';
import { parseTokens } from '../utils/tokenParser';
import { estimateNodeSize } from '../utils/canvasHelpers';
import type { Node } from '../types/canvas';

interface NodeComponentProps {
  node: Node;
}

/**
 * NodeComponent - Read-only rendering of a single node
 *
 * Features:
 * - Token-based styling (e.g., "color-yellow h4 neat")
 * - Hand-drawn shapes rendered with rough.js
 * - Text display (no editing - use MarkdownEditor for editing)
 * - Auto-sizing based on content
 *
 * Note: Canvas is read-only in Feature 004.
 * All editing is done via MarkdownEditor (left pane).
 */
export function NodeComponent({ node }: NodeComponentProps) {
  // Read-only subscriptions (no editing actions)
  const tokenDefinitions = useCanvasStore((state) => state.tokenDefinitions);

  const svgRef = useRef<SVGSVGElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null); // For DOM measurement

  // Parse token-based style
  const parsedStyle = useMemo(
    () => parseTokens(node.style, tokenDefinitions),
    [node.style, tokenDefinitions]
  );

  // Extract style properties
  const fontSize = parsedStyle.fontSize || 16;
  const fontWeight = parsedStyle.fontWeight || 400;
  const stroke = parsedStyle.stroke || '#ca8a04';
  const fill = parsedStyle.fill || '#fef9c3';
  const strokeWidth = parsedStyle.strokeWidth || 2;
  const roughness = parsedStyle.roughness || 1.0;
  const shape = parsedStyle.shape || 'none'; // Default: no shape (text only)

  // Calculate node size: use measured size if available, otherwise estimate
  let width: number;
  let height: number;

  if (node.measuredSize) {
    // Use cached measurement from store
    width = node.measuredSize.width;
    height = node.measuredSize.height;
  } else {
    // Estimate from content (hybrid approach - Phase 1)
    const estimated = estimateNodeSize(node.content, fontSize);
    width = estimated.width;
    height = estimated.height;
  }

  /**
   * Render rough.js shape based on token-based styling
   * Shape can be: 'none', 'rect', 'circle', 'rounded'
   */
  useEffect(() => {
    if (!svgRef.current) return;

    svgRef.current.replaceChildren();

    // If shape is 'none', don't render any shape (text only)
    if (shape === 'none') return;

    const rc = rough.svg(svgRef.current);

    // Generate seed from node ID for consistent rendering
    let hash = 0;
    for (let i = 0; i < node.id.length; i++) {
      hash = ((hash << 5) - hash) + node.id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    const shapeOptions = {
      fill,
      fillStyle: 'solid' as const,
      stroke,
      strokeWidth,
      roughness,
      seed,
    };

    // Render shape based on token
    let shapeElement: SVGElement;
    if (shape === 'rect') {
      shapeElement = rc.rectangle(0, 0, width, height, shapeOptions);
    } else if (shape === 'circle') {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2;
      shapeElement = rc.circle(centerX, centerY, radius * 2, shapeOptions);
    } else if (shape === 'rounded') {
      // Rounded rectangle with 16px border radius
      shapeElement = rc.rectangle(0, 0, width, height, {
        ...shapeOptions,
        // @ts-ignore - rough.js doesn't have proper types for this
        bowing: 0.5,
      });
    } else {
      // Fallback to rectangle
      shapeElement = rc.rectangle(0, 0, width, height, shapeOptions);
    }

    svgRef.current.appendChild(shapeElement);
  }, [width, height, fill, stroke, strokeWidth, roughness, shape, node.id]);

  // Read-only: no event handlers or interactions

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Rough.js shape (rect, circle, rounded, or none) */}
      <svg
        ref={svgRef}
        x={node.position.x}
        y={node.position.y}
        width={width}
        height={height}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      />

      {/* Background layer for Z-order (text appears above connection lines) */}
      <rect
        x={node.position.x}
        y={node.position.y}
        width={width}
        height={height}
        fill="#fafafa"
        style={{ pointerEvents: 'none' }}
      />

      {/* Text content (read-only display) */}
      <foreignObject
        x={node.position.x + 5}
        y={node.position.y + 5}
        width={width - 10}
        height={height - 10}
        style={{ pointerEvents: 'none' }}
      >
        {/* Display div - always visible (no editing mode) */}
        <div
          ref={textContentRef}
          style={{
            width: 'max-content',
            height: 'auto',
            maxWidth: '100%',
            padding: '4px',
            fontFamily: 'Nanum Pen Script, cursive',
            fontSize: `${fontSize}px`,
            fontWeight,
            color: '#333',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ whiteSpace: 'pre' }}>{node.content || ''}</span>
        </div>
      </foreignObject>
    </g>
  );
}
