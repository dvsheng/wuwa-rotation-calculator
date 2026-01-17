import { Waves } from 'lucide-react';

import { SearchableSelect } from '@/components/common/SearchableSelect';
import { Row, Stack } from '@/components/ui/layout';
import { LabelText } from '@/components/ui/typography';
import { useEchoList } from '@/hooks/useEchoList';
import { useTeamStore } from '@/store/useTeamStore';

interface PrimaryEchoSelectorProps {
  index: number;
}

export const PrimaryEchoSelector = ({ index }: PrimaryEchoSelectorProps) => {
  const character = useTeamStore((state) => state.team[index]);
  const setPrimaryEcho = useTeamStore((state) => state.setPrimaryEcho);
  const { data: echoList = [] } = useEchoList();

  const selectedSets = character.echoSets.map((s) => s.name).filter(Boolean);
  const primaryEchoOptions = echoList.filter(
    (e) => selectedSets.length === 0 || e.sets.some((s) => selectedSets.includes(s)),
  );

  return (
    <Stack spacing="xs" className="mt-2 px-1">
      <Row className="gap-2">
        <Waves className="text-muted-foreground h-4 w-4 shrink-0" />
        <LabelText>Primary Echo</LabelText>
      </Row>
      <div className="pl-6">
        <SearchableSelect
          options={primaryEchoOptions}
          value={character.primarySlotEcho.name}
          onChange={(val) => {
            const echo = primaryEchoOptions.find((e) => e.name === val);
            if (echo) setPrimaryEcho(index, echo.id, echo.name);
          }}
          placeholder="Select primary echo"
        />
      </div>
    </Stack>
  );
};
