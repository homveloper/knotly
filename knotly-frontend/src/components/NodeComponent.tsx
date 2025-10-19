import { useEffect, useRef, useState, useMemo } from 'react';
import { useDrag } from '@use-gesture/react';
import rough from 'roughjs';
import { useCanvasStore } from '../store/canvasStore';
import { useLinkMode } from './LinkModeButton';
import { parseTokens } from '../utils/tokenParser';
import { findNodeAtPosition } from '../utils/canvasHelpers';
import { StylePanel } from './StylePanel';
import type { Node } from '../types/canvas';

interface NodeComponentProps {
  node: Node;
}

/**
 * NodeComponent - Renders a single node in the canvas
 *
 * Features:
 * - Token-based styling (e.g., "color-yellow h4 neat")
 * - Hand-drawn circle rendered with rough.js
 * - Text editing via foreignObject (HTML textarea)
 * - Tap to select/edit node
 * - Drag to move nodes
 * - Drag from edge handle to create connections
 * - Long-press for connecting mode (mobile)
 *
 * Phase 6 Additions:
 * - Edge drag handle (transparent circle at border)
 * - Drag-to-connect gestures
 * - Long-press-to-connect (mobile)
 * - Visual feedback when in connecting mode
 */
export function NodeComponent({ node }: NodeComponentProps) {
  const {
    nodes,
    updateNode,
    moveNode,
    createEdge,
    setSelectedNode,
    setEditingNode,
    editingNodeId,
    connectingFrom,
    setConnectingFrom,
    tokenDefinitions,
    zoom,
    pan,
  } = useCanvasStore();

  const { connectMode, onNodeSelected } = useLinkMode();
  const svgRef = useRef<SVGSVGElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showStylePanel, setShowStylePanel] = useState(false);

  // Parse token-based style
  const parsedStyle = useMemo(
    () => parseTokens(node.style, tokenDefinitions),
    [node.style, tokenDefinitions]
  );

  // Default style values
  const width = parsedStyle.width || 200;
  const height = parsedStyle.height || 140;
  const fontSize = parsedStyle.fontSize || 16;
  const fontWeight = parsedStyle.fontWeight || 400;
  const stroke = parsedStyle.stroke || '#ca8a04';
  const fill = parsedStyle.fill || '#fef9c3';
  const strokeWidth = parsedStyle.strokeWidth || 2;
  const roughness = parsedStyle.roughness || 1.0;

  // Determine if this node is being edited
  const isEditing = editingNodeId === node.id;

  // Visual feedback: highlight if this is the connecting source
  const isConnectingSource = connectingFrom === node.id;

  /**
   * Render rough.js circle with token-based styling
   */
  useEffect(() => {
    if (!svgRef.current) return;

    svgRef.current.replaceChildren();
    const rc = rough.svg(svgRef.current);

    // Generate seed from node ID for consistent rendering
    let hash = 0;
    for (let i = 0; i < node.id.length; i++) {
      hash = ((hash << 5) - hash) + node.id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    // Render rectangle (not circle) with token-defined dimensions
    const rect = rc.rectangle(0, 0, width, height, {
      fill,
      fillStyle: 'solid',
      stroke: isConnectingSource ? '#3b82f6' : stroke, // Blue when connecting
      strokeWidth: isConnectingSource ? strokeWidth + 2 : strokeWidth,
      roughness,
      seed,
    });

    svgRef.current.appendChild(rect);
  }, [width, height, fill, stroke, strokeWidth, roughness, node.id, isConnectingSource]);

  /**
   * Drag gesture for node movement
   */
  const dragBind = useDrag(
    ({ delta: [dx, dy], first }) => {
      if (first) return;

      const adjustedDx = dx / zoom;
      const adjustedDy = dy / zoom;

      const newX = node.position.x + adjustedDx;
      const newY = node.position.y + adjustedDy;
      moveNode(node.id, { x: newX, y: newY });
    },
    {
      preventDefault: true,
    }
  );

  /**
   * Edge drag handle gesture
   * T065: Sets connectingFrom on drag start, creates edge on drag end
   */
  const edgeDragBind = useDrag(
    ({ first, last, xy: [screenX, screenY] }) => {
      if (first) {
        // Start connecting mode
        setConnectingFrom(node.id);
        return;
      }

      if (last) {
        // End connecting mode
        // T067: Find target node at release position
        if (connectingFrom && svgRef.current) {
          const rect = svgRef.current.ownerSVGElement?.getBoundingClientRect();
          if (rect) {
            const canvasX = (screenX - rect.left - pan.x) / zoom;
            const canvasY = (screenY - rect.top - pan.y) / zoom;

            const targetNode = findNodeAtPosition(nodes, canvasX, canvasY, connectingFrom);
            if (targetNode) {
              createEdge(connectingFrom, targetNode.id);
            }
          }
        }

        setConnectingFrom(null);
        return;
      }
    },
    {
      preventDefault: true,
    }
  );

  /**
   * Focus textarea when entering edit mode
   */
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(node.content.length, node.content.length);
    }
  }, [isEditing, node.content]);

  /**
   * T069: Long-press detection for connecting mode (mobile)
   */
  const handleMouseDown = () => {
    longPressTimerRef.current = setTimeout(() => {
      // T070: Set connecting mode with visual feedback
      setConnectingFrom(node.id);
      longPressTimerRef.current = null;
    }, 500); // 500ms threshold
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      // Regular tap
      handleTap();
    }
  };

  /**
   * Handle node tap
   * T071: Check if in connecting mode, create edge if so
   */
  const handleTap = () => {
    if (connectingFrom && connectingFrom !== node.id) {
      // T071: Create edge from connectingFrom to this node
      createEdge(connectingFrom, node.id);
      setConnectingFrom(null);
    } else if (connectMode) {
      onNodeSelected(node.id);
    } else {
      // Normal tap: select and edit
      setSelectedNode(node.id);
      setEditingNode(node.id);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNode(node.id, { content: e.target.value });
  };

  const handleBlur = () => {
    setEditingNode(null);
  };

  /**
   * T081: Context menu handler - open StylePanel on right-click
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowStylePanel(true);
  };

  return (
    <>
      <g
        {...dragBind()}
        style={{ cursor: isConnectingSource ? 'crosshair' : 'grab', touchAction: 'none' }}
      >
        {/* Rough.js rectangle */}
        <svg
          ref={svgRef}
          x={node.position.x}
          y={node.position.y}
          width={width}
          height={height}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        />

        {/* Clickable area */}
        <rect
          x={node.position.x}
          y={node.position.y}
          width={width}
          height={height}
          fill="transparent"
          onClick={handleTap}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          }}
        />

        {/* T064: Edge drag handle (transparent circle at right edge) */}
        <circle
          {...edgeDragBind()}
          cx={node.position.x + width}
          cy={node.position.y + height / 2}
          r={10}
          fill="transparent"
          stroke={isConnectingSource ? '#3b82f6' : '#999'}
          strokeWidth={2}
          style={{ cursor: 'crosshair', opacity: isConnectingSource ? 1 : 0.3 }}
        />

        {/* Text content */}
        <foreignObject
          x={node.position.x + 10}
          y={node.position.y + 10}
          width={width - 20}
          height={height - 20}
          style={{
            cursor: 'text',
            pointerEvents: isEditing ? 'auto' : 'none',
          }}
        >
          {isEditing ? (
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
                fontSize: `${fontSize}px`,
                fontWeight,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                overflowY: 'auto',
                textAlign: 'center',
                color: '#333',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                padding: '4px',
                fontFamily: 'Nanum Pen Script, cursive',
                fontSize: `${fontSize}px`,
                fontWeight,
                color: '#333',
                textAlign: 'center',
                overflow: 'hidden',
                overflowY: 'auto',
                wordWrap: 'break-word',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ whiteSpace: 'pre-wrap' }}>{node.content || 'Tap to edit'}</span>
            </div>
          )}
        </foreignObject>
      </g>

      {/* T081: StylePanel - shown on right-click */}
      {showStylePanel && (
        <foreignObject
          x={0}
          y={0}
          width="100%"
          height="100%"
          style={{ pointerEvents: 'auto' }}
        >
          <StylePanel
            nodeId={node.id}
            currentStyle={node.style}
            onClose={() => setShowStylePanel(false)}
          />
        </foreignObject>
      )}
    </>
  );
}
