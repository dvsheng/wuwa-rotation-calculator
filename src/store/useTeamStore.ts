import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { ECHO_SUBSTAT_VALUES } from '@/schemas/echo';
import { initialEnemyData } from '@/schemas/enemy';
import type { Enemy } from '@/schemas/enemy';
import type {
  Character,
  EchoCost,
  EchoPiece,
  EchoSubstatOptionType,
  Team,
} from '@/types/client';
import { EchoMainStatOption, EchoSubstatOption } from '@/types/client';

export interface TeamState {
  team: Team;
  enemy: Enemy;
  updateCharacter: (index: number, updater: (draft: Character) => void) => void;
  setCharacter: (index: number, id: string) => void;
  setSequence: (index: number, sequence: number) => void;
  setWeapon: (index: number, id: string) => void;
  setRefine: (index: number, refine: number) => void;
  setEchoSet: (index: number, setIndex: number, id: string) => void;
  setEchoSetRequirement: (index: number, setIndex: number, requirement: string) => void;
  setPrimaryEcho: (index: number, id: string) => void;
  updateEchoPiece: (
    characterIndex: number,
    echoIndex: number,
    updater: (draft: EchoPiece) => void,
  ) => void;
  updateEnemy: (updater: (draft: Enemy) => void) => void;
}

const createDefaultEchoStats = (cost: EchoCost): EchoPiece => {
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
      weaponId: string;
      echoSetId: string;
      primaryEchoId: string;
    }
  | undefined
> = {
  '1304': {
    // Jinhsi
    weaponId: '21010026',
    echoSetId: '5',
    primaryEchoId: '6000059',
  },
  '1209': {
    // Mornye
    weaponId: '21010045',
    echoSetId: '2',
    primaryEchoId: '390080007',
  },
  '1505': {
    // Shorekeeper
    weaponId: '21050036',
    echoSetId: '7',
    primaryEchoId: '390080005',
  },
};

const createDefaultCharacter = (
  id: string,
  defaults = CHARACTER_DEFAULTS[id] ?? {
    weaponId: '',
    echoSetId: '',
    primaryEchoId: '',
  },
): Character => ({
  id,
  sequence: 0,
  weapon: { id: defaults.weaponId, refine: 1 },
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
  createDefaultCharacter('1304'),
  createDefaultCharacter('1209'),
  createDefaultCharacter('1505'),
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
    setCharacter: (index, id) =>
      set((state) => {
        state.team[index] = createDefaultCharacter(id);
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
        state.team[index].weapon.refine = refine;
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
);
