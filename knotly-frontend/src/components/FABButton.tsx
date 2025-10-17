import { useCanvasStore } from '../store/canvasStore';

/**
 * FABButton - Floating Action Button for creating new nodes
 *
 * Features:
 * - Fixed position bottom-right corner
 * - Calculates viewport center accounting for zoom and pan
 * - Calls createNode with calculated center position
 * - Styled with Tailwind CSS for mobile-first UX
 * - On tap/click, creates new node at canvas center
 */

export function FABButton() {
  const { createNode, zoom, pan } = useCanvasStore();

  /**
   * Calculate the center point in canvas coordinates
   * Accounts for:
   * - Current zoom level (scale factor)
   * - Current pan offset (viewport translation)
   * - Viewport dimensions (window size)
   *
   * Formula:
   * canvas_center_x = (viewport_center_x - pan.x) / zoom
   * canvas_center_y = (viewport_center_y - pan.y) / zoom
   */
  const handleCreateNode = () => {
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    const canvasCenter = {
      x: (viewportCenterX - pan.x) / zoom,
      y: (viewportCenterY - pan.y) / zoom,
    };

    createNode(canvasCenter);
  };

  return (
    <button
      onClick={handleCreateNode}
      className="fixed bottom-4 right-4 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-600 active:scale-95 transition-all duration-75"
      aria-label="Add new node"
      title="Tap to create a new node"
    >
      +
    </button>
  );
}
