import { createServerFn } from '@tanstack/react-start';

import { toClientAttack, toClientBuff } from '../client-converters';
import type { GetClientEntityDetailsOutput } from '../common-types';
import { createFsStore } from '../hakushin-api/fs-store';

import { GetEchoSetDetailsInputSchema, SetEffectRequirement } from './types';
import type { EchoSet, GetEchoSetDetailsOutput } from './types';

const echoSetStore = createFsStore<EchoSet>();

/**
 * Returns echo set details with combined capabilities for all set effects
 * where requirement <= input requirement.
 */
export const getEchoSetDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEchoSetDetailsInputSchema)
  .handler(async ({ data }): Promise<GetEchoSetDetailsOutput> => {
    const { id, requirement } = data;
    const key = `echo-set/parsed/${id}.json`;

    const echoSetData = await echoSetStore.get(key);
    if (!echoSetData) {
      throw new Error(`Failed to fetch echo set details for ID ${id}`);
    }

    const requirementValue = parseInt(requirement, 10);

    // Get all set effects where requirement <= input requirement
    const applicableRequirements = SetEffectRequirement.filter(
      (req) => parseInt(req, 10) <= requirementValue,
    );

    const attacks = applicableRequirements.flatMap((req) => {
      const setEffect = echoSetData.setEffects[req];
      return setEffect?.attacks ?? [];
    });

    const modifiers = applicableRequirements.flatMap((req) => {
      const setEffect = echoSetData.setEffects[req];
      return setEffect?.modifiers ?? [];
    });

    const permanentStats = applicableRequirements.flatMap((req) => {
      const setEffect = echoSetData.setEffects[req];
      return setEffect?.permanentStats ?? [];
    });

    return {
      id: echoSetData.id,
      uuid: echoSetData.uuid,
      name: echoSetData.name,
      capabilities: { attacks, modifiers, permanentStats },
    };
  });

/**
 * Returns client-facing enriched attacks and modifiers for all set effects
 * where requirement <= input requirement.
 */
export const getClientEchoSetDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEchoSetDetailsInputSchema)
  .handler(async ({ data }): Promise<GetClientEntityDetailsOutput> => {
    const { id, requirement } = data;
    const key = `echo-set/parsed/${id}.json`;
    const echoSet = await echoSetStore.get(key);
    if (!echoSet) {
      throw new Error(`Failed to fetch echo set details for ID ${id}`);
    }

    const requirementValue = parseInt(requirement, 10);

    // Get all set effects where requirement <= input requirement
    const applicableRequirements = SetEffectRequirement.filter(
      (req) => parseInt(req, 10) <= requirementValue,
    );

    const attacks = applicableRequirements.flatMap((req) => {
      const setEffect = echoSet.setEffects[req];
      if (!setEffect) return [];
      return setEffect.attacks.map((attack) =>
        toClientAttack(attack, echoSet.name, `${echoSet.name} (${req}pc) Attack`),
      );
    });

    const modifiers = applicableRequirements.flatMap((req) => {
      const setEffect = echoSet.setEffects[req];
      if (!setEffect) return [];
      return setEffect.modifiers.map((modifier) =>
        toClientBuff(modifier, echoSet.name, `${echoSet.name} (${req}pc) Buff`),
      );
    });

    return { attacks, modifiers };
  });
