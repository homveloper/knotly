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
   * Saves cursor position and marks update as editor-initiated
   */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const { selectionStart, selectionEnd } = e.target;

    // Store cursor position for preservation
    cursorPositionRef.current = { start: selectionStart, end: selectionEnd };

    // Update local state immediately for responsive UI
    setLocalValue(newValue);

    // Mark this as editor-initiated update (not from canvas)
    isUpdatingFromCanvas.current = false;

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

        // Update store with parsed data
        // Note: This is a simplified version. In a full implementation,
        // you'd need to handle the type mismatch between MarkdownNode and the existing Node type
        useCanvasStore.setState({
          // Store parsed nodes (type conversion needed for full integration)
          nodes: parsedNodes as unknown as any[],
          edges: parsedEdges as unknown as any[],
          layout: parsedLayout,
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
   * Uses dirty flag to mark update as canvas-initiated
   */
  useLayoutEffect(() => {
    const unsubscribe = useCanvasStore.subscribe(
      (state) => state.nodes,
      (updatedNodes) => {
        // Serialize canvas nodes back to markdown
        const currentEdges = useCanvasStore.getState().edges as unknown as Edge[];
        const currentLayout = useCanvasStore.getState().layout as LayoutType;

        const result = serializeToMarkdown(
          updatedNodes as unknown as MarkdownNode[],
          currentEdges,
          currentLayout
        );

        if (result.ok) {
          // Mark this as canvas-initiated update
          isUpdatingFromCanvas.current = true;

          // Update markdown in store
          useCanvasStore.setState({ markdown: result.value });
        } else {
          console.error('Serialize error:', result.error);
        }
      }
    );

    return unsubscribe;
  }, []);

  /**
   * Restore cursor position after external (canvas-initiated) updates
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
    }
  }, [localValue]);

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
