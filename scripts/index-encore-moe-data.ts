#!/usr/bin/env tsx

/**
 * Script to index all JSON and image files from encore.moe into local file system.
 * Implements two-phase indexing: JSON data first, then batch image downloads.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://api-v2.encore.moe';
const OUTPUT_DIR = path.join(__dirname, '../.local/data/encore.moe');
const MAX_RETRIES = 3;

// ============================================================================
// Types
// ============================================================================

interface EntityListItem {
  Id: number;
  Name: string;
  [key: string]: unknown;
}

interface CharacterListResponse {
  roleList: Array<EntityListItem>;
}

interface WeaponListResponse {
  weapons: Array<EntityListItem>;
}

interface EchoListResponse {
  Echo: Array<EntityListItem>;
}

type EntityListResponse = CharacterListResponse | WeaponListResponse | EchoListResponse;

type EntityType = 'character' | 'weapon' | 'echo';

// ============================================================================
// File System Operations
// ============================================================================

const createDirectoryIfNotExists = async (directoryPath: string): Promise<void> => {
  await mkdir(directoryPath, { recursive: true });
};

const saveJSON = async (data: unknown, outputPath: string): Promise<boolean> => {
  await createDirectoryIfNotExists(path.dirname(outputPath));
  await writeFile(outputPath, JSON.stringify(data, undefined, 2));
  console.log(`Saved: ${outputPath}`);
  return true;
};

// ============================================================================
// Network Operations with Retry Logic
// ============================================================================

const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  context = 'operation',
): Promise<T> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.warn(`${context} - Attempt ${attempt} failed, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('Unreachable');
};

const fetchJSON = async <T>(url: string): Promise<T> => {
  console.log(`Fetching: ${url}`);
  return withRetry(
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      return response.json() as T;
    },
    MAX_RETRIES,
    url,
  );
};

// ============================================================================
// Entity List Parsing
// ============================================================================

const extractEntityList = (response: EntityListResponse): Array<EntityListItem> => {
  if ('roleList' in response) {
    return response.roleList;
  }
  if ('weapons' in response) {
    return response.weapons;
  }
  if ('Echo' in response) {
    return response.Echo;
  }
  throw new Error('Unknown response format');
};

// ============================================================================
// Entity Type Indexing
// ============================================================================

const indexEntityType = async (
  entityType: EntityType,
  listUrl: string,
): Promise<void> => {
  console.log(`\n=== Indexing ${entityType}s ===`);

  // Fetch and save entity list
  const response = await fetchJSON<EntityListResponse>(listUrl);
  const list = extractEntityList(response);

  const indexPath = path.join(OUTPUT_DIR, 'api', 'en', entityType, 'index.json');
  await saveJSON(response, indexPath);

  // Fetch and save individual entity JSON files
  await Promise.all(
    list.map(async (item) => {
      const itemUrl = `${listUrl}/${item.Id}`;
      const itemData = await fetchJSON<unknown>(itemUrl);
      const itemPath = path.join(
        OUTPUT_DIR,
        'api',
        'en',
        entityType,
        `${item.Id}.json`,
      );
      await saveJSON(itemData, itemPath);
    }),
  );

  console.log(`Completed indexing ${list.length} ${entityType}s`);
};

// ============================================================================
// Main Entry Point
// ============================================================================

const main = async () => {
  console.log('Starting encore.moe data indexing...\n');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  try {
    await createDirectoryIfNotExists(OUTPUT_DIR);
    // Phase 1: Index JSON data
    console.log('📥 Phase 1: Indexing JSON data...\n');
    await indexEntityType('character', `${BASE_URL}/api/en/character`);
    await indexEntityType('weapon', `${BASE_URL}/api/en/weapon`);
    await indexEntityType('echo', `${BASE_URL}/api/en/echo`);

    console.log('\n✅ Data indexing completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during indexing:', error);
    process.exit(1);
  }
};

await main();
