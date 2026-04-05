import { compact } from 'es-toolkit';

import type { OriginType } from '@/services/game-data/types';
import { EntityType, Sequence } from '@/services/game-data/types';

import {
  dedupeDamageInstances,
  tryTransformToDamageInstance,
} from '../damage-instances/transform-damage-to-damage-instance';
import type { DamageInstance } from '../damage-instances/types';
import { damage, skillAttributes } from '../repostiory';
import { listEntitySkillsHandler } from '../skills/list-entity-skills.server';

import type {
  DamageInstanceWithAlternativeDefinitions,
  SequenceMultipliers,
} from './infer-alternative-definitions-from-chains';
import { inferAlternativeDefinitions } from './infer-alternative-definitions-from-chains';
import { inferAttacksFromSkillAttributes } from './infer-attacks-from-skill-attributes';
import type { EntityAttack } from './types';

export async function listEntityAttacksHandler(
  entityId: number,
  entityType: EntityType,
): Promise<Array<EntityAttack>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      return listCharacterAttacks(entityId);
    }
    case EntityType.ECHO:
    case EntityType.ECHO_SET:
    case EntityType.WEAPON: {
      return [];
    }
  }
}

function getAllowedAlternativeDefinitionsFromChains(
  chains: Array<{
    descriptionParameters?: Array<string>;
    originType: OriginType;
  }>,
): SequenceMultipliers {
  return chains.flatMap((chain) =>
    (chain.descriptionParameters ?? []).flatMap((parameter) => {
      if (!parameter.endsWith('%')) return [];

      const value = Number.parseFloat(parameter.slice(0, -1));
      if (!Number.isFinite(value) || value <= 0) return [];

      return [
        {
          sequence: chain.originType as Sequence,
          value: 1 + value / 100,
        },
      ];
    }),
  );
}

const transformDamageRowsToAttackDamageInstances = (
  damageRows: Array<Awaited<ReturnType<typeof damage.getByIds>>[number]>,
  sequenceMultipliers: SequenceMultipliers,
): Array<
  DamageInstance & {
    alternativeDefinitions?: DamageInstanceWithAlternativeDefinitions['alternativeDefinitions'];
  }
> => {
  const dedupedDamageRows = dedupeDamageInstances(damageRows);
  const damages = dedupedDamageRows.map((raw) => ({
    raw,
    damageInstance: tryTransformToDamageInstance(raw, raw.dedupedIds),
  }));
  const instancesWithAltDefinitions = inferAlternativeDefinitions(
    damages,
    sequenceMultipliers,
  );
  const idsWithAltDefinitions = new Set(
    instancesWithAltDefinitions.flatMap((instance) => [
      instance.id,
      ...instance.dedupedIds,
      ...Object.values(instance.alternativeDefinitions).flatMap((_instance) => [
        instance.id,
        ...instance.dedupedIds,
      ]),
    ]),
  );
  return [
    ...instancesWithAltDefinitions,
    ...compact(damages.map((dmg) => dmg.damageInstance)).filter(
      (instance) => !idsWithAltDefinitions.has(instance.id),
    ),
  ];
};

async function listCharacterAttacks(entityId: number): Promise<Array<EntityAttack>> {
  const entitySkills = await listEntitySkillsHandler(entityId, EntityType.CHARACTER);

  const allowedAlternativeDefinitions = getAllowedAlternativeDefinitionsFromChains(
    entitySkills.filter((skill) =>
      Object.values(Sequence).includes(skill.originType as Sequence),
    ),
  );

  const skillsWithDamage = entitySkills.filter((skill) => skill.damageIds.length > 0);

  const attackGroups = await Promise.all(
    skillsWithDamage.map(async (skill) => {
      const damageRows = await damage.getByIds(skill.damageIds);
      if (damageRows.length === 0) return [];

      const damageInstances = transformDamageRowsToAttackDamageInstances(
        damageRows,
        allowedAlternativeDefinitions,
      );
      const attributes = await skillAttributes.list();
      const filteredAttributes = attributes.filter(
        (attribute) => attribute.skillLevelGroupId === skill.gameId,
      );

      return inferAttacksFromSkillAttributes(damageInstances, filteredAttributes).map(
        (attack) => ({
          ...attack,
          entityId,
          skillId: skill.gameId,
          skillOriginType: skill.originType,
          skillName: skill.name,
          skillDescription: skill.description,
          skillIconUrl: skill.iconUrl,
          skillAttribute: skill.skillAttributes?.find(
            (skillAttribute) => String(skillAttribute.id) === attack.id,
          )
            ? {
                name: skill.skillAttributes.find(
                  (skillAttribute) => String(skillAttribute.id) === attack.id,
                )!.attributeName,
                order: skill.skillAttributes.find(
                  (skillAttribute) => String(skillAttribute.id) === attack.id,
                )!.order,
              }
            : undefined,
        }),
      );
    }),
  );

  return attackGroups.flat();
}
