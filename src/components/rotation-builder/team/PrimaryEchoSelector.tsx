import { AssetIcon } from '@/components/common/AssetIcon';
import type { FilterConfig } from '@/components/common/SelectionDialog';
import { SelectionDialog } from '@/components/common/SelectionDialog';
import { Row } from '@/components/ui/layout';
import { useEntityList } from '@/hooks/useEntityList';
import { EntityType } from '@/services/game-data';
import type { ListEchoesResponseItem } from '@/services/game-data';
import { useStore } from '@/store';

import { EntitySelectorTile } from './EntitySelectorTile';

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
          renderItem={(_echo, isSelected) => (
            <EntitySelectorTile entity={_echo} isSelected={isSelected} />
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
