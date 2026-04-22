import { CapabilityType } from '@/services/game-data/types';

import { getEntityBuffs } from '../buffs/list-entity-buffs';

import { groupBuffsByConnection, groupBuffsBySharedTags } from './group-buffs';
import type { Modifier } from './types';

export async function listEntityModifiers(entityId: number): Promise<Array<Modifier>> {
  const entityBuffs = await getEntityBuffs(entityId);
  const modifierBuffs = entityBuffs.filter(
    (buff) => buff.type === CapabilityType.MODIFIER,
  );

  const connectionGroups = groupBuffsByConnection(modifierBuffs);
  const multiBuffConnectionGroups = connectionGroups.filter(
    (group) => group.length > 1,
  );
  const groupedBuffIds = new Set(
    multiBuffConnectionGroups.flatMap((group) => group.map((buff) => buff.buffId)),
  );
  const remainingBuffs = modifierBuffs.filter(
    (buff) => !groupedBuffIds.has(buff.buffId),
  );
  const sharedTagGroups = groupBuffsBySharedTags(remainingBuffs);

  return [...multiBuffConnectionGroups, ...sharedTagGroups]
    .filter((group) => group.length > 0)
    .map((buffs) => ({ buffs }));
}
