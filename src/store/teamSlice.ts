import type { StateCreator } from 'zustand';

import type { Character } from '@/schemas/character';
import type { EchoCost, EchoPiece, EchoSubstatOptionType } from '@/schemas/echo';
import {
  ECHO_SUBSTAT_VALUES,
  EchoMainStatOption,
  EchoSubstatOption,
} from '@/schemas/echo';
import { initialEnemyData } from '@/schemas/enemy';
import type { Enemy } from '@/schemas/enemy';
import type { Team } from '@/schemas/team';
import type { RefineLevel } from '@/services/game-data';

import type { RotationBuilderUiSlice } from './rotationBuilderUiSlice';
import type { RotationSlice } from './rotationSlice';

export interface TeamSlice {
  team: Team;
  enemy: Enemy;
  updateCharacter: (index: number, updater: (draft: Character) => void) => void;
  setCharacter: (index: number, id: number) => void;
  setSequence: (index: number, sequence: number) => void;
  setWeapon: (index: number, id: number) => void;
  setRefine: (index: number, refine: string) => void;
  setEchoSet: (index: number, setIndex: number, id: number) => void;
  setEchoSetRequirement: (index: number, setIndex: number, requirement: string) => void;
  setPrimaryEcho: (index: number, id: number) => void;
  updateEchoPiece: (
    characterIndex: number,
    echoIndex: number,
    updater: (draft: EchoPiece) => void,
  ) => void;
  updateEnemy: (updater: (draft: Enemy) => void) => void;
  setTeam: (team: Team) => void;
  setEnemy: (enemy: Enemy) => void;
}

const getEchoSubstatValue = (stat: EchoSubstatOptionType) =>
  ECHO_SUBSTAT_VALUES[stat][3];

const createDefaultEchoStats = (cost: EchoCost): EchoPiece => {
  const mainStatType =
    cost === 4 ? EchoMainStatOption.CRIT_DMG : EchoMainStatOption.ATK_PERCENT;

  return {
    cost,
    mainStatType,
    substats: [
      {
        stat: EchoSubstatOption.HP_PERCENT,
        value: getEchoSubstatValue(EchoSubstatOption.HP_PERCENT),
      },
      {
        stat: EchoSubstatOption.ATK_PERCENT,
        value: getEchoSubstatValue(EchoSubstatOption.ATK_PERCENT),
      },
      {
        stat: EchoSubstatOption.DEF_PERCENT,
        value: getEchoSubstatValue(EchoSubstatOption.DEF_PERCENT),
      },
      {
        stat: EchoSubstatOption.CRIT_RATE,
        value: getEchoSubstatValue(EchoSubstatOption.CRIT_RATE),
      },
      {
        stat: EchoSubstatOption.CRIT_DMG,
        value: getEchoSubstatValue(EchoSubstatOption.CRIT_DMG),
      },
    ],
  };
};

const CHARACTER_DEFAULTS: Record<
  number,
  | {
      weaponId: number;
      echoSetId: number;
      primaryEchoId: number;
    }
  | undefined
> = {
  468: {
    // Jinhsi
    weaponId: 504,
    echoSetId: 791,
    primaryEchoId: 667,
  },
  463: {
    // Mornye
    weaponId: 509,
    echoSetId: 778,
    primaryEchoId: 645,
  },
  484: {
    // Shorekeeper
    weaponId: 596,
    echoSetId: 793,
    primaryEchoId: 644,
  },
} as const;

const createDefaultCharacter = (
  id: number = 468,
  defaults = CHARACTER_DEFAULTS[id] as {
    weaponId: number;
    echoSetId: number;
    primaryEchoId: number;
  },
): Character => ({
  id,
  sequence: 0,
  weapon: { id: defaults.weaponId, refine: '1' },
  echoSets: [{ id: defaults.echoSetId, requirement: '5' }],
  primarySlotEcho: { id: defaults.primaryEchoId },
  echoStats: [
    createDefaultEchoStats(4),
    createDefaultEchoStats(3),
    createDefaultEchoStats(3),
    createDefaultEchoStats(1),
    createDefaultEchoStats(1),
  ],
});

const initialTeam: Team = [
  createDefaultCharacter(468),
  createDefaultCharacter(463),
  createDefaultCharacter(484),
];

const initialEnemy: Enemy = initialEnemyData;

export const createTeamSlice: StateCreator<
  TeamSlice & RotationBuilderUiSlice & RotationSlice,
  [['zustand/immer', never], ['zustand/persist', unknown]],
  [],
  TeamSlice
> = (set) => ({
  team: initialTeam,
  enemy: initialEnemy,
  updateCharacter: (index, updater) =>
    set((state) => {
      updater(state.team[index]);
    }),
  setCharacter: (index, id) =>
    set((state) => {
      state.team[index].id = id;
    }),
  setSequence: (index, sequence) =>
    set((state) => {
      state.team[index].sequence = sequence;
    }),
  setWeapon: (index, id) =>
    set((state) => {
      state.team[index].weapon = { ...state.team[index].weapon, id };
    }),
  setRefine: (index, refine) =>
    set((state) => {
      state.team[index].weapon.refine = refine as RefineLevel;
    }),
  setEchoSet: (index, setIndex, id) =>
    set((state) => {
      state.team[index].echoSets[setIndex] = {
        ...state.team[index].echoSets[setIndex],
        id,
      };
    }),
  setEchoSetRequirement: (index, setIndex, requirement) =>
    set((state) => {
      state.team[index].echoSets[setIndex].requirement = requirement as '2' | '3' | '5';
    }),
  setPrimaryEcho: (index, id) =>
    set((state) => {
      state.team[index].primarySlotEcho = { id };
    }),
  updateEchoPiece: (characterIndex, echoIndex, updater) =>
    set((state) => {
      updater(state.team[characterIndex].echoStats[echoIndex]);
    }),
  updateEnemy: (updater) =>
    set((state) => {
      updater(state.enemy);
    }),
  setTeam: (team) =>
    set((state) => {
      state.team = team;
    }),
  setEnemy: (enemy) =>
    set((state) => {
      state.enemy = enemy;
    }),
});
