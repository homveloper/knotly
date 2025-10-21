import { useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Settings } from './components/Settings';
import { StartScreen } from './components/StartScreen';
import { TitleBar } from './components/TitleBar';
import { SplitLayout } from './components/SplitLayout';
import { MarkdownEditor } from './components/MarkdownEditor';
import { useCanvasStore } from './store/canvasStore';

/**
 * App - Main application component
 *
 * Screen Routing:
 * - Shows StartScreen when no note is loaded (nodes.length === 0 && !currentFilePath)
 * - Shows Canvas + TitleBar when a note is active
 *
 * Renders:
 * - StartScreen: Landing page for new note / open file actions
 * - TitleBar: Filename display with save status (●/✓ indicators)
 * - SplitLayout: Adjustable split pane (MarkdownEditor | Canvas)
 * - MarkdownEditor: Text-based markdown editing (left pane)
 * - Canvas: Read-only visualization with zoom/pan (right pane)
 * - Settings toolbar: Grid display toggle (top-left)
 *
 * State Management:
 * - All state managed via Zustand store (useCanvasStore)
 * - beforeunload listener warns user of unsaved changes
 * - Editing only via MarkdownEditor (Canvas is read-only)
 */

function App() {
  const { nodes, currentFilePath, hasUnsavedChanges } = useCanvasStore();

  // Show confirmation dialog if user tries to leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Screen routing: StartScreen vs Canvas
  const showStartScreen = nodes.length === 0 && !currentFilePath;

  if (showStartScreen) {
    return <StartScreen />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white flex flex-col">
      {/* TitleBar at top with filename and save status */}
      <TitleBar />

      {/* Main content area with split layout (Feature 004 - Phase 6) */}
      <div className="flex-1 relative overflow-hidden">
        <SplitLayout
          left={
            /* Markdown Editor pane - text-based editing only */
            <MarkdownEditor />
          }
          right={
            /* Canvas pane - read-only visualization with zoom/pan */
            <div className="relative w-full h-full">
              <Canvas />

              {/* Settings toolbar for grid display toggle (top-left) */}
              <Settings />
            </div>
          }
        />
      </div>
    </div>
  );
}

export default App;
