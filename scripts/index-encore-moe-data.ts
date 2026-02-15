#!/usr/bin/env tsx

/**
 * Script to index all JSON and image files from encore.moe into local file system.
 * Implements two-phase indexing: JSON data first, then batch image downloads.
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://api-v2.encore.moe';
const OUTPUT_DIR = path.join(__dirname, '../.local/data/encore.moe');
const MAX_RETRIES = 3;
const MEDIA_EXTENSIONS = /\.(mp3|mp4|mov|avi|webm|ogg|wav|flac)$/i;
const IMAGE_EXTENSIONS = /\.(png|webp|jpg|jpeg)$/i;

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

interface EntityDetail {
  Id?: number;
  Name?: string;
  [key: string]: unknown;
}

type EntityType = 'character' | 'weapon' | 'echo';

interface ImageDownload {
  url: string;
  outputPath: string;
}

// ============================================================================
// File System Operations
// ============================================================================

const isFilePresent = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const createDirectoryIfNotExists = async (directoryPath: string): Promise<void> => {
  await mkdir(directoryPath, { recursive: true });
};

const saveJSON = async (data: unknown, outputPath: string): Promise<boolean> => {
  if (await isFilePresent(outputPath)) {
    console.log(`Skipping existing file: ${outputPath}`);
    return false;
  }

  await createDirectoryIfNotExists(path.dirname(outputPath));
  await writeFile(outputPath, JSON.stringify(data, undefined, 2));
  console.log(`Saved: ${outputPath}`);
  return true;
};

const loadJSON = async <T>(filePath: string): Promise<T> => {
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content) as T;
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

const downloadFile = async (url: string, outputPath: string): Promise<void> => {
  if (await isFilePresent(outputPath)) {
    console.log(`Skipping existing file: ${outputPath}`);
    return;
  }

  await withRetry(
    async () => {
      console.log(`Downloading: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download ${url}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      await createDirectoryIfNotExists(path.dirname(outputPath));
      await writeFile(outputPath, Buffer.from(buffer));
      console.log(`Saved: ${outputPath}`);
    },
    MAX_RETRIES,
    url,
  );
};

// ============================================================================
// URL and Icon Extraction
// ============================================================================

const isMediaUrl = (url: string): boolean => MEDIA_EXTENSIONS.test(url);

const isImageUrl = (url: string): boolean =>
  url.includes('/resource/Data/') || IMAGE_EXTENSIONS.test(url);

const extractIconUrls = (object: unknown, urls = new Set<string>()): Set<string> => {
  if (typeof object === 'string' && object.startsWith('http')) {
    if (!isMediaUrl(object) && isImageUrl(object)) {
      urls.add(object);
    }
  } else if (Array.isArray(object)) {
    for (const item of object) {
      extractIconUrls(item, urls);
    }
  } else if (object && typeof object === 'object') {
    for (const value of Object.values(object)) {
      extractIconUrls(value, urls);
    }
  }
  return urls;
};

const createImageDownload = (iconUrl: string): ImageDownload => {
  const urlPath = new URL(iconUrl).pathname;
  const outputPath = path.join(OUTPUT_DIR, urlPath);
  return { url: iconUrl, outputPath };
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

const queueIconsFromUrls = (
  iconUrls: Set<string>,
  imageQueue: Array<ImageDownload>,
): void => {
  for (const iconUrl of iconUrls) {
    imageQueue.push(createImageDownload(iconUrl));
  }
};

const processExistingEntityFile = async (
  filePath: string,
  imageQueue: Array<ImageDownload>,
): Promise<void> => {
  try {
    const existingData = await loadJSON<EntityDetail>(filePath);
    const iconUrls = extractIconUrls(existingData);
    queueIconsFromUrls(iconUrls, imageQueue);
  } catch (error) {
    console.error(`Error reading existing file ${filePath}:`, error);
  }
};

const fetchAndSaveEntityDetail = async (
  entityType: EntityType,
  entityId: number,
  imageQueue: Array<ImageDownload>,
): Promise<void> => {
  const detailUrl = `${BASE_URL}/api/en/${entityType}/${entityId}`;
  const detailPath = path.join(OUTPUT_DIR, 'api', 'en', entityType, `${entityId}.json`);

  if (await isFilePresent(detailPath)) {
    console.log(`Skipping existing file: ${detailPath}`);
    await processExistingEntityFile(detailPath, imageQueue);
    return;
  }

  try {
    const detail = await fetchJSON<EntityDetail>(detailUrl);
    await saveJSON(detail, detailPath);

    const iconUrls = extractIconUrls(detail);
    queueIconsFromUrls(iconUrls, imageQueue);
  } catch (error) {
    console.error(`Error fetching ${entityType} ${entityId}:`, error);
  }
};

// ============================================================================
// Entity Type Indexing
// ============================================================================

const indexEntityType = async (
  entityType: EntityType,
  listUrl: string,
  imageQueue: Array<ImageDownload>,
): Promise<void> => {
  console.log(`\n=== Indexing ${entityType}s ===`);

  // Fetch and save entity list
  const response = await fetchJSON<EntityListResponse>(listUrl);
  const list = extractEntityList(response);

  const indexPath = path.join(OUTPUT_DIR, 'api', 'en', entityType, 'index.json');
  await saveJSON(response, indexPath);

  // Extract icons from list
  const listIconUrls = extractIconUrls(list);
  queueIconsFromUrls(listIconUrls, imageQueue);

  // Fetch and save each entity detail
  for (const item of list) {
    await fetchAndSaveEntityDetail(entityType, item.Id, imageQueue);
  }

  console.log(`Completed indexing ${list.length} ${entityType}s`);
};

// ============================================================================
// Image Download Processing
// ============================================================================

const downloadImages = async (imageQueue: Array<ImageDownload>): Promise<void> => {
  console.log(`\n🖼️  Phase 2: Downloading ${imageQueue.length} images...\n`);

  let downloaded = 0;
  for (const { url, outputPath } of imageQueue) {
    await downloadFile(url, outputPath);
    downloaded++;
    if (downloaded % 50 === 0) {
      console.log(`Progress: ${downloaded}/${imageQueue.length} images downloaded`);
    }
  }
};

// ============================================================================
// Main Entry Point
// ============================================================================

const main = async () => {
  console.log('Starting encore.moe data indexing...\n');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  try {
    await createDirectoryIfNotExists(OUTPUT_DIR);

    const imageQueue: Array<ImageDownload> = [];

    // Phase 1: Index JSON data
    console.log('📥 Phase 1: Indexing JSON data...\n');
    await indexEntityType('character', `${BASE_URL}/api/en/character`, imageQueue);
    await indexEntityType('weapon', `${BASE_URL}/api/en/weapon`, imageQueue);
    await indexEntityType('echo', `${BASE_URL}/api/en/echo`, imageQueue);

    // Phase 2: Download images
    await downloadImages(imageQueue);

    console.log('\n✅ Data indexing completed successfully!');
    console.log(`📊 Summary: ${imageQueue.length} images processed`);
  } catch (error) {
    console.error('\n❌ Error during indexing:', error);
    process.exit(1);
  }
};

await main();
