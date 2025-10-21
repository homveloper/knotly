import { useCanvasStore } from '../store/canvasStore';

/**
 * Settings Component
 *
 * Provides UI controls for canvas visualization settings:
 * - Grid display toggle (show/hide grid background)
 *
 * Features:
 * - Styled as floating toolbar in top-left corner
 * - Toggle button for easy on/off switching
 * - Real-time state updates via store actions
 * - Mobile-friendly with adequate touch targets
 *
 * Note: Canvas is read-only in Feature 004. Snap-to-grid removed as editing
 * is now done exclusively via MarkdownEditor.
 */

export function Settings() {
  const gridEnabled = useCanvasStore((state) => state.gridEnabled);
  const toggleGrid = useCanvasStore((state) => state.toggleGrid);

  return (
    <div className="fixed top-4 left-4 bg-white rounded-lg shadow-lg p-2 z-10">
      {/* Grid Display Toggle */}
      <button
        onClick={toggleGrid}
        className={`px-4 py-2 rounded font-medium transition-all text-sm ${
          gridEnabled
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="Toggle grid display"
        aria-label="Toggle grid display"
      >
        Grid: {gridEnabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
