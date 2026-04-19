import path from 'node:path';

import type {
  NewRawMontage,
  NewRawReBulletDataMainRow,
  NewRawSkillInfoAsset,
  RawReBulletDataRow,
} from '../../src/db/raw-schema';

import type {
  RawMontageAssetArray,
  RawSkillInfoAssetArray,
} from './github-data.schemas';

type RawAssetObject = Record<string, unknown>;
type RawAssetArray = Array<RawAssetObject>;

function getAssetRoot(data: RawAssetArray): RawAssetObject | undefined {
  const [first] = data;
  return first;
}

function getCharacterPath(sourcePath: string) {
  return path.posix.dirname(path.posix.dirname(sourcePath));
}

function getCharacterName(sourcePath: string) {
  return path.posix.basename(getCharacterPath(sourcePath));
}

function stripHashedKeySuffix(key: string) {
  return key.replace(/_\d+_[\dA-F]+$/i, '');
}

function normalizeReBulletJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeReBulletJson(entry));
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const normalizedEntries = Object.entries(value).map(([key, entryValue]) => [
    stripHashedKeySuffix(key),
    normalizeReBulletJson(entryValue),
  ]);

  return Object.fromEntries(normalizedEntries);
}

function toRawMontageRow(
  sourcePath: string,
  data: RawMontageAssetArray,
): NewRawMontage | undefined {
  const characterName = getCharacterName(sourcePath);
  const montage = data.at(0);
  if (!montage) return;
  return {
    name: montage.Name,
    characterName,
    data: montage,
    notifyDetails: data.slice(1),
  };
}

function toRawSkillInfoAssetRow(
  sourcePath: string,
  data: RawSkillInfoAssetArray,
): NewRawSkillInfoAsset {
  return {
    characterName: getCharacterName(sourcePath),
    data: data[0],
  };
}

function toRawReBulletDataMainRows(
  sourcePath: string,
  data: RawAssetArray,
): Array<NewRawReBulletDataMainRow> {
  const root = getAssetRoot(data);
  const characterName = getCharacterName(sourcePath);
  const rows =
    root?.Rows && typeof root.Rows === 'object' && !Array.isArray(root.Rows)
      ? (root.Rows as Record<string, unknown>)
      : {};

  return Object.entries(rows).flatMap(([bulletId, rowValue]) => {
    if (typeof rowValue !== 'object' || rowValue === null || Array.isArray(rowValue)) {
      return [];
    }
    const row = rowValue as RawAssetObject;
    const normalizedRow = normalizeReBulletJson(row) as RawReBulletDataRow;
    const parsedBulletId = Number.parseInt(bulletId);
    if (Number.isNaN(parsedBulletId)) {
      return [];
    }
    return [
      {
        characterName,
        bulletId: parsedBulletId,
        rowData: normalizedRow,
      },
    ];
  });
}

export { toRawMontageRow, toRawReBulletDataMainRows, toRawSkillInfoAssetRow };
