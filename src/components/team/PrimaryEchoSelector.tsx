import { SearchableSelect } from '@/components/common/SearchableSelect';
import { Row, Stack } from '@/components/ui/layout';
import { useEchoList } from '@/hooks/useEchoList';
import { useTeamStore } from '@/store/useTeamStore';

import { AssetIcon } from '../common/AssetIcon';

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
      <Row className="items-center gap-2">
        <AssetIcon name="monster" className="brightness-0 dark:invert" />
        <div className="min-w-0 flex-1">
          <SearchableSelect
            options={primaryEchoOptions}
            value={character.primarySlotEcho.name}
            onChange={(val) => {
              const echo = primaryEchoOptions.find((e) => e.name === val);
              if (echo) setPrimaryEcho(index, echo.id, echo.name);
            }}
            placeholder="Select primary echo"
            groupBy="cost"
            groupOrder="desc"
          />
        </div>
      </Row>
    </Stack>
  );
};
