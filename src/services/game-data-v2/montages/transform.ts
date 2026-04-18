import { isNil } from 'es-toolkit';

import type { MontageAsset, SkillInfoAsset } from '../repostiory';

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

function getObject(value: unknown): AssetObject | undefined {
  return isAssetObject(value) ? value : undefined;
}

function getArray(value: unknown): AssetObjectArray | undefined {
  return isAssetObjectArray(value) ? value : undefined;
}

function toBulletId(value: unknown): string | undefined {
  if (typeof value === 'number') return String(value);
  return getString(value);
}

function getBulletIds(properties: AssetObject | undefined): Array<string> {
  const useDamageIdArray = properties?.使用子弹id数组 === true;
  const bulletIdArray = Array.isArray(properties?.子弹id数组)
    ? properties.子弹id数组
        .map((value) => toBulletId(value))
        .filter((value) => value !== undefined)
    : [];

  if (useDamageIdArray && bulletIdArray.length > 0) {
    return bulletIdArray;
  }

  const bulletId = toBulletId(properties?.子弹数据名);
  if (!bulletId || bulletId === 'None') {
    return [];
  }

  return [bulletId];
}

function toMontage(rawMontage: MontageAsset): Montage {
  const data = rawMontage.data;
  const notifications = data.Properties.Notifies ?? [];
  const notifyDetails = rawMontage.notifyDetails;
  const notificationDetailsByName = new Map(
    notifyDetails.map((notify) => [notify.Name, notify]),
  );
  const bullets = notifications
    .filter((notify) => notify.NotifyName === 'TsAnimNotifyReSkillEvent_C')
    .flatMap((notify) => {
      const time = notify.LinkValue;
      const detailReference = getDetailReference(notify.Notify?.ObjectName ?? '');
      const details = notificationDetailsByName.get(detailReference);
      return getBulletIds(details?.Properties).map((id) => ({ bulletId: id, time }));
    });

  const tags = notifications
    .filter((notify) => notify.NotifyName === 'TsAnimNotifyStateAddTag_C')
    .flatMap((notify) => {
      const time = notify.LinkValue;
      const detailReference = getDetailReference(notify.Notify?.ObjectName ?? '');
      const details = notificationDetailsByName.get(detailReference);
      const tag = details?.Properties?.Tag;
      const duration = details?.Properties?.CurrentTimeLength;
      if (!tag || !duration) return [];
      return [{ time, name: tag as string, duration: duration as number }];
    });
  const events = notifications
    .filter((notify) => notify.NotifyName === 'TsAnimNotifySendGamePlayEvent_C')
    .flatMap((notify) => {
      const time = notify.LinkValue;
      const detailReference = getDetailReference(notify.Notify?.ObjectName ?? '');
      const details = notificationDetailsByName.get(detailReference);
      const eventTag = details?.Properties?.事件Tag;
      const name =
        typeof eventTag === 'object' && !isNil(eventTag) && 'TagName' in eventTag
          ? (eventTag.TagName as string)
          : undefined;
      if (!name) return [];
      return [{ time, name }];
    });

  const cancelTime = notifications.find(
    (notify) => notify.NotifyName === 'TsAnimNotifyStateNextAtt_C',
  )?.LinkValue;
  const endTime = notifications.find(
    (notify) => notify.NotifyName === 'TsAnimNotifyEndSkill_C',
  )?.LinkValue;

  return {
    name: rawMontage.name,
    bullets,
    cancelTime,
    endTime,
    tags,
    events,
  };
}

const getDetailReference = (name: string): string => {
  return name.split(':').at(-1)?.replace("'", '') ?? '';
};

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

export { buildMontageSkillMap, toMontage };
