import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage for Zustand persist middleware
class LocalStorageMock {
  private store: Map<string, string>;

  constructor() {
    this.store = new Map();
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    // eslint-disable-next-line unicorn/no-null
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  get length() {
    return this.store.size;
  }

  key(index: number) {
    // eslint-disable-next-line unicorn/no-null
    return [...this.store.keys()][index] || null;
  }
}

globalThis.localStorage = new LocalStorageMock() as Storage;

// Mock Zustand to reset stores between tests
// This follows the pattern from: https://zustand.docs.pmnd.rs/guides/testing#vitest
vi.mock('zustand');
