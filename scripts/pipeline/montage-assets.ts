import path from 'node:path';

import type {
  NewRawMontage,
  NewRawReBulletDataMainRow,
  NewRawSkillInfoAsset,
  RawReBulletDataBaseSettings,
  RawReBulletDataRow,
} from '../../src/db/raw-schema';

import type { RawMontageAssetArray } from './github-data.schemas';
import { findWuwaCharacterEntityId } from './wuwa-character-entity-ids';

type RawAssetObject = Record<string, unknown>;
type RawAssetArray = Array<RawAssetObject>;

function getAssetRoot(data: RawAssetArray): RawAssetObject | undefined {
  const [first] = data;
  return first;
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getNumberValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function getCharacterPath(sourcePath: string) {
  return path.posix.dirname(path.posix.dirname(sourcePath));
}

function getCharacterName(sourcePath: string) {
  return path.posix.basename(getCharacterPath(sourcePath));
}

function getFileName(sourcePath: string) {
  return path.posix.basename(sourcePath);
}

function findValueByPrefix(record: RawAssetObject | undefined, prefix: string) {
  if (!record) return;
  return Object.entries(record).find(([key]) => key.startsWith(prefix))?.[1];
}

function getBaseSettings(row: RawAssetObject) {
  return findValueByPrefix(row, '基础设置');
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
  const entityId = findWuwaCharacterEntityId(characterName);
  if (entityId === undefined) return undefined;
  const montage = data[0];
  return {
    name: montage.Name,
    entityId,
    characterName,
    data: montage,
    notifyDetails: data.slice(1),
  };
}

function toRawSkillInfoAssetRow(
  sourcePath: string,
  data: RawAssetArray,
): NewRawSkillInfoAsset {
  const root = getAssetRoot(data);
  const rows =
    root?.Rows && typeof root.Rows === 'object' && !Array.isArray(root.Rows)
      ? (root.Rows as Record<string, unknown>)
      : undefined;

  return {
    characterName: getCharacterName(sourcePath),
    fileName: getFileName(sourcePath),
    ...(rows ? { Rows: rows } : {}),
    data,
  };
}

function toRawReBulletDataMainRows(
  sourcePath: string,
  data: RawAssetArray,
): Array<NewRawReBulletDataMainRow> {
  const root = getAssetRoot(data);
  const entityId = findWuwaCharacterEntityId(getCharacterName(sourcePath));
  if (entityId === undefined) {
    return [];
  }
  const rows =
    root?.Rows && typeof root.Rows === 'object' && !Array.isArray(root.Rows)
      ? (root.Rows as Record<string, unknown>)
      : {};

  return Object.entries(rows).flatMap(([bulletId, rowValue]) => {
    if (typeof rowValue !== 'object' || rowValue === null || Array.isArray(rowValue)) {
      return [];
    }

    const row = rowValue as RawAssetObject;
    const baseSettingsValue = getBaseSettings(row);
    const baseSettings =
      typeof baseSettingsValue === 'object' &&
      baseSettingsValue !== null &&
      !Array.isArray(baseSettingsValue)
        ? (normalizeReBulletJson(baseSettingsValue) as RawReBulletDataBaseSettings)
        : undefined;
    const normalizedRow = normalizeReBulletJson(row) as RawReBulletDataRow;
    const parsedBulletId = Number.parseInt(bulletId, 10);
    if (Number.isNaN(parsedBulletId)) {
      return [];
    }

    return [
      {
        entityId,
        bulletId: parsedBulletId,
        fileName: getFileName(sourcePath),
        bulletName: getStringValue(normalizedRow.子弹名称),
        hitsPerTarget: getNumberValue(
          findValueByPrefix(baseSettings, '每个单位总作用次数'),
        ),
        totalHitCap: getNumberValue(findValueByPrefix(baseSettings, '总作用次数限制')),
        hitInterval: getNumberValue(findValueByPrefix(baseSettings, '作用间隔')),
        baseSettings,
        rowData: normalizedRow,
      },
    ];
  });
}

export { toRawMontageRow, toRawReBulletDataMainRows, toRawSkillInfoAssetRow };
