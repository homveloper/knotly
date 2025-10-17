import { useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import rough from 'roughjs';
import { useCanvasStore } from '../store/canvasStore';
import { useLinkMode } from './LinkModeButton';
import { ContextMenu } from './ContextMenu';
import { MentionSheet } from './MentionSheet';
import type { Node } from '../types/canvas';

interface NodeComponentProps {
  node: Node;
}

/**
 * NodeComponent - Renders a single node in the canvas
 *
 * Features:
 * - 120px diameter circle rendered with rough.js (hand-drawn style)
 * - Text editing via foreignObject (HTML textarea)
 * - Tap to enter/exit edit mode
 * - Drag to move nodes (smooth following)
 * - Long-press (500ms) opens context menu for color and deletion
 * - Text wrapping with vertical scroll for overflow
 * - Automatic Nanum Pen Script font rendering
 *
 * Rendering Strategy:
 * - rough.js circle drawn to SVG via useEffect
 * - foreignObject for text input/display (HTML inside SVG)
 * - useEffect cleanup to prevent duplicate circles
 * - ContextMenu rendered conditionally on long-press
 *
 * Performance:
 * - memo candidate if NodeComponent becomes bottleneck
 * - useDrag hook for smooth gesture handling
 * - Long-press detection with setTimeout (500ms threshold)
 */

export function NodeComponent({ node }: NodeComponentProps) {
  const { updateNode, moveNode, createEdge, zoom } = useCanvasStore();
  const { connectMode, onNodeSelected } = useLinkMode();
  const [isEditing, setIsEditing] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showMentionSheet, setShowMentionSheet] = useState(false);
  const [mentionFilterText, setMentionFilterText] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Node dimensions (120px diameter per spec)
  const NODE_RADIUS = 60; // Half of 120px diameter
  const NODE_SIZE = 120;

  /**
   * Render rough.js circle
   * - Creates new circle on position or style changes
   * - Uses seed from node ID for consistent rendering
   * - Fills with backgroundColor, strokes with strokeColor
   */
  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous circle
    svgRef.current.replaceChildren();

    // Create new circle with rough.js
    const rc = rough.svg(svgRef.current);

    // Simple hash function for consistent seed from node ID
    let hash = 0;
    for (let i = 0; i < node.id.length; i++) {
      hash = ((hash << 5) - hash) + node.id.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    const seed = Math.abs(hash);

    // Draw circle at center of SVG (local coordinates)
    // SVG wrapper is positioned at (node.position.x - NODE_RADIUS, node.position.y - NODE_RADIUS)
    // So circle center should be at (NODE_RADIUS, NODE_RADIUS) within the SVG
    // This results in actual position (node.position.x, node.position.y) on canvas
    const circle = rc.circle(NODE_RADIUS, NODE_RADIUS, NODE_SIZE, {
      fill: node.style.backgroundColor,
      fillStyle: 'solid',
      stroke: node.style.strokeColor,
      strokeWidth: node.style.strokeWidth,
      roughness: 1.5, // Hand-drawn appearance
      seed, // Consistent rendering
    });

    svgRef.current.appendChild(circle);
  }, [node.position, node.style, node.id]);

  /**
   * Drag gesture for node movement
   * - Uses delta (relative change) instead of offset
   * - Allows dragging from any point on node (center or edge)
   * - Adjusts delta based on zoom level for consistent pointer speed
   * - When zoomed in (2x), delta is halved so pointer speed matches node movement speed
   * - Calls moveNode action in store
   */
  const dragBind = useDrag(
    ({ delta: [dx, dy], first }) => {
      // Skip first frame to avoid initial jitter
      if (first) return;

      // Adjust mouse delta based on current zoom level
      // This ensures pointer speed = node movement speed regardless of zoom
      // Example: if zoom=2x, delta should be halved so node doesn't move faster than cursor
      const adjustedDx = dx / zoom;
      const adjustedDy = dy / zoom;

      // Calculate new position relative to current position
      const newX = node.position.x + adjustedDx;
      const newY = node.position.y + adjustedDy;
      moveNode(node.id, { x: newX, y: newY });
    },
    {
      preventDefault: true,
    }
  );

  /**
   * Handle text area focus
   * When entering edit mode, focus textarea and position cursor at end
   */
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Position cursor at end of text
      textareaRef.current.setSelectionRange(
        node.content.length,
        node.content.length
      );
    }
  }, [isEditing, node.content]);

  /**
   * Handle mouse down for long-press detection
   * - 500ms threshold triggers context menu
   * - Cleared on mouse up or drag
   */
  const handleMouseDown = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowContextMenu(true);
      longPressTimerRef.current = null;
    }, 500); // 500ms long-press threshold
  };

  /**
   * Handle mouse up to cancel long-press
   * - If timer still active, treat as regular tap
   */
  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      // Handle regular tap
      handleTap();
    }
  };

  /**
   * Handle node tap for edit mode or link mode
   * - If link mode active: report node selection to LinkModeButton
   * - Otherwise: activate text editing
   */
  const handleTap = () => {
    if (connectMode) {
      // Link mode is active - report this node selection
      onNodeSelected(node.id);
    } else {
      // Normal mode - enter text editing
      setIsEditing(true);
    }
  };

  /**
   * Handle text content changes
   * - Updates node in store as user types
   * - Detects @ symbol to trigger mention sheet
   * - Extracts filter text after @ for dynamic filtering
   * - Closes mention sheet on backspace if no @ remains
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    updateNode(node.id, { content: newContent });

    // Check if content contains @ symbol
    const atIndex = newContent.lastIndexOf('@');

    if (atIndex !== -1) {
      // @ symbol found - extract filter text after it
      const filterText = newContent.substring(atIndex + 1);

      // Check if we're still in mention mode (text after @ without spaces)
      // Mention mode ends when user presses space or backspace everything after @
      if (!filterText.includes(' ')) {
        setShowMentionSheet(true);
        setMentionFilterText(filterText);
      } else {
        // Space after @ - close mention sheet
        setShowMentionSheet(false);
        setMentionFilterText('');
      }
    } else {
      // No @ symbol found - close mention sheet
      setShowMentionSheet(false);
      setMentionFilterText('');
    }
  };

  /**
   * Handle exiting edit mode
   * Blur (unfocus) text area triggers exit
   */
  const handleBlur = () => {
    setIsEditing(false);
  };

  /**
   * Handle mention sheet node selection
   * - Creates edge from current node to selected node
   * - Removes @ symbol and filter text from content
   * - Closes mention sheet
   */
  const handleMentionSelect = (selectedNodeId: string) => {
    // Create edge from current node to selected node
    createEdge(node.id, selectedNodeId);

    // Remove @ symbol and filter text from content
    const atIndex = node.content.lastIndexOf('@');
    if (atIndex !== -1) {
      const contentBeforeAt = node.content.substring(0, atIndex);
      updateNode(node.id, { content: contentBeforeAt });
    }

    // Close mention sheet
    setShowMentionSheet(false);
    setMentionFilterText('');
  };

  /**
   * Determine if text overflows the 120px circle
   * Rough estimate: show scroll indicator if content > ~80 chars
   * Or more accurately: check if content renders beyond space
   */
  const hasTextOverflow = node.content.length > 80;

  return (
    <>
      <g {...dragBind()} style={{ cursor: connectMode ? 'pointer' : 'grab', touchAction: 'none' }}>
      {/* Rough.js circle - visual only, no events */}
      <svg
        ref={svgRef}
        x={node.position.x - NODE_RADIUS}
        y={node.position.y - NODE_RADIUS}
        width={NODE_SIZE}
        height={NODE_SIZE}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      />

      {/* Transparent clickable/draggable area covering entire node */}
      {/* This rect receives all drag, tap, and long-press events */}
      <rect
        x={node.position.x - NODE_RADIUS}
        y={node.position.y - NODE_RADIUS}
        width={NODE_SIZE}
        height={NODE_SIZE}
        fill="transparent"
        onClick={handleTap}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }}
      />

      {/* Text content area using SVG foreignObject */}
      {/* foreignObject allows HTML content (textarea/div) inside SVG */}
      <foreignObject
        x={node.position.x - NODE_RADIUS + 10} // Padding from circle edge
        y={node.position.y - NODE_RADIUS + 10}
        width={NODE_SIZE - 20} // Padding on both sides
        height={NODE_SIZE - 20}
        style={{
          cursor: 'text',
          pointerEvents: isEditing ? 'auto' : 'none', // Events only when editing
        }}
      >
        {isEditing ? (
          // Editing mode: textarea for input
          <textarea
            ref={textareaRef}
            value={node.content}
            onChange={handleTextChange}
            onBlur={handleBlur}
            style={{
              width: '100%',
              height: '100%',
              padding: '4px',
              fontFamily: 'Nanum Pen Script, cursive',
              fontSize: '16px',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden', // Hide scrollbar but allow overflow
              overflowY: 'auto',
              textAlign: 'center',
              color: '#333',
            }}
            aria-label={`Edit node: ${node.content || 'empty'}`}
          />
        ) : (
          // Display mode: readonly text with scroll indicator
          <div
            onClick={handleTap}
            style={{
              width: '100%',
              height: '100%',
              padding: '4px',
              fontFamily: 'Nanum Pen Script, cursive',
              fontSize: '16px',
              color: '#333',
              textAlign: 'center',
              overflow: 'hidden',
              overflowY: 'auto',
              wordWrap: 'break-word',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'text',
              position: 'relative',
            }}
          >
            <span style={{ whiteSpace: 'pre-wrap' }}>
              {node.content || 'Tap to edit'}
            </span>
            {/* Scroll indicator for text overflow */}
            {hasTextOverflow && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  fontSize: '10px',
                  color: '#999',
                }}
                title="Content overflows - scroll to read more"
              >
                ↓
              </div>
            )}
          </div>
        )}
      </foreignObject>

    </g>

    {/* Context menu for color and deletion (rendered outside SVG as portal) */}
    {showContextMenu && (
      <ContextMenu nodeId={node.id} onClose={() => setShowContextMenu(false)} />
    )}

    {/* Mention sheet for quick @mention linking */}
    {showMentionSheet && isEditing && (
      <MentionSheet
        currentNodeId={node.id}
        filterText={mentionFilterText}
        onSelect={handleMentionSelect}
        onClose={() => {
          setShowMentionSheet(false);
          setMentionFilterText('');
        }}
      />
    )}
  </>
  );
}
