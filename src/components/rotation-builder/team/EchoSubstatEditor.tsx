import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { EchoSubstat, EchoSubstatOptionType } from '@/schemas/echo';
import { ECHO_SUBSTAT_VALUES } from '@/schemas/echo';

import { STAT_LABELS, SUBSTAT_OPTIONS } from './constants';

interface EchoSubstatEditorProperties {
  substat: EchoSubstat;
  usedStats: Array<EchoSubstatOptionType>;
  onUpdate: (updater: (draft: EchoSubstat) => void) => void;
}

const RARITY_VALUE_TEXT_CLASSES: Record<number, string> = {
  1: 'text-rarity-1-strong',
  2: 'text-rarity-2-strong',
  3: 'text-rarity-3-strong',
  4: 'text-rarity-4-strong',
  5: 'text-rarity-5-strong',
};

const getValueRarityTier = (index: number, totalValues: number): number => {
  if (index < 0 || totalValues <= 0) return 1;
  if (totalValues === 1) return 5;

  // Use up to 5 rarity tiers while preserving relative order across the list.
  const tierWindowSize = Math.min(totalValues, 5);
  const startTier = 6 - tierWindowSize;
  const relativePosition = index / (totalValues - 1);
  const tierOffset = Math.round(relativePosition * (tierWindowSize - 1));

  return startTier + tierOffset;
};

const getValueRarityClass = (index: number, totalValues: number): string =>
  RARITY_VALUE_TEXT_CLASSES[getValueRarityTier(index, totalValues)] ??
  RARITY_VALUE_TEXT_CLASSES[1];

export const EchoSubstatEditor = ({
  substat,
  usedStats,
  onUpdate,
}: EchoSubstatEditorProperties) => {
  const possibleValues = ECHO_SUBSTAT_VALUES[substat.stat];
  const selectedValueIndex = possibleValues.indexOf(substat.value);
  const availableOptions = SUBSTAT_OPTIONS.filter(
    (opt) => opt === substat.stat || !usedStats.includes(opt),
  );

  return (
    <TableRow>
      <TableCell className="p-0">
        <Select
          value={substat.stat}
          onValueChange={(value) =>
            onUpdate((draft) => {
              const newStat = value as EchoSubstatOptionType;
              draft.stat = newStat;
              const newValues = ECHO_SUBSTAT_VALUES[newStat];
              draft.value = newValues.length === 4 ? newValues[2] : newValues[3];
            })
          }
        >
          <SelectTrigger size="sm" className="w-full border-transparent shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {STAT_LABELS[opt] || opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="flex-1 p-0">
        <Select
          value={String(substat.value)}
          onValueChange={(value) =>
            onUpdate((draft) => {
              draft.value = Number.parseFloat(value) || 0;
            })
          }
        >
          <SelectTrigger
            size="sm"
            className="w-full border-transparent text-right shadow-none focus-visible:ring-0"
          >
            <SelectValue
              className={cn(
                'font-medium',
                getValueRarityClass(selectedValueIndex, possibleValues.length),
              )}
            />
          </SelectTrigger>
          <SelectContent>
            {possibleValues.map((value, index) => (
              <SelectItem
                key={value}
                value={String(value)}
                className={cn(
                  'font-medium',
                  getValueRarityClass(index, possibleValues.length),
                )}
              >
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
};
