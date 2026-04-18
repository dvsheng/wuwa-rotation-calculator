import type { MontageAsset, ReBulletDataMainRow, SkillInfoAsset } from '../repostiory';

import type { Montage } from './types';

type AssetObject = Record<string, unknown>;
type AssetObjectArray = Array<AssetObject>;

function isAssetObject(value: unknown): value is AssetObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAssetObjectArray(value: unknown): value is AssetObjectArray {
  return Array.isArray(value) && value.every((item) => isAssetObject(item));
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function getObject(value: unknown): AssetObject | undefined {
  return isAssetObject(value) ? value : undefined;
}

function getArray(value: unknown): AssetObjectArray | undefined {
  return isAssetObjectArray(value) ? value : undefined;
}

function getExportProperties(
  exportObject: AssetObject | undefined,
): AssetObject | undefined {
  return getObject(exportObject?.Properties);
}

function toDamageId(value: unknown): string | undefined {
  if (typeof value === 'number') return String(value);
  return getString(value);
}

function normalizeNotifyType(type: string | undefined): string | undefined {
  if (!type) return undefined;
  return type.endsWith('_C') ? type.slice(0, -2) : type;
}

function getMatchingNotifies(
  notifies: AssetObjectArray,
  type: string,
): AssetObjectArray {
  const normalizedType = normalizeNotifyType(type);
  return notifies.filter(
    (notify) => normalizeNotifyType(getString(notify.NotifyName)) === normalizedType,
  );
}

function getMatchingExports(rawData: AssetObjectArray, type: string): AssetObjectArray {
  return rawData.filter((entry) => getString(entry.Type) === type);
}

function zipNotifiesWithExports(
  notifies: AssetObjectArray,
  rawData: AssetObjectArray,
  type: string,
): Array<{ notify: AssetObject; exportObject: AssetObject | undefined }> {
  const matchingNotifies = getMatchingNotifies(notifies, type);
  const matchingExports = getMatchingExports(rawData.slice(1), type);

  return matchingNotifies.map((notify, index) => ({
    notify,
    exportObject: matchingExports[index],
  }));
}

function getDamageIds(properties: AssetObject | undefined): Array<string> {
  const useDamageIdArray = properties?.使用子弹id数组 === true;
  const damageIdArray = Array.isArray(properties?.子弹id数组)
    ? properties.子弹id数组
        .map((value) => toDamageId(value))
        .filter((value) => value !== undefined)
    : [];

  if (useDamageIdArray && damageIdArray.length > 0) {
    return damageIdArray;
  }

  const damageId = toDamageId(properties?.子弹数据名);
  if (!damageId || damageId === 'None') {
    return [];
  }

  return [damageId];
}

function buildReBulletDataMainMap(
  entityId: number,
  rows: Array<ReBulletDataMainRow>,
): Map<string, ReBulletDataMainRow> {
  const matchingRows = rows.filter((row) => row.entityId === entityId);
  const byBulletId = new Map<string, ReBulletDataMainRow>();

  for (const row of matchingRows) {
    const key = String(row.bulletId);
    const existing = byBulletId.get(key);
    if (!existing || existing.fileName !== 'DT_ReBulletDataMain.json') {
      byBulletId.set(key, row);
    }
  }

  return byBulletId;
}

function toMontage(
  rawMontage: MontageAsset,
  reBulletDataMainById: Map<string, ReBulletDataMainRow> = new Map(),
): Montage {
  const rawData = getArray(rawMontage.data) ?? [];
  const notifies = getArray(rawMontage.Notifies) ?? [];

  const hits = zipNotifiesWithExports(
    notifies,
    rawData,
    'TsAnimNotifyReSkillEvent_C',
  ).flatMap(({ notify, exportObject }) => {
    const properties = getExportProperties(exportObject);
    const time = getNumber(notify.LinkValue);
    if (time === undefined) {
      return [];
    }

    return getDamageIds(properties).map((damageId) => {
      const reBulletRow = reBulletDataMainById.get(damageId);
      return {
        time,
        damageId,
        hitCount: reBulletRow?.hitsPerTarget ?? undefined,
        totalHitCap: reBulletRow?.totalHitCap ?? undefined,
        hitInterval: reBulletRow?.hitInterval ?? undefined,
      };
    });
  });

  const tags = zipNotifiesWithExports(
    notifies,
    rawData,
    'TsAnimNotifyStateAddTag_C',
  ).flatMap(({ notify, exportObject }) => {
    const properties = getExportProperties(exportObject);
    const time = getNumber(notify.LinkValue);
    const tag = getObject(properties?.Tag);
    const name = getString(tag?.TagName);

    if (time === undefined || name === undefined) {
      return [];
    }

    return [
      {
        name,
        time,
        duration: getNumber(properties?.CurrentTimeLength),
      },
    ];
  });

  const events = zipNotifiesWithExports(
    notifies,
    rawData,
    'TsAnimNotifySendGamePlayEvent_C',
  ).flatMap(({ notify, exportObject }) => {
    const properties = getExportProperties(exportObject);
    const time = getNumber(notify.LinkValue);
    const eventTag = getObject(properties?.事件Tag);
    const name = getString(eventTag?.TagName);

    if (time === undefined || name === undefined) {
      return [];
    }

    return [{ name, time }];
  });

  const cancelTime = getNumber(
    getMatchingNotifies(notifies, 'TsAnimNotifyStateNextAtt_C')[0]?.LinkValue,
  );
  const endTime = getNumber(
    getMatchingNotifies(notifies, 'TsAnimNotifyEndSkill_C')[0]?.LinkValue,
  );

  return {
    name: rawMontage.Name,
    hits,
    cancelTime,
    endTime,
    tags,
    events,
  };
}

function toMontageName(assetPathName: string): string | undefined {
  const assetName = assetPathName.split('/').at(-1)?.split('.').at(0);
  if (!assetName?.startsWith('AM')) return undefined;

  return assetName;
}

function getRowMontageSourcePaths(row: AssetObject): Array<string> {
  const montageNames = new Set<string>();

  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('Animations_')) {
      for (const animation of getArray(value) ?? []) {
        const assetPathName = getString(animation.AssetPathName);
        if (!assetPathName) continue;

        const montageName = toMontageName(assetPathName);
        if (montageName) montageNames.add(montageName);
      }
    }

    if (key.startsWith('MontagePaths_')) {
      if (!Array.isArray(value)) continue;

      for (const montagePath of value) {
        const assetPathName = getString(montagePath);
        if (!assetPathName) continue;

        const montageName = toMontageName(assetPathName);
        if (montageName) montageNames.add(montageName);
      }
    }
  }

  return [...montageNames];
}

function buildMontageSkillMap(
  skillInfoAsset: SkillInfoAsset,
): Map<string, Array<number>> {
  const rows = getObject(skillInfoAsset.Rows) ?? {};
  const byMontageName = new Map<string, Array<number>>();

  for (const [rowId, rowValue] of Object.entries(rows)) {
    const skillId = Number.parseInt(rowId, 10);
    if (Number.isNaN(skillId)) continue;

    const row = getObject(rowValue);
    if (!row) continue;

    for (const montageName of getRowMontageSourcePaths(row)) {
      const ids = byMontageName.get(montageName) ?? [];
      ids.push(skillId);
      byMontageName.set(montageName, ids);
    }
  }

  return byMontageName;
}

export { buildMontageSkillMap, buildReBulletDataMainMap, toMontage };
