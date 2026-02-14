import { GameImage } from '@/components/common/GameImage';
import type { FilterConfig } from '@/components/common/SelectionDialog';
import { SelectionDialog } from '@/components/common/SelectionDialog';
import { Row } from '@/components/ui/layout';
import { EntityType } from '@/db/schema';
import { useEntityList } from '@/hooks/useEntityList';
import { cn } from '@/lib/utils';
import type { ListEchoesResponseItem } from '@/services/game-data/list-entities.server';
import { useStore } from '@/store';

import { AssetIcon } from '../common/AssetIcon';

interface PrimaryEchoSelectorProperties {
  index: number;
}

export const PrimaryEchoSelector = ({ index }: PrimaryEchoSelectorProperties) => {
  const echo = useStore((state) => state.team[index].primarySlotEcho);
  const selectedEchoSets = useStore((state) => state.team[index].echoSets);
  const setEcho = useStore((state) => state.setPrimaryEcho);
  const { data: echoList = [] } = useEntityList({ entityType: EntityType.ECHO });

  // Filter echoes by selected echo set IDs
  const selectedSetIds = new Set(selectedEchoSets.map((set) => set.id));
  const primaryEchoOptions = echoList.filter((_echo) =>
    _echo.sets.some((set) => selectedSetIds.has(set)),
  );

  // Cost filter
  const costFilter: FilterConfig<ListEchoesResponseItem> = {
    label: 'Cost',
    options: [4, 3, 1].map((c) => ({ value: c, label: `Cost ${c}` })),
    getValue: (_echo) => _echo.cost,
  };

  return (
    <Row className="selector-row mt-2">
      <AssetIcon name="monster" className="selector-icon" />
      <div className="selector-main">
        <SelectionDialog
          items={primaryEchoOptions}
          value={echo.id}
          onValueChange={(id) => setEcho(index, id)}
          title="Select Primary Echo"
          placeholder="Select primary echo"
          searchPlaceholder="Search echoes..."
          filters={[costFilter]}
          renderItem={(_echo) => (
            <>
              <div className="relative flex h-14 w-14 items-center justify-center">
                <GameImage
                  entity="echo"
                  type="icon"
                  id={_echo.id}
                  alt={_echo.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="max-w-[120px] truncate text-sm font-bold">
                  {_echo.name}
                </div>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase',
                    _echo.cost === 4
                      ? 'bg-yellow-500/10 text-yellow-600'
                      : _echo.cost === 3
                        ? 'bg-purple-500/10 text-purple-600'
                        : 'bg-blue-500/10 text-blue-600',
                  )}
                >
                  Cost {_echo.cost}
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
      <div className="selector-secondary" />
    </Row>
  );
};
