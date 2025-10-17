import { useMemo } from 'react';
import { useCanvasStore } from '../store/canvasStore';

interface MentionSheetProps {
  currentNodeId: string;
  filterText: string;
  onSelect: (nodeId: string) => void;
  onClose: () => void;
}

/**
 * MentionSheet Component - Bottom sheet for @mention node selection
 *
 * Features:
 * - Displays list of nodes available for linking via @mention
 * - Dynamic filtering based on node content
 * - Excludes current node (prevents self-loops)
 * - Touch-friendly button interface
 * - Shows "No nodes available" when filter returns empty
 *
 * Rendering:
 * - Fixed bottom sheet (like ContextMenu)
 * - Scrollable list of node buttons
 * - Each button shows node content (truncated if long)
 * - Click to select node and create edge
 *
 * Performance:
 * - useMemo for filtering to prevent unnecessary recalculation
 * - Efficient list rendering with map()
 *
 * Styling:
 * - Tailwind CSS bottom sheet pattern
 * - Mobile-friendly with adequate touch targets (48px minimum)
 */

export function MentionSheet({
  currentNodeId,
  filterText,
  onSelect,
  onClose,
}: MentionSheetProps) {
  const nodes = useCanvasStore((state) => state.nodes);

  // Memoized filtered nodes list
  // - Excludes current node (prevent self-loops)
  // - Filters by content including filterText (case-insensitive)
  const filteredNodes = useMemo(() => {
    return nodes.filter(
      (node) =>
        node.id !== currentNodeId &&
        node.content.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [nodes, currentNodeId, filterText]);

  const handleNodeSelect = (nodeId: string) => {
    onSelect(nodeId);
    onClose();
  };

  return (
    <>
      {/* Backdrop - click to close */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 40,
        }}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-4 z-50"
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="mb-3 pb-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Link to Node</h3>
          <p className="text-xs text-gray-500 mt-1">Search: {filterText || '(type to search)'}</p>
        </div>

        {/* Nodes list or empty state */}
        {filteredNodes.length === 0 ? (
          <div className="py-4 px-2 text-center text-gray-500 text-sm">
            <p className="mb-2">No nodes available to link</p>
            {filterText && (
              <p className="text-xs text-gray-400">Try searching with different text</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNodes.map((node) => (
              <button
                key={node.id}
                onClick={() => handleNodeSelect(node.id)}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors text-left border border-gray-200 hover:border-blue-300"
                style={{
                  minHeight: '48px', // Touch-friendly target
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Node color preview circle */}
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: node.style.backgroundColor,
                      border: `2px solid ${node.style.strokeColor}`,
                    }}
                  />

                  {/* Node content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {node.content || '(empty)'}
                    </p>
                  </div>

                  {/* Link indicator */}
                  <div className="text-lg flex-shrink-0">→</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
