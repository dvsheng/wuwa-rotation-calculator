import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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
import type { RefineLevel } from '@/services/game-data/types';

export interface TeamState {
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
}

const getEchoSubstatValue = (stat: EchoSubstatOptionType) =>
  ECHO_SUBSTAT_VALUES[stat][0];

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
  1304: {
    // Jinhsi
    weaponId: 21_010_025,
    echoSetId: 5,
    primaryEchoId: 6_000_059,
  },
  1209: {
    // Mornye
    weaponId: 21_010_045,
    echoSetId: 2,
    primaryEchoId: 390_080_007,
  },
  1505: {
    // Shorekeeper
    weaponId: 21_050_036,
    echoSetId: 7,
    primaryEchoId: 390_080_005,
  },
};

const createDefaultCharacter = (
  id: number,
  defaults = CHARACTER_DEFAULTS[id] ?? {
    weaponId: 21_010_025,
    echoSetId: 5,
    primaryEchoId: 6_000_059,
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
  createDefaultCharacter(1304),
  createDefaultCharacter(1209),
  createDefaultCharacter(1505),
];

const initialEnemy: Enemy = initialEnemyData;

export const useTeamStore = create<TeamState>()(
  persist(
    immer((set) => ({
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
          state.team[index].echoSets[setIndex].requirement = requirement as any;
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
    })),
    {
      name: 'wuwa-rotation-team',
      partialize: (state) => ({ team: state.team, enemy: state.enemy }),
    },
  ),
);
