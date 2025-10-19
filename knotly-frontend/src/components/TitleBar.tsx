// TitleBar component - displays filename and save status at top of canvas
// Shows unsaved changes indicator (●) and save success indicator (✓)

import { useEffect, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';

/**
 * TitleBar - Top bar showing file name and save status
 * Features:
 * - Displays current file name or "Untitled Note"
 * - Shows ● when there are unsaved changes
 * - Shows ✓ for 2 seconds after successful save
 * - Handles Cmd/Ctrl+S keyboard shortcut
 */
export function TitleBar() {
  const { currentFilePath, hasUnsavedChanges, saveFile } = useCanvasStore();
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Watch for hasUnsavedChanges changing from true to false (successful save)
  useEffect(() => {
    if (!hasUnsavedChanges && !isSaving) {
      // Show checkmark for 2 seconds
      setShowSavedIndicator(true);
      const timer = setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges, isSaving]);

  // Keyboard shortcut: Cmd/Ctrl+S
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        setIsSaving(true);
        await saveFile();
        setIsSaving(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  const displayName = currentFilePath || 'Untitled Note';

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: File name and status indicators */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {displayName}
            </h1>

            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              {/* Unsaved changes indicator */}
              {hasUnsavedChanges && !showSavedIndicator && (
                <span
                  className="text-orange-500 text-xl"
                  title="Unsaved changes"
                  aria-label="Unsaved changes"
                >
                  ●
                </span>
              )}

              {/* Saved indicator (temporary, 2 seconds) */}
              {showSavedIndicator && (
                <span
                  className="text-green-600 text-xl animate-fade-in"
                  title="Saved successfully"
                  aria-label="Saved successfully"
                >
                  ✓
                </span>
              )}

              {/* Saving indicator */}
              {isSaving && (
                <span className="text-gray-400 text-sm" aria-label="Saving">
                  Saving...
                </span>
              )}
            </div>
          </div>

          {/* Right: Save button and help text */}
          <div className="flex items-center gap-4">
            {/* T097: Keyboard shortcut help */}
            <div className="text-xs text-gray-500 hidden sm:block">
              <div className="flex flex-col gap-0.5">
                <span title="Save the current file">⌘/Ctrl+S to save</span>
                <span title="Delete selected node">Delete/Backspace to delete</span>
              </div>
            </div>

            <button
              onClick={async () => {
                setIsSaving(true);
                await saveFile();
                setIsSaving(false);
              }}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              title="Save (Cmd/Ctrl+S)"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
