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

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Zustand to reset stores between tests
// This follows the pattern from: https://zustand.docs.pmnd.rs/guides/testing#vitest
vi.mock('zustand');

// Prevent the DB client from throwing "Set DATABASE_URL" at module-evaluation
// time in tests that don't need a real connection. Tests that actually exercise
// database code (e.g. *.server.test.ts) override this with their own vi.mock.
vi.mock('@/db/client', () => ({ database: {} }));
