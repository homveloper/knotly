/**
 * LayoutSelector Component
 * Allows users to toggle between radial and horizontal layouts
 *
 * Features:
 * - Two layout buttons: "🌟 Radial" and "➡️ Horizontal"
 * - Active layout highlighted with background color
 * - Triggers layout recalculation and markdown serialization
 * - Error notification UI for layout errors (T109)
 *
 * Dependencies: canvasStore for layout state management
 */

import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { LayoutType } from '../types/markdown';

/**
 * T098: LayoutSelector component with emoji buttons
 * T104: Layout change handler calling canvasStore.setLayout
 * T105: Trigger serializeAndUpdateMarkdown after layout change
 * T109: Error notification UI for layout errors
 */
export function LayoutSelector() {
  const layout = useCanvasStore((state) => state.layout as LayoutType);
  const [error, setError] = useState<string | null>(null);

  /**
   * T104-T105: Handle layout change
   * 1. Call canvasStore.setLayout to recalculate positions
   * 2. Trigger markdown serialization to persist layout comment
   */
  const handleLayoutChange = (newLayout: LayoutType) => {
    try {
      setError(null);

      // Get store reference
      const store = useCanvasStore.getState();

      // Check if setLayout action exists
      if (typeof store.setLayout === 'function') {
        // T104: Call setLayout action (will apply layout and update nodes)
        store.setLayout(newLayout);

        // T105: Markdown serialization happens automatically via
        // MarkdownEditor's subscription to nodes changes
      } else {
        // Fallback: just update layout field if setLayout not implemented yet
        useCanvasStore.setState({ layout: newLayout });
      }
    } catch (err) {
      // T109: Show error notification
      const message = err instanceof Error ? err.message : 'Failed to apply layout';
      setError(message);
      console.error('Layout error:', err);
    }
  };

  return (
    <div className="layout-selector flex flex-col gap-2">
      {/* Layout buttons */}
      <div className="flex gap-2 bg-white border border-gray-300 rounded-lg p-2 shadow-sm">
        <button
          onClick={() => handleLayoutChange('radial')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${
              layout === 'radial'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
          aria-label="Switch to radial layout"
          aria-pressed={layout === 'radial'}
        >
          <span>🌟</span>
          <span>Radial</span>
        </button>

        <button
          onClick={() => handleLayoutChange('horizontal')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${
              layout === 'horizontal'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
          aria-label="Switch to horizontal layout"
          aria-pressed={layout === 'horizontal'}
        >
          <span>➡️</span>
          <span>Horizontal</span>
        </button>
      </div>

      {/* T109: Error notification UI */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-md p-2 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <span className="text-red-500">⚠️</span>
            <div>
              <div className="font-semibold">Layout Error</div>
              <div>{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
