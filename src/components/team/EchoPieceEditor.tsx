import { Box, FormGrid, Row, Stack } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LabelText } from '@/components/ui/typography';
import { EchoCost, VALID_MAIN_STATS } from '@/schemas/echo';
import { useTeamStore } from '@/store/useTeamStore';

import { STAT_LABELS } from './constants';
import { EchoSubstatEditor } from './EchoSubstatEditor';

interface EchoPieceEditorProps {
  characterIndex: number;
  echoIndex: number;
}

export const EchoPieceEditor = ({
  characterIndex,
  echoIndex,
}: EchoPieceEditorProps) => {
  const echo = useTeamStore((state) => state.team[characterIndex].echoStats[echoIndex]);
  const updateEchoPiece = useTeamStore((state) => state.updateEchoPiece);

  const mainStatOptions = VALID_MAIN_STATS[echo.cost];

  const handleCostChange = (val: string) => {
    const newCost = parseInt(val) as EchoCost;
    updateEchoPiece(characterIndex, echoIndex, (draft) => {
      draft.cost = newCost;
      const newValidOptions = VALID_MAIN_STATS[newCost];
      if (!newValidOptions.includes(draft.mainStatType)) {
        draft.mainStatType = newValidOptions[0];
      }
    });
  };

  return (
    <Box className="bg-muted/5">
      <Row className="items-start gap-2">
        <Stack spacing="sm" className="flex-1">
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
                  updateEchoPiece(characterIndex, echoIndex, (draft) => {
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
              {echo.substats.map((substat, substatIndex) => (
                <EchoSubstatEditor
                  key={substatIndex}
                  substat={substat}
                  onUpdate={(updater) =>
                    updateEchoPiece(characterIndex, echoIndex, (draft) => {
                      updater(draft.substats[substatIndex]);
                    })
                  }
                />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Row>
    </Box>
  );
};
