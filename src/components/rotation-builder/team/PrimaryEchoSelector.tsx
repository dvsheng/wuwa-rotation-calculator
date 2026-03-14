import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { useEntityList } from '@/hooks/useEntityList';
import { EntityType } from '@/services/game-data';
import { useStore } from '@/store';

import { EntitySelectionDialog } from './EntitySelectionDialog';
import { SelectorLayout } from './StyledBaseSelector';

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

  const selectedSetIds = new Set(
    selectedEchoSets.map((set) => echoSetList.find((s) => s.id === set.id)?.gameId),
  );
  const primaryEchoOptions = echoList.filter((_echo) =>
    _echo.sets.some((set) => selectedSetIds.has(set)),
  );
  const echoIconUrl = echoList.find((s) => s.id === echo.id)?.iconUrl;
  return (
    <SelectorLayout icon={<EntityIconDisplay url={echoIconUrl} size="large" />}>
      <EntitySelectionDialog
        items={primaryEchoOptions}
        value={echo.id}
        onValueChange={(id) => {
          if (id !== echo.id) clearForEntity(echo.id);
          setEcho(index, id);
        }}
      />
    </SelectorLayout>
  );
};
