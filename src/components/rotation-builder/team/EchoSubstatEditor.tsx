import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import type { EchoSubstat, EchoSubstatOptionType } from '@/schemas/echo';
import { ECHO_SUBSTAT_VALUES } from '@/schemas/echo';

import { STAT_LABELS, SUBSTAT_OPTIONS } from './constants';

interface EchoSubstatEditorProperties {
  substat: EchoSubstat;
  usedStats: Array<EchoSubstatOptionType>;
  onUpdate: (updater: (draft: EchoSubstat) => void) => void;
}

export const EchoSubstatEditor = ({
  substat,
  usedStats,
  onUpdate,
}: EchoSubstatEditorProperties) => {
  const possibleValues = ECHO_SUBSTAT_VALUES[substat.stat];
  const availableOptions = SUBSTAT_OPTIONS.filter(
    (opt) => opt === substat.stat || !usedStats.includes(opt),
  );

  return (
    <TableRow>
      <TableCell className="p-1">
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
          <SelectTrigger
            size="sm"
            className="w-full border-transparent shadow-none focus-visible:ring-0"
          >
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
      <TableCell className="p-1">
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
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {possibleValues.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
};
