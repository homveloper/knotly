import { useCanvasStore } from '../store/canvasStore';

/**
 * Settings Component
 *
 * Provides UI controls for canvas settings:
 * - Grid display toggle (show/hide grid background)
 * - Snap-to-grid toggle (enable/disable grid alignment)
 *
 * Features:
 * - Styled as floating toolbar in top-left corner
 * - Toggle buttons for easy on/off switching
 * - Real-time state updates via store actions
 * - Mobile-friendly with adequate touch targets
 *
 * Layout:
 * - Fixed position top-left
 * - Horizontal button layout
 * - Tailwind CSS styling
 */

export function Settings() {
  const gridEnabled = useCanvasStore((state) => state.gridEnabled);
  const snapEnabled = useCanvasStore((state) => state.snapEnabled);
  const toggleGrid = useCanvasStore((state) => state.toggleGrid);
  const toggleSnap = useCanvasStore((state) => state.toggleSnap);

  return (
    <div className="fixed top-4 left-4 flex gap-2 bg-white rounded-lg shadow-lg p-2 z-10">
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

      {/* Snap-to-Grid Toggle */}
      <button
        onClick={toggleSnap}
        className={`px-4 py-2 rounded font-medium transition-all text-sm ${
          snapEnabled
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="Toggle snap-to-grid alignment"
        aria-label="Toggle snap-to-grid"
      >
        Snap: {snapEnabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
