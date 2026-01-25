import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { ECHO_SUBSTAT_VALUES } from '@/schemas/echo';
import { initialEnemyData } from '@/schemas/enemy';
import type { Enemy } from '@/schemas/enemy';
import type {
  Character,
  EchoCost,
  EchoStats,
  EchoSubstatOptionType,
  Team,
} from '@/types/client';
import { EchoMainStatOption, EchoSubstatOption } from '@/types/client';

export interface TeamState {
  team: Team;
  enemy: Enemy;
  updateCharacter: (index: number, updater: (draft: Character) => void) => void;
  setCharacter: (index: number, id: string, name: string) => void;
  setSequence: (index: number, sequence: number) => void;
  setWeapon: (index: number, id: string, name: string) => void;
  setRefine: (index: number, refine: number) => void;
  setEchoSet: (index: number, setIndex: number, id: string, name: string) => void;
  setEchoSetRequirement: (index: number, setIndex: number, requirement: string) => void;
  setPrimaryEcho: (index: number, id: string, name: string) => void;
  updateEnemy: (updater: (draft: Enemy) => void) => void;
}

const createDefaultEchoStats = (cost: EchoCost): EchoStats => {
  const mainStatType =
    cost === 4 ? EchoMainStatOption.CRIT_DMG : EchoMainStatOption.ATK_PERCENT;

  const getVal = (stat: EchoSubstatOptionType) => ECHO_SUBSTAT_VALUES[stat][0];

  return {
    cost,
    mainStatType,
    substats: [
      {
        stat: EchoSubstatOption.HP_PERCENT,
        value: getVal(EchoSubstatOption.HP_PERCENT),
      },
      {
        stat: EchoSubstatOption.ATK_PERCENT,
        value: getVal(EchoSubstatOption.ATK_PERCENT),
      },
      {
        stat: EchoSubstatOption.DEF_PERCENT,
        value: getVal(EchoSubstatOption.DEF_PERCENT),
      },
      {
        stat: EchoSubstatOption.CRIT_RATE,
        value: getVal(EchoSubstatOption.CRIT_RATE),
      },
      {
        stat: EchoSubstatOption.CRIT_DMG,
        value: getVal(EchoSubstatOption.CRIT_DMG),
      },
    ],
  };
};

const CHARACTER_DEFAULTS: Record<
  string,
  | {
      weapon: [string, string];
      echoSet: [string, string];
      primaryEcho: [string, string];
    }
  | undefined
> = {
  '1304': {
    // Jinhsi
    weapon: ['21010026', 'Ages of Harvest'],
    echoSet: ['5', 'Celestial Light'],
    primaryEcho: ['6000059', 'Jué'],
  },
  '1209': {
    // Mornye
    weapon: ['21010045', 'Radiance Cleaver'],
    echoSet: ['2', 'Molten Rift'],
    primaryEcho: ['390080007', 'Inferno Rider'],
  },
  '1505': {
    // Shorekeeper
    weapon: ['21050036', 'Stellar Symphony'],
    echoSet: ['7', 'Rejuvenating Glow'],
    primaryEcho: ['390080005', 'Bell-Borne Geochelone'],
  },
};

const createDefaultCharacter = (
  id: string,
  name: string,
  defaults = CHARACTER_DEFAULTS[id] ?? {
    weapon: ['', ''],
    echoSet: ['', ''],
    primaryEcho: ['', ''],
  },
): Character => ({
  id,
  name,
  sequence: 0,
  weapon: { id: defaults.weapon[0], name: defaults.weapon[1], refine: 1 },
  echoSets: [{ id: defaults.echoSet[0], name: defaults.echoSet[1], requirement: '5' }],
  primarySlotEcho: { id: defaults.primaryEcho[0], name: defaults.primaryEcho[1] },
  echoStats: [
    createDefaultEchoStats(4),
    createDefaultEchoStats(3),
    createDefaultEchoStats(3),
    createDefaultEchoStats(1),
    createDefaultEchoStats(1),
  ],
});

const initialTeam: Team = [
  createDefaultCharacter('1304', 'Jinhsi'),
  createDefaultCharacter('1209', 'Mornye'),
  createDefaultCharacter('1505', 'Shorekeeper'),
];

const initialEnemy: Enemy = initialEnemyData;

export const useTeamStore = create<TeamState>()(
  immer((set) => ({
    team: initialTeam,
    enemy: initialEnemy,
    updateCharacter: (index, updater) =>
      set((state) => {
        updater(state.team[index]);
      }),
    setCharacter: (index, id, name) =>
      set((state) => {
        state.team[index] = createDefaultCharacter(id, name);
      }),
    setSequence: (index, sequence) =>
      set((state) => {
        state.team[index].sequence = sequence;
      }),
    setWeapon: (index, id, name) =>
      set((state) => {
        state.team[index].weapon = { ...state.team[index].weapon, id, name };
      }),
    setRefine: (index, refine) =>
      set((state) => {
        state.team[index].weapon.refine = refine;
      }),
    setEchoSet: (index, setIndex, id, name) =>
      set((state) => {
        state.team[index].echoSets[setIndex] = {
          ...state.team[index].echoSets[setIndex],
          id,
          name,
        };
      }),
    setEchoSetRequirement: (index, setIndex, requirement) =>
      set((state) => {
        state.team[index].echoSets[setIndex].requirement = requirement as any;
      }),
    setPrimaryEcho: (index, id, name) =>
      set((state) => {
        state.team[index].primarySlotEcho = { id, name };
      }),
    updateEnemy: (updater) =>
      set((state) => {
        updater(state.enemy);
      }),
  })),
);
