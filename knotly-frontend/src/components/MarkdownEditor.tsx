/**
 * MarkdownEditor Component
 * Textarea with 300ms debounce and dirty flag pattern for bidirectional sync
 *
 * Features:
 * - 300ms debounce for editor → canvas updates (Constitution Principle VIII: Performance)
 * - useRef dirty flag to prevent circular updates (Constitution Principle V: Quality)
 * - useLayoutEffect for cursor preservation (no visible flicker)
 * - Integrates with Zustand store for state management
 */

import { useRef, useLayoutEffect, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { parseMarkdown } from '../repository/markdownParser';
import { serializeToMarkdown } from '../repository/markdownSerializer';
import { calculateNodesBoundingCenter } from '../repository/helpers';
import { applyLayout } from '../repository/layoutEngine';
import type { MarkdownNode, Edge, LayoutType } from '../types/markdown';

interface CursorPosition {
  start: number;
  end: number;
}

export function MarkdownEditor() {
  // Zustand store subscriptions
  const markdown = useCanvasStore((state) => state.markdown || '');
  const layout = useCanvasStore((state) => state.layout as LayoutType) || 'radial';
  const nodes = useCanvasStore((state) => state.nodes as unknown as MarkdownNode[]) || [];
  const edges = useCanvasStore((state) => state.edges as unknown as Edge[]) || [];

  // Refs for dirty flag pattern and cursor preservation
  const isUpdatingFromCanvas = useRef(false);
  const isEditorInitiated = useRef(false); // Track if change originated from editor
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<CursorPosition>({ start: 0, end: 0 });

  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(markdown);

  // Sync local value when markdown changes externally (from canvas)
  useLayoutEffect(() => {
    if (isUpdatingFromCanvas.current) {
      setLocalValue(markdown);
      isUpdatingFromCanvas.current = false;
    }
  }, [markdown]);

  /**
   * Handle user typing in textarea
   * Editor has complete freedom - no cursor preservation during typing
   */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const { selectionStart, selectionEnd } = e.target;

    // Store cursor position (only for Canvas-initiated updates)
    cursorPositionRef.current = { start: selectionStart, end: selectionEnd };

    // Update local state immediately for responsive UI
    setLocalValue(newValue);

    // Mark this as editor-initiated update
    isUpdatingFromCanvas.current = false;
    isEditorInitiated.current = true;

    // Update store markdown (will trigger debounced parsing)
    useCanvasStore.setState({ markdown: newValue });
  };

  /**
   * T047: Debounced parsing effect
   * Parses markdown and updates canvas nodes after 300ms delay
   */
  useLayoutEffect(() => {
    // Skip if this update came from canvas (to prevent circular loop)
    if (isUpdatingFromCanvas.current) {
      return;
    }

    // Debounce: parse markdown after 300ms of no changes
    const timer = setTimeout(() => {
      const result = parseMarkdown(markdown);

      if (result.ok) {
        const { nodes: parsedNodes, edges: parsedEdges, layout: parsedLayout } = result.value;

        // Add default measuredSize to nodes that don't have it yet
        // (Real measurement happens in NodeComponent after rendering)
        const nodesWithSize = parsedNodes.map((node) => ({
          ...node,
          measuredSize: node.measuredSize || { width: 120, height: 60 },
        }));

        // Apply layout to calculate node positions
        const layoutResult = applyLayout(nodesWithSize, parsedEdges, parsedLayout);

        if (!layoutResult.ok) {
          // Layout calculation failed
          console.error('Layout error:', JSON.stringify(layoutResult.error, null, 2));
          return;
        }

        const positionedNodes = layoutResult.value;

        // Calculate node center for auto-centering viewport
        const nodeCenter = calculateNodesBoundingCenter(positionedNodes);

        // Get Canvas viewport size (right pane of split layout)
        const canvasElement = document.querySelector('.split-pane-right');
        const viewportWidth = canvasElement?.clientWidth || 800;
        const viewportHeight = canvasElement?.clientHeight || 600;

        // Get current zoom from store
        const currentZoom = useCanvasStore.getState().zoom;

        // Calculate pan to center nodes in viewport
        // Formula: pan = (viewport_center / zoom) - node_center
        // This ensures node_center appears at viewport_center after transform
        const newPan = {
          x: viewportWidth / (2 * currentZoom) - nodeCenter.x,
          y: viewportHeight / (2 * currentZoom) - nodeCenter.y,
        };

        // Convert markdown Edge type to canvas Edge type
        // markdown.Edge: { id, sourceId, targetId }
        // canvas.Edge: { id, fromId, toId, lineStyle, createdAt }
        const canvasEdges = parsedEdges.map(edge => ({
          id: edge.id,
          fromId: edge.sourceId,  // sourceId → fromId
          toId: edge.targetId,    // targetId → toId
          lineStyle: 'solid' as const,
          createdAt: Date.now(),
        }));

        // Update store with positioned nodes and auto-centered pan
        useCanvasStore.setState({
          nodes: positionedNodes as unknown as any[],
          edges: canvasEdges as unknown as any[], // Use converted edges
          layout: parsedLayout,
          pan: newPan, // Auto-center nodes in canvas viewport
        });
      } else {
        // Handle parse error (log for now, could show notification)
        console.error('Parse error:', result.error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [markdown]);

  /**
   * Subscribe to canvas node changes and serialize to markdown
   * Only runs for Canvas-initiated changes (not editor typing)
   */
  useLayoutEffect(() => {
    let previousNodes = useCanvasStore.getState().nodes;

    const unsubscribe = useCanvasStore.subscribe((state) => {
      // Only trigger if nodes actually changed
      if (state.nodes !== previousNodes) {
        previousNodes = state.nodes;

        // Skip serialization if this change originated from the editor
        // Clear the flag immediately to prevent stale state
        if (isEditorInitiated.current) {
          isEditorInitiated.current = false; // Immediately clear
          return;
        }

        // Serialize canvas nodes back to markdown (Canvas-initiated changes only)
        const currentEdges = useCanvasStore.getState().edges as unknown as Edge[];
        const currentLayout = useCanvasStore.getState().layout as LayoutType;

        const result = serializeToMarkdown(
          state.nodes as unknown as MarkdownNode[],
          currentEdges,
          currentLayout
        );

        if (result.ok) {
          // Mark this as canvas-initiated update for cursor restoration
          isUpdatingFromCanvas.current = true;

          // Update markdown in store
          useCanvasStore.setState({ markdown: result.value });
        } else {
          console.error('Serialize error:', result.error);
        }
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Restore cursor position ONLY for Canvas-initiated updates
   * Only triggers when markdown changes from Canvas, not from editor typing
   * Uses useLayoutEffect to prevent visible flicker
   */
  useLayoutEffect(() => {
    if (isUpdatingFromCanvas.current && textareaRef.current) {
      const { start, end } = cursorPositionRef.current;
      const maxLength = textareaRef.current.value.length;

      // Clamp positions to valid range (in case text length changed)
      const safeStart = Math.min(start, maxLength);
      const safeEnd = Math.min(end, maxLength);

      textareaRef.current.setSelectionRange(safeStart, safeEnd);

      // Clear flag after restoration
      isUpdatingFromCanvas.current = false;
    }
  }, [markdown]); // React to markdown changes, NOT localValue changes!

  return (
    <div className="markdown-editor h-full flex flex-col">
      {/* Editor Header */}
      <div className="editor-header bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Markdown Editor</h2>
        <div className="text-xs text-gray-500">
          {markdown.length} characters
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleTextareaChange}
        className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none border-none"
        placeholder="# Start typing markdown...

- Use headers (#, ##, ###)
- Create lists with - or *
- Add style tokens {.color-blue .h1}"
        spellCheck={false}
        style={{
          lineHeight: '1.6',
          tabSize: 2,
        }}
      />

      {/* Status Bar */}
      <div className="editor-footer bg-gray-50 border-t border-gray-200 px-4 py-1 text-xs text-gray-600 flex items-center justify-between">
        <div>
          Layout: <span className="font-semibold">{layout}</span>
        </div>
        <div>
          {nodes.length} nodes · {edges.length} edges
        </div>
      </div>
    </div>
  );
}
