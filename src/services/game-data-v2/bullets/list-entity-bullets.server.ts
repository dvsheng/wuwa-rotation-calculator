import { EntityType } from '@/services/game-data/types';

import { reBulletDataMainRows } from '../repostiory';
import type { ReBulletDataMainRow } from '../repostiory';

import type { Bullet } from './types';

async function listCharacterBullets(entityId: number): Promise<Array<Bullet>> {
  const allRows = await reBulletDataMainRows.list();
  return allRows
    .filter((row) => row.entityId === entityId)
    .map((row) => transformRow(row));
}

export async function listEntityBulletsHandler(
  entityId: number,
  entityType: EntityType,
): Promise<Array<Bullet>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      return listCharacterBullets(entityId);
    }
    case EntityType.ECHO:
    case EntityType.ECHO_SET:
    case EntityType.WEAPON: {
      return [];
    }
  }
}

type ChildBulletEntry = {
  召唤子弹ID: number;
  召唤子弹延迟: number;
  召唤子弹数量: number;
};

function transformRow(row: ReBulletDataMainRow): Bullet {
  const base = row.rowData.基础设置;
  const exec = row.rowData.执行逻辑;
  const children = row.rowData['子子弹设置'] as Array<ChildBulletEntry> | undefined;

  const singleHit = base?.伤害ID;
  const multiHits = base?.多伤害ID ?? [];
  const hits: Array<number> = [
    ...(singleHit == undefined ? [] : [singleHit]),
    ...multiHits,
  ];

  return {
    id: String(row.bulletId),
    name: row.bulletName ?? row.rowData.子弹名称 ?? '',
    hits,
    hitInterval: row.hitInterval ?? base?.作用间隔 ?? 0,
    duration: base?.持续时间 ?? 0,
    shouldDestroyOnSkillEnd: base?.技能结束是否销毁子弹 ?? false,
    children: (children ?? []).map((c) => ({
      bulletId: c.召唤子弹ID,
      delay: c.召唤子弹延迟,
      count: c.召唤子弹数量,
    })),
    onHitBuffs: {
      attacker: exec?.命中后对攻击者应用GE的Id ?? [],
      victim: exec?.命中后对受击者应用GE的Id ?? [],
      energy: exec?.能量恢复类GE数组的Id ?? [],
      onField: exec?.命中后对在场上角色应用的GE的Id ?? [],
    },
  };
}
