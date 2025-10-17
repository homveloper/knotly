import { Canvas } from './components/Canvas';
import { FABButton } from './components/FABButton';
import { Settings } from './components/Settings';
import { LinkModeProvider } from './components/LinkModeButton';

/**
 * App - Main application component
 *
 * Renders:
 * - LinkModeProvider: Context provider for link mode state (wraps all interactive components)
 * - Full-screen Canvas for the graph editor
 * - Settings toolbar (top-left) for grid and snap toggles
 * - FABButton overlay (bottom-right) for creating new nodes
 * - LinkModeButton overlay (bottom-left) for entering link mode (rendered by LinkModeProvider)
 *
 * Layout:
 * - Container fills entire viewport
 * - Canvas takes full width/height
 * - Settings positioned fixed at top-left
 * - FABButton positioned fixed at bottom-right
 * - LinkModeButton positioned fixed at bottom-left
 *
 * State Management:
 * - All state managed via Zustand store (useCanvasStore)
 * - Link mode state managed via React Context (LinkModeContext)
 * - All components interact through store actions/state and context
 *
 * Component Hierarchy:
 * - LinkModeProvider provides context to Canvas and NodeComponent
 * - LinkModeProvider renders LinkModeButton UI
 * - Canvas and Settings render as overlays
 * - FABButton renders as fixed overlay
 */

function App() {
  return (
    <LinkModeProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-white">
        {/* Full-screen canvas - allows creating/editing/moving nodes and viewing edges */}
        <Canvas />

        {/* Settings toolbar for grid and snap controls (top-left) */}
        <Settings />

        {/* Floating action button for creating nodes (bottom-right) */}
        <FABButton />

        {/* LinkModeButton is rendered by LinkModeProvider internally (bottom-left) */}
      </div>
    </LinkModeProvider>
  );
}

export default App;
