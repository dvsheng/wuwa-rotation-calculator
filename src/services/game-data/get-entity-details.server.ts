import { eq } from 'drizzle-orm';
import { compact } from 'es-toolkit/array';

import { database } from '@/db/client';
import type { DatabaseFullCapability } from '@/db/schema';
import { fullCapabilities } from '@/db/schema';
import type { GetEntityDetailsRequest } from '@/schemas/game-data-service';
import { Attribute, DamageType } from '@/types';
import type { CharacterDamageInstance } from '@/types';

import { toClientAttack, toClientBuff } from './client-type-adapters';
import {
  replaceNullsWithUndefined,
  resolveAlternativeDefinitions,
  resolveStoreNumberType,
  sequenceToNumber,
} from './database-type-adapters';
import type { GetClientEntityDetailsResponse } from './get-entity-details.types';
import { CapabilityType, EntityType } from './types';
import type { Attack, BaseEntity, Modifier, PermanentStat, RefineLevel } from './types';

const refineLevelToNumber = (refineLevel?: RefineLevel): number => {
  if (!refineLevel) return 0;
  return Number.parseInt(refineLevel);
};

type ResolvedCapability = ReturnType<typeof toCapability>;
type CapabilityWithJsonType<TType extends CapabilityType> = ResolvedCapability & {
  capabilityJson: Extract<ResolvedCapability['capabilityJson'], { type: TType }>;
};
type AttackCapability = CapabilityWithJsonType<typeof CapabilityType.ATTACK>;
type ModifierCapability = CapabilityWithJsonType<typeof CapabilityType.MODIFIER>;
type PermanentStatCapability = CapabilityWithJsonType<
  typeof CapabilityType.PERMANENT_STAT
>;

/**
 * Check if a capability is active at the given sequence.
 */
const isCapabilityActive = (
  item: { skillOriginType?: string; skillName?: string },
  activatedSequence: number = 0,
  activatedSetBonus: number = 0,
): boolean => {
  // Check sequence requirement
  const unlockedAtSequence = sequenceToNumber(item.skillOriginType);
  if (activatedSequence < unlockedAtSequence) {
    return false;
  }

  // Check set bonus requirement (e.g., "Frosty Resolve - 2" requires activatedSetBonus >= 2)
  const setBonusMatch = item.skillName?.match(/ - (\d+)$/);
  if (setBonusMatch) {
    const setBonusRequirement = Number.parseInt(setBonusMatch[1], 10);
    return activatedSetBonus >= setBonusRequirement;
  }

  // No set bonus requirement, capability is active
  return true;
};

/**
 * Convert fullCapabilities record to Attack format (flattening capabilityJson)
 */
const toAttack = (attack: AttackCapability): Attack => {
  const json = attack.capabilityJson;
  return {
    id: attack.capabilityId,
    capabilityType: attack.capabilityType,
    name: attack.capabilityName ?? attack.skillName,
    description: attack.capabilityDescription ?? attack.skillDescription,
    originType: attack.skillOriginType,
    parentName: attack.skillName,
    iconUrl: attack.skillIconUrl ?? attack.entityIconUrl ?? undefined,
    attribute: json.attribute,
    damageInstances: (json.damageInstances as Array<CharacterDamageInstance>).map(
      (di) => ({
        ...di,
        attribute: (di.tags.find((value) =>
          Object.values(Attribute).includes(value as Attribute),
        ) ?? attack.attribute) as Attribute,
        damageType: di.tags.find((value) =>
          Object.values(DamageType).includes(value as DamageType),
        ) as DamageType,
        tags: compact([...di.tags, attack.capabilityName, json.attribute]),
      }),
    ),
  };
};

/**
 * Convert fullCapabilities record to Modifier format (flattening capabilityJson)
 */
const toModifier = (modifier: ModifierCapability): Modifier => {
  const json = modifier.capabilityJson;
  return {
    id: modifier.capabilityId,
    capabilityType: modifier.capabilityType,
    name: modifier.capabilityName ?? modifier.skillName,
    description: modifier.capabilityDescription ?? modifier.skillDescription,
    originType: modifier.skillOriginType,
    parentName: modifier.skillName,
    iconUrl: modifier.skillIconUrl ?? modifier.entityIconUrl ?? undefined,
    modifiedStats: json.modifiedStats as Modifier['modifiedStats'],
  };
};

/**
 * Convert fullCapabilities record to PermanentStat format (flattening capabilityJson)
 */
const toPermanentStat = (permanentStat: PermanentStatCapability): PermanentStat => {
  const json = permanentStat.capabilityJson;
  return {
    id: permanentStat.capabilityId,
    capabilityType: permanentStat.capabilityType,
    name: permanentStat.capabilityName ?? permanentStat.skillName,
    description: permanentStat.capabilityDescription ?? permanentStat.skillDescription,
    originType: permanentStat.skillOriginType,
    stat: json.stat,
    value: json.value as PermanentStat['value'],
    tags: json.tags,
  };
};

const toCapability = (
  databaseCapability: DatabaseFullCapability,
  options: {
    sequence?: number;
    refineLevel: number;
  },
) => {
  return resolveStoreNumberType(
    replaceNullsWithUndefined(
      resolveAlternativeDefinitions(databaseCapability, options.sequence),
    ),
    options.refineLevel,
  );
};

const isAttackCapability = (
  capability: ResolvedCapability,
): capability is AttackCapability =>
  capability.capabilityType === CapabilityType.ATTACK;

const isModifierCapability = (
  capability: ResolvedCapability,
): capability is ModifierCapability =>
  capability.capabilityType === CapabilityType.MODIFIER;

const isPermanentStatCapability = (
  capability: ResolvedCapability,
): capability is PermanentStatCapability =>
  capability.capabilityType === CapabilityType.PERMANENT_STAT;

/**
 * Shared handler for fetching character details from database.
 * Resolves alternativeDefinitions based on the requested sequence.
 */
export const getEntityByIdHandler = async (
  options: GetEntityDetailsRequest,
): Promise<BaseEntity> => {
  // Query entity with all capabilities
  const databaseCapabilities = await database
    .select()
    .from(fullCapabilities)
    .where(eq(fullCapabilities.entityId, options.id));
  if (databaseCapabilities.length === 0) {
    console.error(`Entity not found for ID ${options.id}`);
    throw new Error(`Entity not found for ID ${options.id}`);
  }
  const sequence =
    options.entityType === EntityType.CHARACTER ? options.activatedSequence : 0;
  const refineLevel =
    options.entityType === EntityType.WEAPON
      ? refineLevelToNumber(options.refineLevel)
      : 0;
  const activatedSetBonus =
    options.entityType === EntityType.ECHO_SET ? options.activatedSetBonus : 0;

  const firstCapability = databaseCapabilities[0];

  // Filter and resolve attacks, adding attribute and tags
  const capabilities = databaseCapabilities
    .map((capability) => toCapability(capability, { sequence, refineLevel }))
    .filter((capability) =>
      isCapabilityActive(capability, sequence, activatedSetBonus),
    );
  const attacks = capabilities
    .filter((capability) => isAttackCapability(capability))
    .map((capability) => toAttack(capability));
  const modifiers = capabilities
    .filter((capability) => isModifierCapability(capability))
    .map((modifier) => toModifier(modifier));
  const permanentStats = capabilities
    .filter((capability) => isPermanentStatCapability(capability))
    .map((stat) => toPermanentStat(stat));
  return {
    id: firstCapability.entityId,
    gameId: firstCapability.entityId,
    name: firstCapability.entityName,
    iconUrl: firstCapability.entityIconUrl ?? undefined,
    capabilities: {
      attacks: attacks,
      modifiers: modifiers,
      permanentStats: permanentStats,
    },
  };
};

export const getClientEntityByIdHandler = async (
  options: GetEntityDetailsRequest,
): Promise<GetClientEntityDetailsResponse> => {
  const entity = await getEntityByIdHandler(options);
  return {
    id: entity.id,
    name: entity.name,
    iconUrl: entity.iconUrl,
    attacks: entity.capabilities.attacks.map((attack) => toClientAttack(attack)),
    modifiers: entity.capabilities.modifiers.map((modifier) => toClientBuff(modifier)),
  };
};
