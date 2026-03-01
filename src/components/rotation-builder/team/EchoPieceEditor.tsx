import { Box } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { EchoCost, VALID_MAIN_STATS } from '@/schemas/echo';
import { useStore } from '@/store';

import { STAT_LABELS } from './constants';
import { EchoSubstatEditor } from './EchoSubstatEditor';

interface EchoPieceEditorProperties {
  characterIndex: number;
  echoIndex: number;
}

export const EchoPieceEditor = ({
  characterIndex,
  echoIndex,
}: EchoPieceEditorProperties) => {
  const echo = useStore((state) => state.team[characterIndex].echoStats[echoIndex]);
  const updateEchoPiece = useStore((state) => state.updateEchoPiece);

  const mainStatOptions = VALID_MAIN_STATS[echo.cost];

  const handleCostChange = (value: string) => {
    const newCost = Number.parseInt(value) as EchoCost;
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
      <Table>
        <TableBody>
          <TableRow>
            <TableHead>Cost</TableHead>
            <TableCell className="p-1">
              <Select value={String(echo.cost)} onValueChange={handleCostChange}>
                <SelectTrigger
                  size="sm"
                  className="w-full border-transparent shadow-none focus-visible:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EchoCost).map((c) => (
                    <SelectItem key={c} value={String(c)}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>

          <TableRow>
            <TableHead>Main Stat</TableHead>
            <TableCell className="p-1">
              <Select
                value={echo.mainStatType}
                onValueChange={(value) =>
                  updateEchoPiece(characterIndex, echoIndex, (draft) => {
                    // @ts-ignore - dynamic enum cast
                    draft.mainStatType = value;
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
                  {mainStatOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {STAT_LABELS[opt] || opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>

          <TableRow className="border-t-2">
            <TableHead>Substats</TableHead>
            <TableHead className="w-24">Value</TableHead>
          </TableRow>

          {echo.substats.map((substat, substatIndex) => (
            <EchoSubstatEditor
              key={substatIndex}
              substat={substat}
              usedStats={echo.substats
                .filter((_, index) => index !== substatIndex)
                .map((s) => s.stat)}
              onUpdate={(updater) =>
                updateEchoPiece(characterIndex, echoIndex, (draft) => {
                  updater(draft.substats[substatIndex]);
                })
              }
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
