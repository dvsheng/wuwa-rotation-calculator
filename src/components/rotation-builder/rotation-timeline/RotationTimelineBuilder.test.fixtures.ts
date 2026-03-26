import type { UseTeamDetailsResult } from '@/hooks/useTeamDetails';
import { CapabilityType, Target } from '@/services/game-data';

const TEST_ENTITY_DETAILS = [
  {
    id: 463,
    name: 'Mornye',
    iconUrl:
      'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHeadCircle256/T_IconRoleHeadCircle256_61_UI.webp',
    capabilities: [
      {
        id: 227,
        entityId: 463,
        skillId: 1,
        characterId: 463,
        characterName: 'Mornye',
        characterIconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHeadCircle256/T_IconRoleHeadCircle256_61_UI.webp',
        name: 'Basic Attack Stage 1',
        originType: 'Normal Attack',
        parentName: 'Ground State Calibration',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconNor/SP_IconNorSword.webp',
        parameters: [],
        capabilityJson: {
          type: CapabilityType.ATTACK,
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
      },
      {
        id: 238,
        entityId: 463,
        skillId: 2,
        characterId: 463,
        characterName: 'Mornye',
        characterIconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHeadCircle256/T_IconRoleHeadCircle256_61_UI.webp',
        name: 'Optimal Solution',
        originType: 'Resonance Skill',
        parentName: 'Resolution',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconMoNing/SP_IconMoNingB1.webp',
        parameters: [],
        capabilityJson: {
          type: CapabilityType.ATTACK,
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
      },
      {
        id: 1060,
        entityId: 463,
        skillId: 3,
        characterId: 463,
        characterName: 'Mornye',
        characterIconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHeadCircle256/T_IconRoleHeadCircle256_61_UI.webp',
        name: 'Syntony Field',
        originType: 'Forte Circuit',
        parentName: 'Mass-Energy Equivalence',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconMoNing/SP_IconMoNingY1.webp',
        parameters: [],
        capabilityJson: {
          type: CapabilityType.MODIFIER,
          modifiedStats: [
            {
              stat: 'offTuneBuildupRate',
              tags: ['all'],
              value: 0.5,
              target: Target.TEAM,
            },
          ],
        },
      },
      {
        id: 1061,
        entityId: 463,
        skillId: 4,
        characterId: 463,
        characterName: 'Mornye',
        characterIconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHeadCircle256/T_IconRoleHeadCircle256_61_UI.webp',
        name: 'High Syntony Field',
        originType: 'Resonance Liberation',
        parentName: 'Critical Protocol',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconMoNing/SP_IconMoNingC1.webp',
        parameters: [],
        capabilityJson: {
          type: CapabilityType.MODIFIER,
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
      },
    ],
  },
  {
    id: 484,
    name: 'Shorekeeper',
    iconUrl:
      'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHeadCircle256/T_IconRoleHeadCircle256_28_UI.webp',
    capabilities: [
      {
        id: 608,
        entityId: 484,
        skillId: 5,
        characterId: 484,
        characterName: 'Shorekeeper',
        characterIconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHeadCircle256/T_IconRoleHeadCircle256_28_UI.webp',
        name: 'Basic Attack Stage 1',
        originType: 'Normal Attack',
        parentName: 'Origin Calculus',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconNor/SP_IconNorMagic.webp',
        parameters: [],
        capabilityJson: {
          type: CapabilityType.ATTACK,
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
      },
      {
        id: 1137,
        entityId: 484,
        skillId: 6,
        characterId: 484,
        characterName: 'Shorekeeper',
        characterIconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHeadCircle256/T_IconRoleHeadCircle256_28_UI.webp',
        name: 'Binary Butterfly',
        originType: 'Outro Skill',
        parentName: 'Binary Butterfly',
        iconUrl:
          'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Atlas/SkillIcon/SkillIconShouanren/SP_IconShouanrenT.webp',
        parameters: [],
        capabilityJson: {
          type: CapabilityType.MODIFIER,
          modifiedStats: [
            {
              stat: 'damageAmplification',
              tags: ['all'],
              value: 0.15,
              target: Target.TEAM,
            },
          ],
        },
      },
    ],
  },
];

export const buildRotationTimelineTeamDetails = (): UseTeamDetailsResult => ({
  capabilities: TEST_ENTITY_DETAILS.flatMap(
    (entity) => entity.capabilities,
  ) as UseTeamDetailsResult['capabilities'],
  isLoading: false,
  isError: false,
});
