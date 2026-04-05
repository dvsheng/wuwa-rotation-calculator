import { fetchAndValidateJson } from './github-data';
import { TextEntryArraySchema } from './github-data.schemas';

/**
 * Loads localized textmap shards through the shared GitHub data loader and exposes
 * convenient helpers for resolving raw text keys into localized strings.
 *
 * The module owns:
 * - fetching and caching the textmap JSON files
 * - validating them with zod before use
 * - memoizing per-locale resolvers so repeated lookups are cheap
 */
type TextResolver = (key: string) => string;

const textResolversByLocale = new Map<string, Promise<TextResolver>>();

async function loadTextResolver(locale = 'en'): Promise<TextResolver> {
  const [multiText, multiTextFirstHalf, multiTextSecondHalf] = await Promise.all([
    fetchAndValidateJson(
      `Textmaps/${locale}/multi_text/MultiText.json`,
      TextEntryArraySchema,
    ),
    fetchAndValidateJson(
      `Textmaps/${locale}/multi_text_1sthalf/MultiText.json`,
      TextEntryArraySchema,
    ),
    fetchAndValidateJson(
      `Textmaps/${locale}/multi_text_2ndhalf/MultiText.json`,
      TextEntryArraySchema,
    ),
  ]);

  const textMap = new Map(
    [...multiText, ...multiTextFirstHalf, ...multiTextSecondHalf]
      .map((textEntry) => [textEntry.Key ?? textEntry.Id, textEntry.Content] as const)
      .filter(([key, value]) => key && value),
  );

  return (key: string) => textMap.get(key) ?? key;
}

/**
 * Returns a memoized synchronous resolver for one locale.
 *
 * This is mainly useful for transform-heavy codepaths, like the pipeline join step,
 * where thousands of text lookups happen inside synchronous loops after the locale
 * data has been loaded once.
 */
export async function getTextResolver(locale = 'en'): Promise<TextResolver> {
  const existingResolver = textResolversByLocale.get(locale);
  if (existingResolver) return existingResolver;

  const resolverPromise = loadTextResolver(locale);
  textResolversByLocale.set(locale, resolverPromise);
  return resolverPromise;
}

/**
 * Resolves a text key for the requested locale.
 *
 * Usage:
 * - `await getText('RoleInfo_1402_Name')`
 * - `await getText('WeaponConf_21010074_WeaponName', 'en')`
 *
 * If a key is missing, the original key is returned unchanged so downstream code can
 * continue operating without crashing.
 */
export async function getText(key: string, locale = 'en'): Promise<string> {
  const resolveText = await getTextResolver(locale);
  return resolveText(key);
}

export function sanitizeDescriptionText(value: string): string {
  return value
    .replaceAll(/<\/?SapTag(?:=[^>]+)?>/giu, '')
    .replaceAll(/\{Cus:[^}]+\}/giu, '')
    .replaceAll(/\s{2,}/g, ' ')
    .replaceAll(/[ \t]+\n/g, '\n')
    .trim();
}
