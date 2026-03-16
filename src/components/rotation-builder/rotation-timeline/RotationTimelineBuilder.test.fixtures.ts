import type { GetClientEntityDetailsResponse } from '@/services/game-data';
import { CapabilityType, Target } from '@/services/game-data';

const TEST_ENTITY_DETAILS = [
  {
    id: 463,
    name: 'Mornye',
    iconUrl:
      'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHeadCircle256/T_IconRoleHeadCircle256_61_UI.webp',
    attacks: [
      {
        id: 227,
        capabilityType: CapabilityType.ATTACK,
        name: 'Basic Attack Stage 1',
        originType: 'Normal Attack',
        parentName: 'Ground State Calibration',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconNor/SP_IconNorSword.webp',
        damageInstances: [
          {
            tags: [],
            attribute: 'fusion',
            damageType: 'basicAttack',
            motionValue: 0.2227,
            scalingStat: 'atk',
          },
          {
            tags: [],
            attribute: 'fusion',
            damageType: 'basicAttack',
            motionValue: 0.1671,
            scalingStat: 'atk',
          },
          {
            tags: [],
            attribute: 'fusion',
            damageType: 'basicAttack',
            motionValue: 0.1671,
            scalingStat: 'atk',
          },
        ],
      },
      {
        id: 238,
        capabilityType: CapabilityType.ATTACK,
        name: 'Optimal Solution',
        originType: 'Resonance Skill',
        parentName: 'Resolution',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconMoNing/SP_IconMoNingB1.webp',
        damageInstances: [
          {
            tags: [],
            attribute: 'fusion',
            damageType: 'resonanceSkill',
            motionValue: 1.7973,
            scalingStat: 'atk',
          },
        ],
      },
    ],
    modifiers: [
      {
        id: 1060,
        capabilityType: CapabilityType.MODIFIER,
        name: 'Syntony Field',
        originType: 'Forte Circuit',
        parentName: 'Mass-Energy Equivalence',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconMoNing/SP_IconMoNingY1.webp',
        modifiedStats: [
          {
            stat: 'offTuneBuildupRate',
            tags: ['all'],
            value: 0.5,
            target: Target.TEAM,
          },
        ],
      },
      {
        id: 1061,
        capabilityType: CapabilityType.MODIFIER,
        name: 'High Syntony Field',
        originType: 'Resonance Liberation',
        parentName: 'Critical Protocol',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconMoNing/SP_IconMoNingC1.webp',
        modifiedStats: [
          {
            stat: 'defenseScalingBonus',
            tags: ['all'],
            value: 0.2,
            target: Target.TEAM,
          },
          {
            stat: 'offTuneBuildupRate',
            tags: ['all'],
            value: 0.5,
            target: Target.TEAM,
          },
        ],
      },
    ],
  },
  {
    id: 484,
    name: 'Shorekeeper',
    iconUrl:
      'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHeadCircle256/T_IconRoleHeadCircle256_28_UI.webp',
    attacks: [
      {
        id: 608,
        capabilityType: CapabilityType.ATTACK,
        name: 'Basic Attack Stage 1',
        originType: 'Normal Attack',
        parentName: 'Origin Calculus',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconNor/SP_IconNorMagic.webp',
        damageInstances: [
          {
            tags: [],
            attribute: 'spectro',
            damageType: 'basicAttack',
            motionValue: 0.3178,
            scalingStat: 'atk',
          },
        ],
      },
    ],
    modifiers: [
      {
        id: 1137,
        capabilityType: CapabilityType.MODIFIER,
        name: 'Binary Butterfly',
        originType: 'Outro Skill',
        parentName: 'Binary Butterfly',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconShouanren/SP_IconShouanrenT.webp',
        modifiedStats: [
          {
            stat: 'damageAmplification',
            tags: ['all'],
            value: 0.15,
            target: Target.TEAM,
          },
        ],
      },
    ],
  },
] satisfies Array<GetClientEntityDetailsResponse>;

export const buildRotationTimelineTeamDetails = () => {
  const attacks = TEST_ENTITY_DETAILS.flatMap((entity) =>
    entity.attacks.map((attack) => ({
      ...attack,
      entityId: entity.id,
      characterId: entity.id,
      characterName: entity.name,
      characterIconUrl: entity.iconUrl,
    })),
  );

  const buffs = TEST_ENTITY_DETAILS.flatMap((entity) =>
    entity.modifiers.map((modifier) => ({
      ...modifier,
      target: modifier.modifiedStats[0]?.target ?? Target.TEAM,
      entityId: entity.id,
      characterId: entity.id,
      characterName: entity.name,
      characterIconUrl: entity.iconUrl,
    })),
  );

  return {
    attacks,
    buffs,
    isLoading: false,
    isError: false,
  };
};
