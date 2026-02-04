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

interface EchoSubstatEditorProperties {
  substat: EchoSubstat;
  onUpdate: (updater: (draft: EchoSubstat) => void) => void;
}

export const EchoSubstatEditor = ({
  substat,
  onUpdate,
}: EchoSubstatEditorProperties) => {
  const possibleValues = ECHO_SUBSTAT_VALUES[substat.stat];

  return (
    <FormGrid>
      <Select
        value={substat.stat}
        onValueChange={(value) =>
          onUpdate((draft) => {
            const newStat = value as EchoSubstatOptionType;
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
        onValueChange={(value) =>
          onUpdate((draft) => {
            draft.value = Number.parseFloat(value) || 0;
          })
        }
      >
        <SelectTrigger size="xs" className="w-full text-right">
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
    </FormGrid>
  );
};
