// StartScreen component - initial landing screen for new/open file actions
// Displays when no note is currently loaded

import { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { openFile } from '../utils/fileIO';

/**
 * StartScreen - Landing page shown when app first loads or when no file is open
 * Provides actions to:
 * - Create a new note with default tokens
 * - Open an existing .knotly.md file via file picker or drag & drop
 * - Access recent files (max 5, stored in localStorage)
 */
export function StartScreen() {
  const { newNote, loadFile, recentFiles } = useCanvasStore();
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleNewNote = () => {
    newNote();
  };

  const handleOpenFile = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const fileHandle = await openFile();
      if (fileHandle) {
        await loadFile(fileHandle);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);
    setIsLoading(true);

    try {
      const files = Array.from(e.dataTransfer.files);
      const file = files[0];

      if (!file) {
        setError('No file dropped');
        setIsLoading(false);
        return;
      }

      // T089: Validate file extension (.knotly.md only)
      if (!file.name.endsWith('.knotly.md')) {
        setError(`Unsupported file type: "${file.name}"\nOnly .knotly.md files are supported`);
        setIsLoading(false);
        return;
      }

      await loadFile(file);
    } catch (err: any) {
      setError(err.message || 'Failed to load dropped file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecentFileClick = async (fileName: string) => {
    // Since we only store file names (not handles), we need to prompt user to select the file
    // In a real implementation, we'd need to store file handles with File System Access API
    // For now, show a helpful message
    setError(`Please use "Open File" to load "${fileName}"`);
  };

  const handleClearRecentFiles = () => {
    localStorage.removeItem('knotly-recent-files');
    useCanvasStore.setState({ recentFiles: [] });
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`max-w-md w-full p-8 bg-white rounded-2xl shadow-xl transition-all duration-200 ${
          isDragOver ? 'ring-4 ring-blue-400 scale-105' : ''
        }`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Knotly</h1>
          <p className="text-gray-600">
            Create mind maps with hand-drawn charm
          </p>
          {isDragOver && (
            <p className="text-blue-600 font-semibold mt-2 animate-pulse">
              Drop your .knotly.md file here
            </p>
          )}
        </div>

        {/* Error Toast */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-red-600 text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-800 font-medium">
                Loading file...
              </p>
            </div>
          </div>
        )}

        {/* Primary Actions */}
        <div className="space-y-4">
          {/* New Note Button */}
          <button
            onClick={handleNewNote}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">+</span>
              <span>New Note</span>
            </div>
          </button>

          {/* Open File Button */}
          <button
            onClick={handleOpenFile}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-semibold rounded-lg shadow-sm transition-colors duration-200"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">📂</span>
              <span>Open File</span>
            </div>
          </button>
        </div>

        {/* Recent Files */}
        {recentFiles.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase">
                Recent Files
              </h2>
              <button
                onClick={handleClearRecentFiles}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {recentFiles.slice(0, 5).map((fileName, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentFileClick(fileName)}
                  disabled={isLoading}
                  className="w-full py-2 px-4 text-left text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-25 rounded-lg text-sm transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="text-gray-400">📄</span>
                  <span className="flex-1 truncate">{fileName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Recent Files */}
        {recentFiles.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">No recent files</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
          <p>Tip: Press Cmd/Ctrl+S to save your work</p>
          <p>Drag & drop .knotly.md files anywhere on this screen</p>
        </div>
      </div>
    </div>
  );
}
