import { useRef, useEffect } from 'react';
import rough from 'roughjs';
import { PROTOTYPE_NODE, RENDERING_CONFIG } from '../types/node';

/**
 * Canvas Component
 *
 * Renders a hand-drawn SVG canvas with a single prototype node.
 * Uses rough.js for hand-drawn styling and Nanum Pen Script font for text.
 *
 * This component demonstrates the warm, friendly UI/UX direction for Knotly.
 */
export const Canvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Early return if SVG ref is null (Constitution Principle I)
    if (!svgRef.current) return;

    // Create rough.js SVG generator
    const rc = rough.svg(svgRef.current);

    // Render hand-drawn circle using roughness for imperfections
    const circle = rc.circle(
      PROTOTYPE_NODE.position.x,
      PROTOTYPE_NODE.position.y,
      RENDERING_CONFIG.CIRCLE_DIAMETER,
      {
        roughness: RENDERING_CONFIG.ROUGHNESS,
        fill: PROTOTYPE_NODE.style.backgroundColor,
        stroke: PROTOTYPE_NODE.style.strokeColor,
        strokeWidth: PROTOTYPE_NODE.style.strokeWidth,
        fillStyle: RENDERING_CONFIG.FILL_STYLE,
      }
    );

    // Append circle to SVG
    svgRef.current.appendChild(circle);

    // Create text element imperatively to ensure it renders AFTER the circle
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.setAttribute('x', String(PROTOTYPE_NODE.position.x));
    textElement.setAttribute('y', String(PROTOTYPE_NODE.position.y));
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('dominant-baseline', 'middle');
    textElement.setAttribute('font-family', RENDERING_CONFIG.FONT_FAMILY);
    textElement.setAttribute('font-size', String(RENDERING_CONFIG.FONT_SIZE));
    textElement.setAttribute('fill', RENDERING_CONFIG.TEXT_COLOR);
    textElement.textContent = PROTOTYPE_NODE.content;

    // Append text AFTER circle to ensure correct z-order
    svgRef.current.appendChild(textElement);
  }, []); // Empty deps = run once on mount

  return (
    <svg
      ref={svgRef}
      width={RENDERING_CONFIG.CANVAS_WIDTH}
      height={RENDERING_CONFIG.CANVAS_HEIGHT}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Canvas background */}
      <rect
        x="0"
        y="0"
        width={RENDERING_CONFIG.CANVAS_WIDTH}
        height={RENDERING_CONFIG.CANVAS_HEIGHT}
        fill={RENDERING_CONFIG.CANVAS_BACKGROUND}
      />

      {/* Text content is rendered imperatively in useEffect to ensure correct z-order */}
    </svg>
  );
};
