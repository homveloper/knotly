import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { useCanvasStore } from '../store/canvasStore';

interface GridBackgroundProps {
  width?: number;
  height?: number;
  spacing?: number;
}

/**
 * GridBackground Component
 *
 * Renders an infinite grid background with 20px spacing
 * Only displays when gridEnabled is true in store
 *
 * Performance:
 * - useMemo to prevent line regeneration on every render
 * - Only re-renders when width, height, or spacing changes
 * - Efficiently handles large canvas (2000x2000px+)
 *
 * Architecture:
 * - SVG group containing horizontal and vertical lines
 * - Rendered as first child in Canvas so nodes appear above
 * - Light gray color (#e5e5e5) for visual guide
 */

export function GridBackground({
  width = 2000,
  height = 2000,
  spacing = 20,
}: GridBackgroundProps) {
  const gridEnabled = useCanvasStore((state) => state.gridEnabled);

  // Memoize line generation to prevent performance issues
  // 2000x2000 canvas with 20px spacing = 200 lines (100 vertical + 100 horizontal)
  const lines = useMemo(() => {
    const result: ReactElement[] = [];

    // Vertical lines
    for (let x = 0; x <= width; x += spacing) {
      result.push(
        <line
          key={`v${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#e5e5e5"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += spacing) {
      result.push(
        <line
          key={`h${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#e5e5e5"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      );
    }

    return result;
  }, [width, height, spacing]);

  // Only render if grid is enabled
  if (!gridEnabled) {
    return null;
  }

  return (
    <g
      className="grid-background"
      style={{
        pointerEvents: 'none', // Don't interfere with node interactions
      }}
    >
      {lines}
    </g>
  );
}
