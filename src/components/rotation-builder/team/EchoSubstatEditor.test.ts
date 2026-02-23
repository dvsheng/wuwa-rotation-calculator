import { describe, expect, it } from 'vitest';

import { ECHO_SUBSTAT_VALUES, EchoSubstatOption } from '@/schemas/echo';

import { SUBSTAT_OPTIONS } from './constants';

// --- Default value selection ---
// Logic: newValues.length === 4 ? newValues[2] : newValues[3]
const defaultValueFor = (stat: keyof typeof ECHO_SUBSTAT_VALUES): number => {
  const values = ECHO_SUBSTAT_VALUES[stat];
  return values.length === 4 ? values[2] : values[3];
};

// --- Available options filtering ---
// Logic: SUBSTAT_OPTIONS.filter((opt) => opt === currentStat || !usedStats.includes(opt))
const availableOptionsFor = (
  currentStat: string,
  usedStats: Array<string>,
): Array<string> =>
  SUBSTAT_OPTIONS.filter((opt) => opt === currentStat || !usedStats.includes(opt));

describe('EchoSubstatEditor', () => {
  describe('default value selection on stat change', () => {
    it('uses the 3rd value (index 2) for stats with exactly 4 possible values', () => {
      // ATK_FLAT and DEF_FLAT are the only stats with 4 values
      expect(ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_FLAT]).toHaveLength(4);
      expect(defaultValueFor(EchoSubstatOption.ATK_FLAT)).toBe(
        ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_FLAT][2],
      );

      expect(ECHO_SUBSTAT_VALUES[EchoSubstatOption.DEF_FLAT]).toHaveLength(4);
      expect(defaultValueFor(EchoSubstatOption.DEF_FLAT)).toBe(
        ECHO_SUBSTAT_VALUES[EchoSubstatOption.DEF_FLAT][2],
      );
    });

    it('uses the 4th value (index 3) for stats with more than 4 possible values', () => {
      const statsWithMoreThanFour = Object.values(EchoSubstatOption).filter(
        (stat) => ECHO_SUBSTAT_VALUES[stat].length > 4,
      );

      expect(statsWithMoreThanFour.length).toBeGreaterThan(0);

      for (const stat of statsWithMoreThanFour) {
        expect(defaultValueFor(stat)).toBe(ECHO_SUBSTAT_VALUES[stat][3]);
      }
    });

    it('default value is always a valid value for the stat', () => {
      for (const stat of Object.values(EchoSubstatOption)) {
        const defaultValue = defaultValueFor(stat);
        expect(ECHO_SUBSTAT_VALUES[stat]).toContain(defaultValue);
      }
    });
  });

  describe('available options uniqueness filtering', () => {
    it('excludes stats already used by sibling slots', () => {
      const usedStats = [EchoSubstatOption.ATK_PERCENT, EchoSubstatOption.CRIT_RATE];
      const options = availableOptionsFor(EchoSubstatOption.HP_PERCENT, usedStats);

      expect(options).not.toContain(EchoSubstatOption.ATK_PERCENT);
      expect(options).not.toContain(EchoSubstatOption.CRIT_RATE);
    });

    it("always includes the slot's own current stat even if it appears in usedStats", () => {
      // This guards against the current slot being filtered out of its own dropdown
      const currentStat = EchoSubstatOption.CRIT_DMG;
      const usedStats = [EchoSubstatOption.CRIT_DMG, EchoSubstatOption.ATK_PERCENT];
      const options = availableOptionsFor(currentStat, usedStats);

      expect(options).toContain(EchoSubstatOption.CRIT_DMG);
    });

    it('includes all options when no stats are used by siblings', () => {
      const options = availableOptionsFor(EchoSubstatOption.HP_PERCENT, []);

      expect(options).toEqual(SUBSTAT_OPTIONS);
    });

    it('shows only one option when all other stats are used by siblings', () => {
      const currentStat = EchoSubstatOption.HP_PERCENT;
      const usedStats = SUBSTAT_OPTIONS.filter((opt) => opt !== currentStat);
      const options = availableOptionsFor(currentStat, usedStats);

      expect(options).toEqual([currentStat]);
    });
  });
});
