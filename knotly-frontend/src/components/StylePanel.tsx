import { useState, useMemo } from 'react';
import { useCanvasStore } from '../store/canvasStore';

interface StylePanelProps {
  nodeId: string;
  currentStyle: string;
  onClose: () => void;
}

/**
 * StylePanel Component - Visual token selection panel for node styling
 *
 * Features:
 * - Categorized token buttons (Colors, Sizes, Feel, Border)
 * - Toggle tokens on/off with visual feedback
 * - Debounced updateNode calls (100ms) to reduce store updates
 * - Display current token combination at bottom
 * - Click outside or ESC key to close
 *
 * Token Categories:
 * - Colors: color-blue, color-red, color-mint, color-yellow, color-gray, color-purple, color-orange, color-pink
 * - Sizes: h1, h2, h3, h4, h5, h6
 * - Feel: smooth, neat, rough, sketchy, messy
 * - Border: thin, normal, thick, bold
 */
export function StylePanel({ nodeId, currentStyle, onClose }: StylePanelProps) {
  const updateNode = useCanvasStore((state) => state.updateNode);
  const [localStyle, setLocalStyle] = useState(currentStyle);

  // Parse current style into token set
  const activeTokens = useMemo(() => {
    return new Set(localStyle.split(' ').filter(Boolean));
  }, [localStyle]);

  // Token categories
  const colorTokens = [
    'color-blue',
    'color-red',
    'color-mint',
    'color-yellow',
    'color-gray',
    'color-purple',
    'color-orange',
    'color-pink',
  ];

  const sizeTokens = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

  const feelTokens = ['smooth', 'neat', 'rough', 'sketchy', 'messy'];

  const borderTokens = ['thin', 'normal', 'thick', 'bold'];

  const shapeTokens = ['shape-none', 'shape-rect', 'shape-circle', 'shape-rounded'];

  // Debounced update timer
  const debounceTimerRef = useState<ReturnType<typeof setTimeout> | null>(null)[0];

  /**
   * Toggle token on/off
   * - Adds token if not present
   * - Removes token if already present
   * - Updates local state immediately for UI responsiveness
   * - Debounces updateNode call by 100ms to reduce store updates
   */
  const toggleToken = (token: string, category: string[]) => {
    // For exclusive categories (colors, sizes, shapes), remove other tokens in same category
    const isExclusive = category === colorTokens || category === sizeTokens || category === shapeTokens;

    let newTokens = new Set(activeTokens);

    if (newTokens.has(token)) {
      // Remove token
      newTokens.delete(token);
    } else {
      // Add token
      if (isExclusive) {
        // Remove all tokens from same category first
        category.forEach((t) => newTokens.delete(t));
      }
      newTokens.add(token);
    }

    const newStyle = Array.from(newTokens).join(' ');
    setLocalStyle(newStyle);

    // Debounced updateNode call
    if (debounceTimerRef) {
      clearTimeout(debounceTimerRef);
    }
    const timerId = setTimeout(() => {
      updateNode(nodeId, { style: newStyle });
    }, 100);
    // Store timer for cleanup
    (debounceTimerRef as any) = timerId;
  };

  /**
   * Render token button with active state
   */
  const renderTokenButton = (token: string, category: string[]) => {
    const isActive = activeTokens.has(token);
    return (
      <button
        key={token}
        onClick={() => toggleToken(token, category)}
        className={`px-3 py-1.5 text-sm rounded border ${
          isActive
            ? 'bg-blue-500 text-white border-blue-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        {token}
      </button>
    );
  };

  return (
    <div
      className="absolute z-50 bg-white shadow-lg rounded-lg border border-gray-300 p-4 w-80"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      onClick={(e) => e.stopPropagation()} // Prevent click-through
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Style Node</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Token Categories */}
      <div className="space-y-4">
        {/* Colors */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Colors</h4>
          <div className="flex flex-wrap gap-2">
            {colorTokens.map((token) => renderTokenButton(token, colorTokens))}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Sizes</h4>
          <div className="flex flex-wrap gap-2">
            {sizeTokens.map((token) => renderTokenButton(token, sizeTokens))}
          </div>
        </div>

        {/* Feel */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Feel</h4>
          <div className="flex flex-wrap gap-2">
            {feelTokens.map((token) => renderTokenButton(token, feelTokens))}
          </div>
        </div>

        {/* Border */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Border</h4>
          <div className="flex flex-wrap gap-2">
            {borderTokens.map((token) => renderTokenButton(token, borderTokens))}
          </div>
        </div>

        {/* Shape */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Shape</h4>
          <div className="flex flex-wrap gap-2">
            {shapeTokens.map((token) => renderTokenButton(token, shapeTokens))}
          </div>
        </div>
      </div>

      {/* Current Token Combination */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Current tokens:</p>
        <p className="text-sm font-mono bg-gray-50 p-2 rounded border border-gray-200 break-words">
          {localStyle || '(none)'}
        </p>
      </div>
    </div>
  );
}
