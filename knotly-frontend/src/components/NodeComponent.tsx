import { useEffect, useRef, useState, useMemo } from 'react';
import { useDrag } from '@use-gesture/react';
import rough from 'roughjs';
import { useCanvasStore } from '../store/canvasStore';
import { useLinkMode } from './LinkModeButton';
import { parseTokens } from '../utils/tokenParser';
import { findNodeAtPosition, estimateNodeSize } from '../utils/canvasHelpers';
import { FloatingToolbar } from './FloatingToolbar';
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
    deleteNode,
    setSelectedNode,
    setEditingNode,
    selectedNodeId,
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
  const textContentRef = useRef<HTMLDivElement>(null); // For DOM measurement
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse token-based style
  const parsedStyle = useMemo(
    () => parseTokens(node.style, tokenDefinitions),
    [node.style, tokenDefinitions]
  );

  // Extract style properties
  const fontSize = parsedStyle.fontSize || 16;
  const fontWeight = parsedStyle.fontWeight || 400;
  const stroke = parsedStyle.stroke || '#ca8a04';
  const fill = parsedStyle.fill || '#fef9c3';
  const strokeWidth = parsedStyle.strokeWidth || 2;
  const roughness = parsedStyle.roughness || 1.0;
  const shape = parsedStyle.shape || 'none'; // Default: no shape (text only)

  // Calculate node size: use measured size if available, otherwise estimate
  let width: number;
  let height: number;

  if (node.measuredSize) {
    // Use cached measurement from store
    width = node.measuredSize.width;
    height = node.measuredSize.height;
  } else {
    // Estimate from content (hybrid approach - Phase 1)
    const estimated = estimateNodeSize(node.content, fontSize);
    width = estimated.width;
    height = estimated.height;
  }

  // Determine selection and editing states
  const isSelected = selectedNodeId === node.id;
  const isEditing = editingNodeId === node.id;

  // Visual feedback: highlight if this is the connecting source
  const isConnectingSource = connectingFrom === node.id;

  // Show FloatingToolbar only when selected and not editing
  const showFloatingToolbar = isSelected && !isEditing && !connectingFrom;

  /**
   * Render rough.js shape based on token-based styling
   * Shape can be: 'none', 'rect', 'circle', 'rounded'
   */
  useEffect(() => {
    if (!svgRef.current) return;

    svgRef.current.replaceChildren();

    // If shape is 'none', don't render any shape (text only)
    if (shape === 'none') return;

    const rc = rough.svg(svgRef.current);

    // Generate seed from node ID for consistent rendering
    let hash = 0;
    for (let i = 0; i < node.id.length; i++) {
      hash = ((hash << 5) - hash) + node.id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    const shapeOptions = {
      fill,
      fillStyle: 'solid' as const,
      stroke: isConnectingSource ? '#3b82f6' : stroke, // Blue when connecting
      strokeWidth: isConnectingSource ? strokeWidth + 2 : strokeWidth,
      roughness,
      seed,
    };

    // Render shape based on token
    let shapeElement: SVGElement;
    if (shape === 'rect') {
      shapeElement = rc.rectangle(0, 0, width, height, shapeOptions);
    } else if (shape === 'circle') {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2;
      shapeElement = rc.circle(centerX, centerY, radius * 2, shapeOptions);
    } else if (shape === 'rounded') {
      // Rounded rectangle with 16px border radius
      shapeElement = rc.rectangle(0, 0, width, height, {
        ...shapeOptions,
        // @ts-ignore - rough.js doesn't have proper types for this
        bowing: 0.5,
      });
    } else {
      // Fallback to rectangle
      shapeElement = rc.rectangle(0, 0, width, height, shapeOptions);
    }

    svgRef.current.appendChild(shapeElement);
  }, [width, height, fill, stroke, strokeWidth, roughness, shape, node.id, isConnectingSource]);

  /**
   * Drag gesture for node movement
   * Disabled when editing mode is active
   */
  const dragBind = useDrag(
    ({ delta: [dx, dy], first }) => {
      // Disable drag when in editing mode
      if (isEditing) return;

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
   * DOM measurement for accurate node sizing (real-time auto-sizing)
   * Measures actual text content during editing and updates store immediately
   */
  useEffect(() => {
    let measuredWidth: number;
    let measuredHeight: number;

    // Always measure using div (textContentRef) for accurate sizing
    // This works both during editing and display mode
    if (textContentRef.current) {
      const rect = textContentRef.current.getBoundingClientRect();
      measuredWidth = rect.width + 40; // +40px for padding
      measuredHeight = rect.height + 40;
    } else {
      return; // No measurement available
    }

    // Update store if size changed significantly (avoid unnecessary updates)
    const sizeChanged =
      !node.measuredSize ||
      Math.abs(node.measuredSize.width - measuredWidth) > 5 ||
      Math.abs(node.measuredSize.height - measuredHeight) > 5;

    if (sizeChanged) {
      updateNode(node.id, {
        measuredSize: { width: measuredWidth, height: measuredHeight },
      });
    }
  }, [node.content, fontSize, isEditing, node.id, updateNode]);

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
      // Regular click
      handleClick();
    }
  };

  /**
   * Handle single click - Select node and show FloatingToolbar
   */
  const handleClick = (e: React.MouseEvent) => {
    // IMPORTANT: Prevent event propagation to Canvas
    e.stopPropagation();

    // Priority 0: Exit editing mode if clicking a different node
    if (editingNodeId && editingNodeId !== node.id) {
      setEditingNode(null);
      // Continue to select this node
    }

    // Priority 1: Connecting mode (create edge)
    if (connectingFrom && connectingFrom !== node.id) {
      createEdge(connectingFrom, node.id);
      setConnectingFrom(null);
      return;
    }

    // Priority 2: Link mode (from LinkModeButton)
    if (connectMode) {
      onNodeSelected(node.id);
      return;
    }

    // Priority 3: Normal selection (show FloatingToolbar)
    setSelectedNode(node.id);
  };

  /**
   * Handle double click - Enter text editing mode
   */
  const handleDoubleClick = (e: React.MouseEvent) => {
    // IMPORTANT: Prevent event propagation to Canvas (prevent new node creation)
    e.stopPropagation();

    // Ignore double-click if in connecting mode
    if (connectingFrom) {
      return;
    }

    setEditingNode(node.id);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNode(node.id, { content: e.target.value });
  };

  const handleBlur = () => {
    // 빈 노드면 삭제
    if (!node.content || node.content.trim() === '') {
      deleteNode(node.id);
      return;
    }
    setEditingNode(null);
  };

  // Determine cursor style based on state
  const cursorStyle = isEditing ? 'text' : isConnectingSource ? 'crosshair' : 'grab';

  return (
    <>
      <g
        {...dragBind()}
        style={{ cursor: cursorStyle, touchAction: 'none' }}
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

        {/* Selection highlight (background) */}
        {isSelected && !isEditing && (
          <rect
            x={node.position.x - 5}
            y={node.position.y - 5}
            width={width + 10}
            height={height + 10}
            fill="rgba(59, 130, 246, 0.1)"
            rx={8}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Editing mode border (strong visual feedback) */}
        {isEditing && (
          <rect
            x={node.position.x - 3}
            y={node.position.y - 3}
            width={width + 6}
            height={height + 6}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            rx={8}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Clickable area - also serves as Z-order background layer */}
        {/* fill="#fafafa" (Canvas background color) ensures this rect covers connection lines */}
        {/* Even when shape-none, this rect acts as a photoshop-like layer */}
        <rect
          x={node.position.x}
          y={node.position.y}
          width={width}
          height={height}
          fill="#fafafa"
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
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
          x={node.position.x + 5}
          y={node.position.y + 5}
          width={width - 10}
          height={height - 10}
          style={{
            cursor: 'text',
            pointerEvents: isEditing ? 'auto' : 'none',
          }}
        >
          {/* Textarea - only shown during editing */}
          {isEditing && (
            <textarea
              ref={textareaRef}
              value={node.content}
              onChange={handleTextChange}
              onBlur={handleBlur}
              wrap="off"
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
                textAlign: 'center',
                color: '#333',
                overflow: 'hidden',
                whiteSpace: 'pre',
              }}
            />
          )}
          {/* Display div - always rendered for measurement, hidden during editing */}
          <div
            ref={textContentRef}
            style={{
              width: 'max-content',
              height: 'auto',
              maxWidth: '100%',
              padding: '4px',
              fontFamily: 'Nanum Pen Script, cursive',
              fontSize: `${fontSize}px`,
              fontWeight,
              color: '#333',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              visibility: isEditing ? 'hidden' : 'visible',
              position: isEditing ? 'absolute' : 'static',
            }}
          >
            <span style={{ whiteSpace: 'pre' }}>{node.content || ''}</span>
          </div>
        </foreignObject>
      </g>

      {/* FloatingToolbar - shown when node is selected */}
      {showFloatingToolbar && (
        <foreignObject
          x={0}
          y={0}
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ pointerEvents: 'none', overflow: 'visible' }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            <FloatingToolbar
              nodeId={node.id}
              currentStyle={node.style}
              position={node.position}
              zoom={zoom}
              pan={pan}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        </foreignObject>
      )}
    </>
  );
}
