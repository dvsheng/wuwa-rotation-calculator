import { FormGrid } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EchoSubstat, EchoSubstatOptionType } from '@/schemas/echo';
import { ECHO_SUBSTAT_VALUES } from '@/schemas/echo';

import { STAT_LABELS, SUBSTAT_OPTIONS } from './constants';

interface EchoSubstatEditorProps {
  substat: EchoSubstat;
  onUpdate: (updater: (draft: EchoSubstat) => void) => void;
}

export const EchoSubstatEditor = ({ substat, onUpdate }: EchoSubstatEditorProps) => {
  const possibleValues = ECHO_SUBSTAT_VALUES[substat.stat];

  return (
    <FormGrid>
      <Select
        value={substat.stat}
        onValueChange={(val) =>
          onUpdate((draft) => {
            const newStat = val as EchoSubstatOptionType;
            draft.stat = newStat;
            const newValues = ECHO_SUBSTAT_VALUES[newStat];
            draft.value = newValues[0];
          })
        }
      >
        <SelectTrigger size="xs" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUBSTAT_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {STAT_LABELS[opt] || opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(substat.value)}
        onValueChange={(val) =>
          onUpdate((draft) => {
            draft.value = parseFloat(val) || 0;
          })
        }
      >
        <SelectTrigger size="xs" className="w-full text-right">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {possibleValues.map((val) => (
            <SelectItem key={val} value={String(val)}>
              {val}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormGrid>
  );
};
