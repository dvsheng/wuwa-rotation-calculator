export interface DataStore<T> {
  get: (key: string) => Promise<T | undefined>;
  put: (key: string, value: T) => Promise<void>;
}

export const createMemoryStore = <T>(): DataStore<T> => {
  const cache = new Map<string, T>();
  return {
    get: (key: string) => Promise.resolve(cache.get(key) || undefined),
    put: (key: string, value: T) => {
      cache.set(key, value);
      return Promise.resolve();
    },
  };
};

export const createFsStore = <T>(
  localDataPath: string = '.local/data',
): DataStore<T> => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (globalThis.window !== undefined) {
    return createMemoryStore<T>();
  }

  // Use dynamic imports for node-only modules to avoid bundling them in the browser
  return {
    get: async (key: string): Promise<T | undefined> => {
      try {
        const fs = await import('node:fs/promises');
        const { default: path } = await import('node:path');
        const localFile = path.join(localDataPath, key);
        const data = await fs.readFile(localFile, 'utf8');
        return JSON.parse(data) as T;
      } catch {
        return undefined;
      }
    },
    put: async (key: string, value: T): Promise<void> => {
      try {
        const fs = await import('node:fs/promises');
        const { default: path } = await import('node:path');
        const localFile = path.join(localDataPath, key);
        await fs.mkdir(path.dirname(localFile), { recursive: true });
        await fs.writeFile(localFile, JSON.stringify(value, undefined, 2));
      } catch (writeError) {
        console.warn(`Could not save ${key} to store:`, writeError);
      }
    },
  };
};
