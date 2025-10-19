import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useCanvasStore } from '../store/canvasStore';

/**
 * LinkModeContext - React Context for managing link mode state
 *
 * Allows LinkModeButton to manage state and provide callbacks to NodeComponent
 * without passing props through multiple component layers.
 *
 * Provides:
 * - connectMode: boolean - whether link mode is active
 * - firstNodeId: string | null - ID of first selected node
 * - onNodeSelected: (nodeId: string) => void - callback for node selection
 */

interface LinkModeContextType {
  connectMode: boolean;
  firstNodeId: string | null;
  onNodeSelected: (nodeId: string) => void;
  cancelConnectMode: () => void;
}

const LinkModeContext = createContext<LinkModeContextType | undefined>(
  undefined
);

/**
 * LinkModeProvider - Wraps components that need access to link mode
 *
 * Should wrap the Canvas and related components in App.tsx
 */
export const LinkModeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [connectMode, setConnectMode] = useState(false);
  const [firstNodeId, setFirstNodeId] = useState<string | null>(null);
  const [selfLoopAttempt, setSelfLoopAttempt] = useState(false);

  const createEdge = useCanvasStore((state) => state.createEdge);

  // Handle node selection during link mode
  const handleNodeSelected = (nodeId: string) => {
    if (!connectMode) {
      // Link mode not active, activate it and set first node
      setConnectMode(true);
      setFirstNodeId(nodeId);
      setSelfLoopAttempt(false);
      return;
    }

    if (!firstNodeId) {
      // First node selection (should not reach here, but handle it anyway)
      setFirstNodeId(nodeId);
      setSelfLoopAttempt(false);
      return;
    }

    // Second node selection - create edge
    if (firstNodeId === nodeId) {
      // Prevent self-loops per edge case handling
      setSelfLoopAttempt(true);
      // Reset after 2 seconds
      setTimeout(() => setSelfLoopAttempt(false), 2000);
      return;
    }

    // Create the edge from first to second node
    createEdge(firstNodeId, nodeId);

    // Reset link mode state
    setConnectMode(false);
    setFirstNodeId(null);
    setSelfLoopAttempt(false);
  };

  // Cancel connect mode - reset all state
  const cancelConnectMode = () => {
    setConnectMode(false);
    setFirstNodeId(null);
    setSelfLoopAttempt(false);
  };

  const value: LinkModeContextType = {
    connectMode,
    firstNodeId,
    onNodeSelected: handleNodeSelected,
    cancelConnectMode,
  };

  return (
    <LinkModeContext.Provider value={value}>
      {children}
    </LinkModeContext.Provider>
  );
};

/**
 * Hook to access link mode state from any component
 * Used by NodeComponent to know if it should handle link mode clicks
 */
export const useLinkMode = (): LinkModeContextType => {
  const context = useContext(LinkModeContext);
  if (!context) {
    throw new Error('useLinkMode must be used within LinkModeProvider');
  }
  return context;
};

/**
 * LinkModeButton - Floating action button to toggle link creation mode
 *
 * Features:
 * - Local state: connectMode (bool), firstNodeId (string | null)
 * - When connectMode is OFF: button shows "🔗" (link icon)
 * - When connectMode is ON: button shows "🔗✓" (link icon with checkmark)
 * - Visual feedback: changes color to green when in link mode
 * - Status indicator shows which step of link creation we're on
 *
 * Layout:
 * - Fixed position bottom-left (to distinguish from FAB button at bottom-right)
 * - 56px diameter FAB style with shadow
 * - Tailwind styling for consistency with FAB
 *
 * Edge Cases:
 * - Prevents self-loops: if firstNodeId === selectedNodeId, shows message
 * - Prevents duplicate edges: store actions should enforce uniqueness
 */

interface LinkModeButtonProps {
  connectMode: boolean;
  firstNodeId: string | null;
  selfLoopAttempt: boolean;
  onToggle: () => void;
}

const LinkModeButton: React.FC<LinkModeButtonProps> = ({
  connectMode,
  firstNodeId,
  selfLoopAttempt,
  onToggle,
}) => {
  return (
    <>
      {/* Link Mode Button - Fixed bottom-left */}
      <button
        onClick={onToggle}
        className={`fixed bottom-4 left-4 w-14 h-14 rounded-full shadow-lg text-xl font-bold transition-all flex items-center justify-center z-20 ${
          connectMode
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-purple-500 text-white hover:bg-purple-600'
        }`}
        title={
          connectMode
            ? 'Cancel link mode (select nodes to connect)'
            : 'Enter link mode (click two nodes to connect)'
        }
        aria-label="Link mode button"
      >
        {connectMode ? '🔗✓' : '🔗'}
      </button>

      {/* Status indicator when in link mode */}
      {connectMode && (
        <div
          className={`fixed bottom-20 left-4 px-3 py-2 rounded text-xs whitespace-nowrap z-20 transition-colors ${
            selfLoopAttempt
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-white'
          }`}
        >
          {selfLoopAttempt
            ? '❌ Cannot link node to itself'
            : firstNodeId
              ? 'Select target node'
              : 'Select first node'}
        </div>
      )}
    </>
  );
};
