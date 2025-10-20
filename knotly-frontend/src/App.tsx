import { useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { FABButton } from './components/FABButton';
import { Settings } from './components/Settings';
import { LinkModeProvider } from './components/LinkModeButton';
import { StartScreen } from './components/StartScreen';
import { TitleBar } from './components/TitleBar';
import { SplitLayout } from './components/SplitLayout';
import { MarkdownEditor } from './components/MarkdownEditor';
import { LayoutSelector } from './components/LayoutSelector';
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
 * - LinkModeProvider: Context provider for link mode state (wraps all interactive components)
 * - Full-screen Canvas for the graph editor
 * - Settings toolbar (top-left) for grid and snap toggles
 * - FABButton overlay (bottom-right) for creating new nodes
 * - LinkModeButton overlay (bottom-left) for entering link mode (rendered by LinkModeProvider)
 *
 * State Management:
 * - All state managed via Zustand store (useCanvasStore)
 * - Link mode state managed via React Context (LinkModeContext)
 * - beforeunload listener warns user of unsaved changes
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
    <LinkModeProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-white flex flex-col">
        {/* TitleBar at top with filename and save status */}
        <TitleBar />

        {/* Main content area with split layout (Feature 004 - Phase 6) */}
        <div className="flex-1 relative overflow-hidden">
          <SplitLayout
            left={
              /* Markdown Editor pane */
              <MarkdownEditor />
            }
            right={
              /* Canvas pane with interactive graph editor */
              <div className="relative w-full h-full">
                <Canvas />

                {/* Settings toolbar for grid and snap controls (top-left) */}
                <Settings />

                {/* T101: Layout selector for switching between radial and horizontal (top-right) */}
                <div className="fixed top-4 right-4 z-10">
                  <LayoutSelector />
                </div>

                {/* Floating action button for creating nodes (bottom-right) */}
                <FABButton />

                {/* LinkModeButton is rendered by LinkModeProvider internally (bottom-left) */}
              </div>
            }
          />
        </div>
      </div>
    </LinkModeProvider>
  );
}

export default App;
