import { Box, FormGrid, Row, Stack } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LabelText } from '@/components/ui/typography';
import { VALID_MAIN_STATS } from '@/schemas/echo';
import type { EchoCost as EchoCostType, EchoStats } from '@/types/client/echo';
import { EchoCost } from '@/types/client/echo';

import { STAT_LABELS } from './constants';
import { EchoSubstatEditor } from './EchoSubstatEditor';

interface EchoPieceEditorProps {
  echo: EchoStats;
  onUpdate: (updater: (draft: EchoStats) => void) => void;
}

export const EchoPieceEditor = ({ echo, onUpdate }: EchoPieceEditorProps) => {
  const mainStatOptions = VALID_MAIN_STATS[echo.cost];

  const handleCostChange = (val: string) => {
    const newCost = parseInt(val) as EchoCostType;
    onUpdate((draft) => {
      draft.cost = newCost;
      const newValidOptions = VALID_MAIN_STATS[newCost];
      if (!newValidOptions.includes(draft.mainStatType)) {
        draft.mainStatType = newValidOptions[0];
      }
    });
  };

  return (
    <Box className="bg-muted/5">
      <Stack spacing="sm">
        <FormGrid>
          <Stack spacing="xs">
            <LabelText className="px-1">Cost</LabelText>
            <Select value={String(echo.cost)} onValueChange={handleCostChange}>
              <SelectTrigger size="xs" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EchoCost).map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    Cost {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Stack>

          <Stack spacing="xs">
            <LabelText className="px-1">Main Stat</LabelText>
            <Select
              value={echo.mainStatType}
              onValueChange={(val) =>
                onUpdate((draft) => {
                  // @ts-ignore - dynamic enum cast
                  draft.mainStatType = val;
                })
              }
            >
              <SelectTrigger size="xs" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mainStatOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {STAT_LABELS[opt] || opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Stack>
        </FormGrid>

        <Stack spacing="xs">
          <Row className="justify-between px-1">
            <LabelText>Sub Stats</LabelText>
          </Row>

          <Stack spacing="xs">
            {echo.substats.map((substat, index) => (
              <EchoSubstatEditor
                key={index}
                substat={substat}
                onUpdate={(updater) =>
                  onUpdate((draft) => {
                    updater(draft.substats[index]);
                  })
                }
              />
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};
