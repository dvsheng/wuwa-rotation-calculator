import { Plus } from 'lucide-react';

import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { TrashButton } from '@/components/common/TrashButton';
import { Button } from '@/components/ui/button';
import { Stack } from '@/components/ui/layout';
import { useEntityList } from '@/hooks/useEntityList';
import { EntityType } from '@/services/game-data';
import { useStore } from '@/store';

import { EntitySelectionDialog } from './EntitySelectionDialog';
import {
  SecondarySelector,
  SelectorIconContainer,
  SelectorLayout,
  SelectorRow,
} from './StyledBaseSelector';

interface EchoSetSelectorProperties {
  index: number;
}

export const EchoSetSelector = ({ index }: EchoSetSelectorProperties) => {
  const selectedEchoSets = useStore((state) => state.team[index].echoSets);
  const { data: echoSetList = [] } = useEntityList({ entityType: EntityType.ECHO_SET });
  const setEchoSet = useStore((state) => state.setEchoSet);
  const setEchoSetRequirement = useStore((state) => state.setEchoSetRequirement);
  const updateCharacter = useStore((state) => state.updateCharacter);
  const clearForEntity = useStore((state) => state.clearForEntity);

  const handleAddSet = () => {
    if (selectedEchoSets.length < 2) {
      updateCharacter(index, (draft) => {
        draft.echoSets = [draft.echoSets[0], { id: -9999, requirement: '2' }];
      });
    }
  };

  const handleRemoveSet = (setIndex: number) => {
    if (selectedEchoSets.length > 1) {
      const oldId = selectedEchoSets[setIndex].id;
      if (oldId) clearForEntity(oldId);
      updateCharacter(index, (draft) => {
        const newSets = [...draft.echoSets];
        newSets.splice(setIndex, 1);
        draft.echoSets = newSets as any;
      });
    }
  };

  const handleUpdateSet = (setIndex: number, id: number) => {
    const oldId = selectedEchoSets[setIndex].id;
    if (oldId && oldId !== id) clearForEntity(oldId);
    const selectedSetConfig = echoSetList.find((set) => set.id === id);
    const availableTiers = selectedSetConfig?.tiers || [2, 5];
    setEchoSet(index, setIndex, id);
    setEchoSetRequirement(index, setIndex, String(availableTiers[0]));
  };

  return (
    <>
      {selectedEchoSets.map((set, setIndex) => {
        const selectedSetConfig = echoSetList.find((s) => s.id === set.id);
        const availableTiers = selectedSetConfig?.tiers || [2, 5];
        const echoSetUrl = echoSetList.find((s) => s.id === set.id)?.iconUrl;
        return (
          <Stack fullWidth key={setIndex}>
            <SelectorLayout icon={<EntityIconDisplay url={echoSetUrl} size="medium" />}>
              <EntitySelectionDialog
                items={echoSetList}
                value={echoSetList.find((s) => s.id === set.id)?.id ?? 0}
                onValueChange={(id) => {
                  handleUpdateSet(setIndex, id);
                }}
              />
              <SecondarySelector
                value={String(set.requirement)}
                onValueChange={(value) => setEchoSetRequirement(index, setIndex, value)}
                options={availableTiers.map((tier) => ({
                  value: String(tier),
                  label: `${tier}Pc`,
                }))}
              />
              {setIndex > 0 && (
                <TrashButton
                  className="size-8"
                  onRemove={() => handleRemoveSet(setIndex)}
                />
              )}
            </SelectorLayout>
            {selectedEchoSets.length < 2 && (
              <SelectorRow>
                <SelectorIconContainer />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddSet}
                  className="text-muted-foreground"
                >
                  <Plus className="h-3 w-3" /> Add Echo Set Bonus
                </Button>
              </SelectorRow>
            )}
          </Stack>
        );
      })}
    </>
  );
};
