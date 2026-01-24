export interface DataStore<T> {
  get: (key: string) => Promise<T | null>;
  put: (key: string, value: T) => Promise<void>;
}

export const createMemoryStore = <T>(): DataStore<T> => {
  const cache = new Map<string, T>();
  return {
    get: (key: string) => Promise.resolve(cache.get(key) || null),
    put: (key: string, value: T) => {
      cache.set(key, value);
      return Promise.resolve();
    },
  };
};

export const createFsStore = <T>(
  localDataPath: string = '.local/data',
): DataStore<T> => {
  if (typeof window !== 'undefined') {
    return createMemoryStore<T>();
  }

  // Use dynamic imports for node-only modules to avoid bundling them in the browser
  return {
    get: async (key: string): Promise<T | null> => {
      try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const localFile = path.join(localDataPath, key);
        const data = await fs.readFile(localFile, 'utf-8');
        return JSON.parse(data) as T;
      } catch {
        return null;
      }
    },
    put: async (key: string, value: T): Promise<void> => {
      try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const localFile = path.join(localDataPath, key);
        await fs.mkdir(path.dirname(localFile), { recursive: true });
        await fs.writeFile(localFile, JSON.stringify(value, null, 2));
      } catch (writeError) {
        console.warn(`Could not save ${key} to store:`, writeError);
      }
    },
  };
};
