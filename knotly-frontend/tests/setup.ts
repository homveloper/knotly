/**
 * Vitest setup file
 * Runs before all test files
 */

// Add any global test setup here
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
