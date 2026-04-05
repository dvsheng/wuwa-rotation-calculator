import { EntityType } from '../game-data/types';

import type { Echo, EchoSet, Resonator, Weapon } from './repostiory';
import {
  echoes as echoRepository,
  echoSets as echoSetRepository,
  resonators,
  weapons as weaponRepository,
} from './repostiory';

export interface Entity {
  id: number;
  name: string;
  type: EntityType;
  description: string;
  iconPath: string;
  metadata: {
    rarity?: number;
    weaponType?: number;
    echoSets?: Array<number>;
    attribute?: number;
    cost?: number;
  };
}

export const listEntitiesHandler = async (): Promise<Array<Entity>> => {
  const [characters, echoes, echoSets, weapons] = await Promise.all([
    resonators.list(),
    echoRepository.list(),
    echoSetRepository.list(),
    weaponRepository.list(),
  ]);

  return [
    ...characters.filter((c) => isValidRole(c)).map((c) => transformRoleToEntity(c)),
    ...echoes
      .filter((echo) => isValidPhantomItem(echo))
      .map((echo) => transformPhantomItemToEntity(echo)),
    ...echoSets.map((set) => transformPhantomFetterGroupToEntity(set)),
    ...weapons.map((weap) => transformWeaponConfigToEntity(weap)),
  ];
};

const transformRoleToEntity = (role: Resonator): Entity => {
  return {
    id: role.id,
    name: role.name,
    type: EntityType.CHARACTER,
    description: role.introduction,
    iconPath: role.roleHeadIconCircle,
    metadata: {
      rarity: role.qualityId,
      attribute: role.elementId,
      weaponType: role.weaponType,
    },
  };
};

const isValidRole = (role: Resonator) => {
  return role.roleType === 1;
};

const transformPhantomItemToEntity = (item: Echo): Entity => {
  return {
    id: item.itemId,
    name: item.monsterName,
    type: EntityType.ECHO,
    description: '',
    iconPath: item.icon,
    metadata: {
      cost: item.rarity,
      echoSets: item.fetterGroup,
    },
  };
};

const isValidPhantomItem = (item: Echo) => {
  return item.qualityId === 5 && item.phantomType === 1 && item.parentMonsterId === 0;
};

const transformPhantomFetterGroupToEntity = (group: EchoSet): Entity => {
  return {
    id: group.id,
    name: group.fetterGroupName,
    type: EntityType.ECHO_SET,
    description: group.fetterGroupDesc,
    iconPath: group.fetterElementPath,
    metadata: {},
  };
};

const transformWeaponConfigToEntity = (config: Weapon): Entity => {
  return {
    id: config.itemId,
    name: config.weaponName,
    type: EntityType.WEAPON,
    description: config.bgDescription,
    iconPath: config.icon,
    metadata: {
      rarity: config.qualityId,
      weaponType: config.weaponType,
    },
  };
};
