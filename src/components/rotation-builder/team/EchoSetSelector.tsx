import { Plus } from 'lucide-react';

import { AssetIcon } from '@/components/common/AssetIcon';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { TrashButton } from '@/components/common/TrashButton';
import { Button } from '@/components/ui/button';
import { Row } from '@/components/ui/layout';
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

interface EchoSetSelectorProperties {
  index: number;
}

export const EchoSetSelector = ({ index }: EchoSetSelectorProperties) => {
  const selectedEchoSets = useStore((state) => state.team[index].echoSets);
  const { data: echoSetList = [] } = useEntityList({ entityType: EntityType.ECHO_SET });
  const setEchoSet = useStore((state) => state.setEchoSet);
  const setEchoSetRequirement = useStore((state) => state.setEchoSetRequirement);
  const updateCharacter = useStore((state) => state.updateCharacter);

  const handleAddSet = () => {
    if (selectedEchoSets.length < 2) {
      updateCharacter(index, (draft) => {
        draft.echoSets = [draft.echoSets[0], { id: '', requirement: '2' }] as any;
      });
    }
  };

  const handleRemoveSet = (setIndex: number) => {
    if (selectedEchoSets.length > 1) {
      updateCharacter(index, (draft) => {
        const newSets = [...draft.echoSets];
        newSets.splice(setIndex, 1);
        draft.echoSets = newSets as any;
      });
    }
  };

  const handleUpdateSet = (setIndex: number, id: number) => {
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
          <Row key={setIndex} className="selector-row">
            <AssetIcon name="guord" className="selector-icon" />
            <div className="selector-main">
              <SearchableSelect
                items={echoSetList}
                value={selectedSetConfig?.id}
                onItemClick={(item) => handleUpdateSet(setIndex, item.id)}
                placeholder="Select echo set"
              />
            </div>

            {set.id && (
              <Select
                value={String(set.requirement)}
                onValueChange={(value) => setEchoSetRequirement(index, setIndex, value)}
              >
                <SelectTrigger className="selector-secondary">
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
            )}

            {selectedEchoSets.length > 1 &&
              (setIndex === 1 || selectedEchoSets[1]?.id) && (
                <TrashButton
                  className="size-8"
                  onRemove={() => handleRemoveSet(setIndex)}
                />
              )}
          </Row>
        );
      })}

      {selectedEchoSets.length < 2 && (
        <Row className="selector-row">
          <div className="selector-icon"></div>
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
    </>
  );
};
