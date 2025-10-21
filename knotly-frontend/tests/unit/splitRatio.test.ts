/**
 * Unit tests for split ratio functionality
 * Tests clamping and localStorage persistence for SplitLayout component
 * Following Given-When-Then structure (Constitution Principle VI)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { clampSplitRatio, saveSplitRatio, loadSplitRatio } from '../../src/utils/splitRatioHelpers';

describe('splitRatio', () => {
  // T077: Split ratio clamping tests
  describe('clampSplitRatio', () => {
    it('should clamp ratio below 30% to 30%', () => {
      // Given: a ratio of 25% (below minimum)
      const ratio = 25;

      // When: clamping the ratio
      const result = clampSplitRatio(ratio);

      // Then: should return 30% (minimum)
      expect(result).toBe(30);
    });

    it('should clamp ratio above 70% to 70%', () => {
      // Given: a ratio of 75% (above maximum)
      const ratio = 75;

      // When: clamping the ratio
      const result = clampSplitRatio(ratio);

      // Then: should return 70% (maximum)
      expect(result).toBe(70);
    });

    it('should allow ratio within 30-70% range', () => {
      // Given: valid ratios within range
      const validRatios = [30, 40, 50, 60, 70];

      // When: clamping each ratio
      const results = validRatios.map(clampSplitRatio);

      // Then: should return the same values
      expect(results).toEqual(validRatios);
    });

    it('should handle edge case of exactly 30%', () => {
      // Given: ratio at minimum boundary
      const ratio = 30;

      // When: clamping the ratio
      const result = clampSplitRatio(ratio);

      // Then: should return 30%
      expect(result).toBe(30);
    });

    it('should handle edge case of exactly 70%', () => {
      // Given: ratio at maximum boundary
      const ratio = 70;

      // When: clamping the ratio
      const result = clampSplitRatio(ratio);

      // Then: should return 70%
      expect(result).toBe(70);
    });
  });

  // T078: LocalStorage persistence tests
  describe('localStorage persistence', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    afterEach(() => {
      // Clear localStorage after each test
      localStorage.clear();
    });

    it('should save split ratio to localStorage', () => {
      // Given: a split ratio of 40-60
      const sizes = [40, 60];

      // When: saving to localStorage
      saveSplitRatio(sizes);

      // Then: should be stored in localStorage
      const stored = localStorage.getItem('split-sizes');
      expect(stored).toBe(JSON.stringify(sizes));
    });

    it('should load split ratio from localStorage', () => {
      // Given: a saved split ratio in localStorage
      const sizes = [35, 65];
      localStorage.setItem('split-sizes', JSON.stringify(sizes));

      // When: loading from localStorage
      const result = loadSplitRatio();

      // Then: should return the saved ratio
      expect(result).toEqual(sizes);
    });

    it('should return null if no saved ratio exists', () => {
      // Given: empty localStorage (no saved ratio)

      // When: loading from localStorage
      const result = loadSplitRatio();

      // Then: should return null
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON in localStorage', () => {
      // Given: invalid JSON in localStorage
      localStorage.setItem('split-sizes', 'invalid-json');

      // When: loading from localStorage
      const result = loadSplitRatio();

      // Then: should return null (graceful error handling)
      expect(result).toBeNull();
    });

    it('should return null for non-array values in localStorage', () => {
      // Given: non-array value in localStorage
      localStorage.setItem('split-sizes', JSON.stringify({ a: 50, b: 50 }));

      // When: loading from localStorage
      const result = loadSplitRatio();

      // Then: should return null
      expect(result).toBeNull();
    });

    it('should return null for array with wrong length', () => {
      // Given: array with wrong length in localStorage
      localStorage.setItem('split-sizes', JSON.stringify([50]));

      // When: loading from localStorage
      const result = loadSplitRatio();

      // Then: should return null
      expect(result).toBeNull();
    });

    it('should persist split ratio across save and load', () => {
      // Given: a split ratio to persist
      const sizes = [45, 55];

      // When: saving and then loading
      saveSplitRatio(sizes);
      const loaded = loadSplitRatio();

      // Then: should match the original ratio
      expect(loaded).toEqual(sizes);
    });
  });
});
