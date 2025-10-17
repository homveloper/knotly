import { useCanvasStore } from '../store/canvasStore';

/**
 * ContextMenu - Bottom sheet for node customization
 *
 * Features:
 * - Displays color options: yellow (#FFE082), sky blue (#90CAF9), mint (#A5D6A7)
 * - Delete button to remove node (cascade-deletes connected edges)
 * - Positioned as fixed bottom sheet (mobile-optimized)
 * - Close button to dismiss
 *
 * Props:
 * - nodeId: ID of node being customized
 * - onClose: Callback to close the menu
 *
 * Styling:
 * - Fixed position bottom-0 left-0 right-0
 * - Rounded top corners (rounded-t-2xl)
 * - Shadow and padding for depth
 * - Color preview circles before each color option
 * - Tailwind CSS responsive design
 */

interface ContextMenuProps {
  nodeId: string;
  onClose: () => void;
}

// Color options for node styling
const COLOR_OPTIONS = [
  { label: 'Yellow', color: '#FFE082', name: 'yellow' },
  { label: 'Sky Blue', color: '#90CAF9', name: 'skyblue' },
  { label: 'Mint', color: '#A5D6A7', name: 'mint' },
];

export const ContextMenu: React.FC<ContextMenuProps> = ({ nodeId, onClose }) => {
  const updateNode = useCanvasStore((state) => state.updateNode);
  const deleteNode = useCanvasStore((state) => state.deleteNode);

  // Handle color selection
  const handleColorSelect = (color: string) => {
    updateNode(nodeId, {
      style: {
        backgroundColor: color,
        strokeColor: '#000',
        strokeWidth: 2,
      },
    });
    onClose();
  };

  // Handle node deletion
  const handleDelete = () => {
    deleteNode(nodeId);
    onClose();
  };

  return (
    <>
      {/* Backdrop - semi-transparent overlay to close menu on tap */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 39, // Below context menu (z-40)
        }}
        onClick={onClose}
      />

      {/* Bottom sheet context menu */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-4 z-40">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Customize Node</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close context menu"
          >
            ×
          </button>
        </div>

        {/* Color options */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-600 mb-3">Change Color:</p>
          <div className="flex gap-3">
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.name}
                onClick={() => handleColorSelect(option.color)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={`Change to ${option.label}`}
              >
                {/* Color preview circle */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: option.color,
                    border: '2px solid #999',
                  }}
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Delete button */}
        <div>
          <button
            onClick={handleDelete}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            title="Delete this node and connected links"
          >
            🗑️ Delete Node
          </button>
        </div>

        {/* Info text */}
        <p className="text-xs text-gray-500 text-center mt-3">
          Deleting a node will remove all connected links
        </p>
      </div>
    </>
  );
};
