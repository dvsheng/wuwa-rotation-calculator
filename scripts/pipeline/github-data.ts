import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { ZodType } from 'zod';

export const BASE_URL =
  'https://raw.githubusercontent.com/Arikatsu/WutheringWaves_Data/3.2';
export const OUTPUT_DIR = '.local/data/github';
export const CACHE_DIR = path.join(OUTPUT_DIR, 'cache');

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

async function fetchCachedJson(filePath: string): Promise<unknown> {
  const cachePath = path.join(CACHE_DIR, filePath.replaceAll('/', '__'));
  if (existsSync(cachePath)) {
    console.log(`  [cache hit] ${filePath}`);
    return JSON.parse(readFileSync(cachePath, 'utf8')) as unknown;
  }

  console.log(`  [fetching] ${filePath}`);
  const response = await fetch(`${BASE_URL}/${filePath}`);
  if (!response.ok) throw new Error(`Failed to fetch ${filePath}: ${response.status}`);

  const text = await response.text();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, text);
  return JSON.parse(text) as unknown;
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

export { fetchAndValidateJson };
