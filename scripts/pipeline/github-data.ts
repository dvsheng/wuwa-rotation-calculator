import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { ZodType } from 'zod';

export const BASE_URL =
  'https://raw.githubusercontent.com/Arikatsu/WutheringWaves_Data/3.2';
export const WUWA_CHARACTER_DATA_BASE_URL =
  'https://raw.githubusercontent.com/dvsheng/wuwa-character-data/refs/heads/main';
export const WUWA_CHARACTER_DATA_TARBALL_URL =
  'https://codeload.github.com/dvsheng/wuwa-character-data/tar.gz/refs/heads/main';
export const OUTPUT_DIR = '.local/data/github';
export const CACHE_DIR = path.join(OUTPUT_DIR, 'cache');
export const SNAPSHOT_DIR = path.join(OUTPUT_DIR, 'snapshots');
export const WUWA_CHARACTER_DATA_SNAPSHOT_DIR = path.join(
  SNAPSHOT_DIR,
  'wuwa-character-data-main',
);
export const WUWA_CHARACTER_DATA_ROLE_SNAPSHOT_DIR = path.join(
  WUWA_CHARACTER_DATA_SNAPSHOT_DIR,
  'Character',
  'Role',
);
const FETCH_RETRY_COUNT = 5;
const FETCH_RETRY_DELAY_MS = 1000;

function formatZodIssues(
  filePath: string,
  error: { issues: Array<{ path: Array<PropertyKey>; message: string }> },
) {
  const details = error.issues
    .slice(0, 10)
    .map((issue) => {
      const issuePath =
        issue.path.length > 0 ? issue.path.map(String).join('.') : '<root>';
      return `${issuePath}: ${issue.message}`;
    })
    .join('\n');

  return `Validation failed for ${filePath}\n${details}`;
}

function getCachePath(namespace: string, filePath: string) {
  return path.join(CACHE_DIR, namespace, filePath || '__root__.json');
}

function readCachedFile(cachePath: string) {
  return JSON.parse(readFileSync(cachePath, 'utf8')) as unknown;
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit | undefined,
  label: string,
): Promise<Response> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= FETCH_RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) {
        return response;
      }

      const retryAfterSeconds = Number(response.headers.get('retry-after'));
      const shouldRetry =
        response.status === 403 || response.status === 429 || response.status >= 500;

      if (!shouldRetry || attempt === FETCH_RETRY_COUNT) {
        throw new Error(`Failed to fetch ${label}: ${response.status}`);
      }

      const delay =
        Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? retryAfterSeconds * 1000
          : FETCH_RETRY_DELAY_MS * attempt;
      console.log(
        `  [retry ${attempt}/${FETCH_RETRY_COUNT}] ${label} after ${response.status}`,
      );
      await sleep(delay);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === FETCH_RETRY_COUNT) {
        break;
      }

      console.log(`  [retry ${attempt}/${FETCH_RETRY_COUNT}] ${label} after error`);
      await sleep(FETCH_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${label}`);
}

async function fetchCachedJsonFromBase(
  namespace: string,
  baseUrl: string,
  filePath: string,
): Promise<unknown> {
  const cachePath = getCachePath(namespace, filePath);
  if (existsSync(cachePath)) {
    console.log(`  [cache hit] ${filePath}`);
    return readCachedFile(cachePath);
  }

  console.log(`  [fetching] ${filePath}`);
  const response = await fetchWithRetry(`${baseUrl}/${filePath}`, undefined, filePath);

  const text = await response.text();
  mkdirSync(path.dirname(cachePath), { recursive: true });
  writeFileSync(cachePath, text);
  return JSON.parse(text) as unknown;
}

async function fetchCachedJson(filePath: string): Promise<unknown> {
  return fetchCachedJsonFromBase('arikatsu', BASE_URL, filePath);
}

async function fetchAndValidateJson<T>(
  filePath: string,
  schema: ZodType<T>,
): Promise<T> {
  const raw = await fetchCachedJson(filePath);
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(formatZodIssues(filePath, parsed.error));
  }

  return parsed.data;
}

type GithubContentItem = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | undefined;
};

function getWuwaCharacterDataSnapshotPath(relativePath = '') {
  return path.join(WUWA_CHARACTER_DATA_ROLE_SNAPSHOT_DIR, relativePath);
}

function refreshWuwaCharacterDataSnapshot() {
  const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'wuwa-character-data-'));
  const tarballPath = path.join(temporaryDirectory, 'wuwa-character-data.tar.gz');

  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  rmSync(WUWA_CHARACTER_DATA_SNAPSHOT_DIR, { force: true, recursive: true });

  try {
    console.log(`Downloading ${WUWA_CHARACTER_DATA_TARBALL_URL}`);
    execSync(
      `curl -L --fail --silent --show-error '${WUWA_CHARACTER_DATA_TARBALL_URL}' -o '${tarballPath}'`,
      { stdio: 'inherit' },
    );

    console.log('Extracting wuwa-character-data tarball');
    execSync(`tar -xzf '${tarballPath}' -C '${SNAPSHOT_DIR}'`, { stdio: 'inherit' });
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
}

function listWuwaCharacterDataDirectory(
  directoryPath: string,
): Array<GithubContentItem> {
  const absoluteDirectoryPath = getWuwaCharacterDataSnapshotPath(directoryPath);
  if (
    !existsSync(absoluteDirectoryPath) ||
    !statSync(absoluteDirectoryPath).isDirectory()
  ) {
    return [];
  }

  return readdirSync(absoluteDirectoryPath, { withFileTypes: true })
    .map((entry): GithubContentItem => {
      const entryPath = directoryPath ? `${directoryPath}/${entry.name}` : entry.name;

      return {
        name: entry.name,
        path: entryPath,
        type: entry.isDirectory() ? 'dir' : 'file',
        download_url: entry.isDirectory()
          ? undefined
          : `${WUWA_CHARACTER_DATA_BASE_URL}/${entryPath}`,
      };
    })
    .toSorted((left, right) => left.path.localeCompare(right.path));
}

function fetchAndValidateWuwaCharacterDataJson<T>(
  filePath: string,
  schema: ZodType<T>,
): T {
  const absoluteFilePath = getWuwaCharacterDataSnapshotPath(filePath);
  if (!existsSync(absoluteFilePath)) {
    throw new Error(`Missing wuwa-character-data snapshot file: ${filePath}`);
  }

  const raw = JSON.parse(readFileSync(absoluteFilePath, 'utf8')) as unknown;
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(formatZodIssues(filePath, parsed.error));
  }

  return parsed.data;
}

function listWuwaCharacterPaths(): Array<string> {
  const rootItems = listWuwaCharacterDataDirectory('');
  const characterGroups = rootItems.filter((item) => item.type === 'dir');
  const nested = characterGroups.map((group) => {
    const children = listWuwaCharacterDataDirectory(group.path);
    return children.filter((item) => item.type === 'dir').map((item) => item.path);
  });

  return nested.flat().toSorted((left, right) => left.localeCompare(right));
}

async function listWuwaCharacterMontageFiles(): Promise<Array<string>> {
  const characterPaths = await listWuwaCharacterPaths();
  const listings = await Promise.all(
    characterPaths.map((characterPath) => {
      const commonAnimPath = `${characterPath}/CommonAnim`;
      const items = listWuwaCharacterDataDirectory(commonAnimPath);
      return items
        .filter(
          (item) =>
            item.type === 'file' &&
            item.name.startsWith('AM') &&
            item.name.endsWith('.json'),
        )
        .map((item) => item.path);
    }),
  );

  return listings.flat().toSorted((left, right) => left.localeCompare(right));
}

async function listWuwaSkillInfoAssetFiles(): Promise<Array<string>> {
  const characterPaths = await listWuwaCharacterPaths();
  const listings = await Promise.all(
    characterPaths.map((characterPath) => {
      const dataPath = `${characterPath}/Data`;
      const items = listWuwaCharacterDataDirectory(dataPath);
      return items
        .filter((item) => item.type === 'file' && item.name === 'DT_SkillInfo.json')
        .map((item) => item.path);
    }),
  );

  return listings.flat().toSorted((left, right) => left.localeCompare(right));
}

async function listWuwaReBulletDataMainFiles(): Promise<Array<string>> {
  const characterPaths = listWuwaCharacterPaths();
  const listings = await Promise.all(
    characterPaths.map((characterPath) => {
      const dataPath = `${characterPath}/Data`;
      const items = listWuwaCharacterDataDirectory(dataPath);
      return items
        .filter(
          (item) =>
            item.type === 'file' &&
            item.name.startsWith('DT_ReBulletDataMain') &&
            item.name.endsWith('.json'),
        )
        .map((item) => item.path);
    }),
  );

  return listings.flat().toSorted((left, right) => left.localeCompare(right));
}

export {
  fetchAndValidateJson,
  fetchAndValidateWuwaCharacterDataJson,
  listWuwaCharacterMontageFiles,
  listWuwaReBulletDataMainFiles,
  listWuwaSkillInfoAssetFiles,
  refreshWuwaCharacterDataSnapshot,
};
