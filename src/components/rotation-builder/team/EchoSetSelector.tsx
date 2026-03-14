import { Plus } from 'lucide-react';

import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { TrashButton } from '@/components/common/TrashButton';
import { Button } from '@/components/ui/button';
import { Row, Stack } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEntityList } from '@/hooks/useEntityList';
import { EntityType } from '@/services/game-data';
import { useStore } from '@/store';

import { EntitySelectionDialog } from './EntitySelectionDialog';

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
        return (
          <Stack fullWidth>
            <Row align="center" gap="component">
              <div className="flex w-20 shrink-0 items-center justify-center">
                <EntityIconDisplay
                  url={echoSetList.find((s) => s.id === set.id)?.iconUrl}
                  size="medium"
                />
              </div>

              <Row gap="component" className="flex-1">
                <EntitySelectionDialog
                  items={echoSetList}
                  value={echoSetList.find((s) => s.id === set.id)?.id ?? 0}
                  onValueChange={(id) => {
                    handleUpdateSet(setIndex, id);
                  }}
                />
                <Select
                  value={String(set.requirement)}
                  onValueChange={(value) =>
                    setEchoSetRequirement(index, setIndex, value)
                  }
                >
                  <SelectTrigger className="bg-background w-20 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTiers.map((tier) => (
                      <SelectItem key={tier} value={String(tier)}>
                        {tier}-Pc
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {setIndex > 0 && (
                  <TrashButton
                    className="size-8"
                    onRemove={() => handleRemoveSet(setIndex)}
                  />
                )}
              </Row>
            </Row>
            {selectedEchoSets.length < 2 && (
              <Row>
                <div className="flex w-20"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddSet}
                  className="text-muted-foreground"
                >
                  <Plus className="h-3 w-3" /> Add Echo Set Bonus
                </Button>
              </Row>
            )}
          </Stack>
        );
      })}
    </>
  );
};
