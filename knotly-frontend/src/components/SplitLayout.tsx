/**
 * SplitLayout Component
 * Provides adjustable split pane layout for Markdown Editor and Canvas
 *
 * Features:
 * - Drag divider to adjust split ratio (Constitution Principle VIII: Quality UX)
 * - 30-70% constraint range for both panes
 * - LocalStorage persistence across sessions
 * - WCAG 2.1 AA accessibility (keyboard navigation, ARIA attributes)
 *
 * Dependencies: react-split@^2.0.14
 */

import { useState, useEffect, type ReactNode, type KeyboardEvent } from 'react';
import Split from 'react-split';
import { clampSplitRatio, loadSplitRatio, saveSplitRatio } from '../../tests/unit/splitRatio.test';

interface SplitLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

/**
 * SplitLayout - Adjustable two-pane layout with persistence
 *
 * T079: Uses react-split with sizes=[50, 50] default
 * T080: LocalStorage persistence with 'split-sizes' key
 * T081: useEffect to restore ratio on mount
 * T082: onDrag handler persists to LocalStorage
 * T083: Clamping logic (30-70%) in onDrag
 * T084: ARIA attributes on gutter
 * T085: Keyboard navigation (ArrowLeft/ArrowRight)
 */
export function SplitLayout({ left, right }: SplitLayoutProps) {
  // T079: Default split ratio 50-50
  const [sizes, setSizes] = useState<number[]>([50, 50]);

  // T081: Restore split ratio from LocalStorage on mount
  useEffect(() => {
    const savedSizes = loadSplitRatio();
    if (savedSizes) {
      setSizes(savedSizes);
    }
  }, []);

  /**
   * T082-T083: Handle drag events with clamping and persistence
   * Clamps ratios to 30-70% range and saves to LocalStorage
   */
  const handleDrag = (newSizes: number[]) => {
    // T083: Clamp each pane to 30-70% range
    const clampedSizes = [
      clampSplitRatio(newSizes[0]),
      clampSplitRatio(newSizes[1]),
    ];

    // Ensure ratios sum to 100%
    const sum = clampedSizes[0] + clampedSizes[1];
    if (sum !== 100) {
      // Adjust second pane to maintain 100% total
      clampedSizes[1] = 100 - clampedSizes[0];
    }

    setSizes(clampedSizes);

    // T082: Persist to LocalStorage
    saveSplitRatio(clampedSizes);
  };

  /**
   * T085: Keyboard navigation for WCAG 2.1 AA compliance
   * ArrowLeft: Decrease left pane (increase right pane)
   * ArrowRight: Increase left pane (decrease right pane)
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const STEP = 5; // 5% per arrow key press

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const newLeftSize = clampSplitRatio(sizes[0] - STEP);
      const newSizes = [newLeftSize, 100 - newLeftSize];
      handleDrag(newSizes);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const newLeftSize = clampSplitRatio(sizes[0] + STEP);
      const newSizes = [newLeftSize, 100 - newLeftSize];
      handleDrag(newSizes);
    }
  };

  return (
    <Split
      sizes={sizes}
      minSize={[300, 300]} // Minimum 300px per pane
      onDrag={handleDrag}
      className="split-layout flex w-full h-full"
      gutterSize={8}
      gutterStyle={() => ({
        backgroundColor: '#e5e7eb', // Tailwind gray-200
        cursor: 'col-resize',
        width: '8px',
        position: 'relative',
      })}
      /**
       * T084: ARIA attributes for accessibility
       */
      gutter={(_index, direction) => {
        const gutter = document.createElement('div');
        gutter.className = `gutter gutter-${direction}`;

        // ARIA attributes
        gutter.setAttribute('role', 'separator');
        gutter.setAttribute('aria-orientation', 'vertical');
        gutter.setAttribute('aria-label', 'Resize split panes');
        gutter.setAttribute('tabIndex', '0');

        // T085: Keyboard event listener
        gutter.addEventListener('keydown', handleKeyDown as any);

        // Visual indicator for focus
        gutter.style.outline = 'none';
        gutter.addEventListener('focus', () => {
          gutter.style.backgroundColor = '#3b82f6'; // Tailwind blue-500
        });
        gutter.addEventListener('blur', () => {
          gutter.style.backgroundColor = '#e5e7eb'; // Tailwind gray-200
        });

        return gutter;
      }}
    >
      {/* Left pane (Markdown Editor) */}
      <div className="split-pane-left overflow-auto h-full">{left}</div>

      {/* Right pane (Canvas) */}
      <div className="split-pane-right overflow-auto h-full">{right}</div>
    </Split>
  );
}
