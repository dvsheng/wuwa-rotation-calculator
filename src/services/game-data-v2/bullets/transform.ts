import { compact, uniqBy } from 'es-toolkit';

import type { ReBulletDataMainRow } from '../repostiory';

import type { BulletData } from './types';

export function transform(row: ReBulletDataMainRow): BulletData {
  const base = row.rowData.基础设置;
  const exec = row.rowData.执行逻辑;
  const children = row.rowData['子子弹设置'] as
    | Array<{
        召唤子弹ID: number;
        召唤子弹延迟: number;
        召唤子弹数量: number;
      }>
    | undefined;

  return {
    id: String(row.bulletId),
    name: row.rowData.子弹名称 ?? '',
    hits:
      base?.多伤害ID && base.多伤害ID.length > 0
        ? base.多伤害ID
        : compact(
            Array.from({ length: base?.每个单位总作用次数 ?? 1 }).map(
              (_) => base?.伤害ID,
            ),
          ),
    totalHitCap: base?.总作用次数限制 ?? -1,
    hitInterval: base?.作用间隔 ?? 0,
    duration: base?.持续时间 ?? 0,
    requiredTags: extractTags(base?.子弹允许生成Tag),
    forbiddenTags: extractTags(base?.子弹禁止生成Tag),
    shouldDestroyOnSkillEnd: base?.技能结束是否销毁子弹 ?? false,
    // Assume that identical children fired at the same time are redundant because
    // they generally represent children for different ranges
    children: uniqBy(
      (children ?? []).map((c) => ({
        bulletId: String(c.召唤子弹ID),
        delay: c.召唤子弹延迟,
        count: c.召唤子弹数量,
      })),
      (child) => JSON.stringify(child),
    ),
    onHitBuffs: {
      attacker: exec?.命中后对攻击者应用GE的Id ?? [],
      victim: exec?.命中后对受击者应用GE的Id ?? [],
      energy: exec?.能量恢复类GE数组的Id ?? [],
      onField: exec?.命中后对在场上角色应用的GE的Id ?? [],
    },
  };
}

function extractTags(values: Array<unknown> | undefined): Array<string> {
  if (!values) return [];
  return values.flatMap((v) => {
    if (typeof v === 'string') return [v];
    if (
      typeof v === 'object' &&
      v !== null &&
      !Array.isArray(v) &&
      'TagName' in v &&
      typeof (v as Record<string, unknown>).TagName === 'string'
    ) {
      return [(v as Record<string, string>).TagName];
    }
    return [];
  });
}
