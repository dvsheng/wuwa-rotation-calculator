import { GameImage } from '@/components/common/GameImage';
import type { FilterConfig } from '@/components/common/SelectionDialog';
import { SelectionDialog } from '@/components/common/SelectionDialog';
import { Row, Stack } from '@/components/ui/layout';
import { useEchoList } from '@/hooks/useEchoList';
import { cn } from '@/lib/utils';
import { useTeamStore } from '@/store/useTeamStore';

import { AssetIcon } from '../common/AssetIcon';

interface PrimaryEchoSelectorProps {
  index: number;
}

type EchoListItem = {
  id: string;
  name: string;
  cost: number;
  sets: Array<string>;
};

export const PrimaryEchoSelector = ({ index }: PrimaryEchoSelectorProps) => {
  const character = useTeamStore((state) => state.team[index]);
  const setPrimaryEcho = useTeamStore((state) => state.setPrimaryEcho);
  const { data: echoList = [] } = useEchoList();

  // Filter echoes by selected echo sets
  const selectedSets = character.echoSets.map((s) => s.name).filter(Boolean);
  const primaryEchoOptions = echoList.filter(
    (e) => selectedSets.length === 0 || e.sets.some((s) => selectedSets.includes(s)),
  );

  // Cost filter
  const costFilter: FilterConfig<EchoListItem> = {
    label: 'Cost',
    options: [4, 3, 1].map((c) => ({ value: c, label: `Cost ${c}` })),
    getValue: (echo) => echo.cost,
  };

  return (
    <Stack spacing="xs" className="mt-2 px-1">
      <Row className="items-center gap-2">
        <AssetIcon name="monster" className="brightness-0 dark:invert" />
        <div className="min-w-0 flex-1">
          <SelectionDialog
            items={primaryEchoOptions}
            selectedItemName={character.primarySlotEcho.name}
            onSelect={(id, name) => {
              setPrimaryEcho(index, id as string, name);
            }}
            title="Select Primary Echo"
            placeholder="Select primary echo"
            searchPlaceholder="Search echoes..."
            filters={[costFilter]}
            renderItem={(echo) => (
              <>
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <GameImage
                    entity="echo"
                    type="icon"
                    id={echo.id}
                    alt={echo.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <div className="max-w-[120px] truncate text-sm font-bold">
                    {echo.name}
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase',
                      echo.cost === 4
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : echo.cost === 3
                          ? 'bg-purple-500/10 text-purple-600'
                          : 'bg-blue-500/10 text-blue-600',
                    )}
                  >
                    Cost {echo.cost}
                  </span>
                </div>
              </>
            )}
            sortFn={(a, b) => {
              // Sort by cost descending (4 before 3 before 1)
              if (a.cost !== b.cost) {
                return b.cost - a.cost;
              }
              // Then by name
              return a.name.localeCompare(b.name);
            }}
            gridCols={{ default: 2, md: 3 }}
            triggerClassName="h-9"
          />
        </div>
      </Row>
    </Stack>
  );
};
