import { AssetIcon } from '@/components/common/AssetIcon';
import { GameImage } from '@/components/common/GameImage';
import type { FilterConfig } from '@/components/common/SelectionDialog';
import { SelectionDialog } from '@/components/common/SelectionDialog';
import { Row } from '@/components/ui/layout';
import { useEntityList } from '@/hooks/useEntityList';
import { cn } from '@/lib/utils';
import { EntityType } from '@/services/game-data';
import type { ListEchoesResponseItem } from '@/services/game-data';
import { useStore } from '@/store';

interface PrimaryEchoSelectorProperties {
  index: number;
}

export const PrimaryEchoSelector = ({ index }: PrimaryEchoSelectorProperties) => {
  const echo = useStore((state) => state.team[index].primarySlotEcho);
  const selectedEchoSets = useStore((state) => state.team[index].echoSets);
  const setEcho = useStore((state) => state.setPrimaryEcho);
  const clearForEntity = useStore((state) => state.clearForEntity);
  const { data: echoList = [] } = useEntityList({ entityType: EntityType.ECHO });
  const { data: echoSetList = [] } = useEntityList({ entityType: EntityType.ECHO_SET });

  // Filter echoes by selected echo set IDs
  const selectedSetIds = new Set(
    selectedEchoSets.map((set) => echoSetList.find((s) => s.id === set.id)?.gameId),
  );
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
    <Row className="selector-row">
      <AssetIcon name="monster" className="selector-icon" />
      <div className="selector-main">
        <SelectionDialog
          items={primaryEchoOptions}
          value={echo.id}
          onValueChange={(id) => {
            if (id !== echo.id) clearForEntity(echo.id);
            setEcho(index, id);
          }}
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
                <div className="wrap-2 max-w-30 text-sm">{_echo.name}</div>
                <span
                  className={cn(
                    'px-compact py-tight rounded-full text-xs uppercase',
                    _echo.cost === 4
                      ? 'text-foreground bg-rarity-5/10'
                      : _echo.cost === 3
                        ? 'text-foreground bg-rarity-4/10'
                        : 'text-foreground bg-rarity-3/10',
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
    </Row>
  );
};
