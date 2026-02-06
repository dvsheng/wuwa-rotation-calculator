import { createServerFn } from '@tanstack/react-start';

import { GetEchoSetDetailsInputSchema } from '@/schemas/game-data-service';
import type { GetEchoSetDetailsInput } from '@/schemas/game-data-service';

import { toClientAttack, toClientBuff } from '../client-converters';
import { createFsStore } from '../hakushin-api/fs-store';

import { SetEffectRequirement } from './types';
import type {
  EchoSet,
  GetClientEchoSetDetailsOutput,
  SetEffectRequirement as SetEffectRequirementType,
  StoreEchoSet,
} from './types';

const echoSetStore = createFsStore<StoreEchoSet>();

/**
 * Shared handler for fetching echo set data.
 */
const getEchoSetDataHandler = async (id: string): Promise<StoreEchoSet> => {
  const key = `echo-set/parsed/${id}.json`;

  const echoSetData = await echoSetStore.get(key);
  if (!echoSetData) {
    throw new Error(`Failed to fetch echo set details for ID ${id}`);
  }

  return echoSetData;
};

/**
 * Returns applicable requirements for a given requirement level.
 */
const getApplicableRequirements = (
  requirement: SetEffectRequirementType,
): Array<SetEffectRequirementType> => {
  const requirementValue = Number.parseInt(requirement);
  return SetEffectRequirement.filter(
    (request) => Number.parseInt(request) <= requirementValue,
  );
};

/**
 * Shared handler for fetching echo set details with combined capabilities.
 */
export const getEchoSetDetailsHandler = async (
  input: GetEchoSetDetailsInput,
): Promise<EchoSet> => {
  const { id, requirement } = input;
  const echoSetData = await getEchoSetDataHandler(id);
  const applicableRequirements = getApplicableRequirements(requirement);

  const attacks = applicableRequirements.flatMap((request) => {
    const setEffect = echoSetData.setEffects[request];
    return setEffect?.attacks ?? [];
  });

  const modifiers = applicableRequirements.flatMap((request) => {
    const setEffect = echoSetData.setEffects[request];
    return setEffect?.modifiers ?? [];
  });

  const permanentStats = applicableRequirements.flatMap((request) => {
    const setEffect = echoSetData.setEffects[request];
    return setEffect?.permanentStats ?? [];
  });

  return {
    id: echoSetData.id,
    uuid: echoSetData.uuid,
    name: echoSetData.name,
    capabilities: { attacks, modifiers, permanentStats },
  };
};

/**
 * Returns echo set details with combined capabilities for all set effects
 * where requirement <= input requirement.
 */
export const getEchoSetDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEchoSetDetailsInputSchema)
  .handler(async ({ data }): Promise<EchoSet> => {
    return getEchoSetDetailsHandler(data);
  });

/**
 * Returns client-facing enriched attacks and modifiers for all set effects
 * where requirement <= input requirement.
 */
export const getClientEchoSetDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEchoSetDetailsInputSchema)
  .handler(async ({ data }): Promise<GetClientEchoSetDetailsOutput> => {
    const echoSet = await getEchoSetDetailsHandler(data);
    return {
      attacks: echoSet.capabilities.attacks.map((attack) =>
        toClientAttack(attack, echoSet.name, 'Weapon Attack', 'Echo Set'),
      ),
      modifiers: echoSet.capabilities.modifiers.map((modifier, index) =>
        toClientBuff(
          modifier,
          echoSet.name,
          `${echoSet.name} Buff ${index + 1}`,
          'Echo Set',
        ),
      ),
    };
  });
