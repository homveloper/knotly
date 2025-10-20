/**
 * Split Ratio Utility Functions
 * Handles split pane ratio clamping and localStorage persistence
 * Used by SplitLayout component
 */

/**
 * Minimum and maximum split ratio percentages
 */
const MIN_RATIO = 30;
const MAX_RATIO = 70;

/**
 * Clamp split ratio to 30-70% range
 * Used to enforce split pane constraints
 *
 * @param ratio - Ratio percentage to clamp
 * @returns Clamped ratio between 30 and 70
 */
export function clampSplitRatio(ratio: number): number {
  return Math.max(MIN_RATIO, Math.min(MAX_RATIO, ratio));
}

/**
 * Save split ratio to localStorage
 * Persists split pane sizes across browser sessions
 *
 * @param sizes - Array of split percentages [left, right]
 */
export function saveSplitRatio(sizes: number[]): void {
  localStorage.setItem('split-sizes', JSON.stringify(sizes));
}

/**
 * Load split ratio from localStorage
 * Restores previously saved split pane sizes
 *
 * @returns Array of split percentages, or null if not found/invalid
 */
export function loadSplitRatio(): number[] | null {
  const saved = localStorage.getItem('split-sizes');
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length === 2) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
