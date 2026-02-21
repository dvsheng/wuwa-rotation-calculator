import { Plus, Trash2 } from 'lucide-react';

import { SearchableSelect } from '@/components/common/SearchableSelect';
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

import { AssetIcon } from '../common/AssetIcon';

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
    <Stack spacing="sm">
      <Stack spacing="sm">
        {selectedEchoSets.map((set, setIndex) => {
          const selectedSetConfig = echoSetList.find((s) => s.id === set.id);
          const availableTiers = selectedSetConfig?.tiers || [2, 5];
          return (
            <Row key={setIndex} className="selector-row">
              <AssetIcon name="guord" className="selector-icon" />
              <div className="selector-main">
                <SearchableSelect
                  items={echoSetList}
                  value={selectedSetConfig?.name}
                  onItemClick={(item) => handleUpdateSet(setIndex, item.id)}
                  placeholder="Select echo set"
                  className="w-full"
                />
              </div>

              <div className="selector-secondary">
                {set.id && (
                  <Select
                    value={String(set.requirement)}
                    onValueChange={(value) =>
                      setEchoSetRequirement(index, setIndex, value)
                    }
                  >
                    <SelectTrigger className="h-9 w-full px-2">
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
              </div>

              {selectedEchoSets.length > 1 &&
                (setIndex === 1 || selectedEchoSets[1]?.id) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                    onClick={() => handleRemoveSet(setIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
            </Row>
          );
        })}

        {selectedEchoSets.length < 2 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-fit gap-1 text-[10px]"
            onClick={handleAddSet}
          >
            <Plus className="h-3 w-3" /> Add Echo Set Bonus
          </Button>
        )}
      </Stack>
    </Stack>
  );
};
