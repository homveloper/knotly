import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { StylePanel } from './StylePanel';
import { createPortal } from 'react-dom';
import { useLinkMode } from './LinkModeButton';

interface FloatingToolbarProps {
  nodeId: string;
  currentStyle: string;
  position: { x: number; y: number };
  zoom: number;
  pan: { x: number; y: number };
  onClose: () => void;
}

/**
 * FloatingToolbar - Quick style selection toolbar above selected node
 *
 * Features:
 * - Horizontal icon-based layout (left to right)
 * - 8 color swatches (quick color change)
 * - 3 size buttons (H3, H4, H5 - most common)
 * - More button (opens full StylePanel)
 * - Positioned above node
 */
export function FloatingToolbar({
  nodeId,
  currentStyle,
  position,
  zoom,
  pan,
  onClose,
}: FloatingToolbarProps) {
  const updateNode = useCanvasStore((state) => state.updateNode);
  const [showFullPanel, setShowFullPanel] = useState(false);
  const { connectMode, firstNodeId, onNodeSelected, cancelConnectMode } = useLinkMode();

  // Parse current tokens
  const activeTokens = new Set(currentStyle.split(' ').filter(Boolean));

  // Color tokens with their visual colors
  const colorTokens = [
    { token: 'color-red', color: '#dc2626', label: 'Red' },
    { token: 'color-blue', color: '#2563eb', label: 'Blue' },
    { token: 'color-yellow', color: '#ca8a04', label: 'Yellow' },
    { token: 'color-mint', color: '#059669', label: 'Mint' },
    { token: 'color-purple', color: '#7c3aed', label: 'Purple' },
    { token: 'color-orange', color: '#ea580c', label: 'Orange' },
    { token: 'color-gray', color: '#64748b', label: 'Gray' },
    { token: 'color-pink', color: '#db2777', label: 'Pink' },
  ];

  // Size tokens (most common)
  const sizeTokens = ['h3', 'h4', 'h5'];

  /**
   * Toggle token (exclusive for colors and sizes)
   */
  const toggleToken = (token: string, category: 'color' | 'size') => {
    const newTokens = new Set(activeTokens);

    // Remove all tokens from same category
    if (category === 'color') {
      colorTokens.forEach((ct) => newTokens.delete(ct.token));
    } else if (category === 'size') {
      sizeTokens.forEach((st) => newTokens.delete(st));
    }

    // Add new token
    newTokens.add(token);

    // Update node
    const newStyle = Array.from(newTokens).join(' ');
    updateNode(nodeId, { style: newStyle });
  };

  /**
   * Handle link button click - toggle connect mode
   */
  const handleLinkClick = () => {
    // If already in connect mode and this is the first node, cancel
    if (connectMode && firstNodeId === nodeId) {
      cancelConnectMode();
      return;
    }

    // Otherwise, start connect mode or select second node
    onNodeSelected(nodeId);
    // Keep toolbar open - user needs to select second node
    // ConnectMode will auto-reset after edge is created
  };

  // Calculate screen position
  const screenX = position.x * zoom + pan.x;
  const screenY = position.y * zoom + pan.y - 50; // 50px above node

  return (
    <>
      {/* Floating Toolbar */}
      <div
        className="absolute flex items-center gap-1 bg-white shadow-lg rounded-lg border border-gray-300 p-2"
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
          zIndex: 100,
          transform: 'translateY(-100%)', // Position above node
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color Swatches */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          {colorTokens.map(({ token, color, label }) => {
            const isActive = activeTokens.has(token);
            return (
              <button
                key={token}
                onClick={() => toggleToken(token, 'color')}
                className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                  isActive ? 'border-blue-500 shadow-md' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={label}
                aria-label={`Set color to ${label}`}
              />
            );
          })}
        </div>

        {/* Size Buttons */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          {sizeTokens.map((token) => {
            const isActive = activeTokens.has(token);
            return (
              <button
                key={token}
                onClick={() => toggleToken(token, 'size')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={`Set size to ${token.toUpperCase()}`}
              >
                {token.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Link Button */}
        <button
          onClick={handleLinkClick}
          className={`px-2 py-1 text-sm rounded transition-colors border-r border-gray-200 mr-2 ${
            connectMode && firstNodeId === nodeId
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          title={
            connectMode && firstNodeId === nodeId
              ? 'Select target node to link'
              : 'Link to another node'
          }
        >
          🔗
        </button>

        {/* More Button */}
        <button
          onClick={() => setShowFullPanel(true)}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="More options"
        >
          ···
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="ml-1 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Close toolbar"
        >
          ×
        </button>
      </div>

      {/* Full StylePanel (Modal) */}
      {showFullPanel &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center"
            style={{ zIndex: 200 }}
            onClick={() => setShowFullPanel(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <StylePanel
                nodeId={nodeId}
                currentStyle={currentStyle}
                onClose={() => setShowFullPanel(false)}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
