import type { OriginType } from '@/services/game-data/types';

import type { EntityResource } from '../create-entity-resource-lister';
import type {
  EchoSetEffect,
  ResonatorChain,
  ResonatorSkill,
  SkillAttribute,
  WeaponEffect,
} from '../repostiory';

export interface EntitySkillData {
  gameId: number;
  name: string;
  description: string;
  descriptionParameters?: Array<string>;
  iconUrl: string;
  originType: OriginType;
  damageIds: Array<number>;
  buffIds: Array<number>;
  skillAttributes?: Array<SkillAttribute>;
}

export type EntitySkillRepositoryRow =
  | ResonatorSkill
  | ResonatorChain
  | WeaponEffect
  | EchoSetEffect;

export type EntitySkill = EntityResource<EntitySkillData, EntitySkillRepositoryRow>;
