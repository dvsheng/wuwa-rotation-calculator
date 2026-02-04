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
import { useEchoSetList } from '@/hooks/useEchoSetList';
import { useTeamStore } from '@/store/useTeamStore';

import { AssetIcon } from '../common/AssetIcon';

interface EchoSetSelectorProperties {
  index: number;
}

export const EchoSetSelector = ({ index }: EchoSetSelectorProperties) => {
  const selectedEchoSets = useTeamStore((state) => state.team[index].echoSets);
  const { data: echoSetList = [] } = useEchoSetList();
  const setEchoSet = useTeamStore((state) => state.setEchoSet);
  const setEchoSetRequirement = useTeamStore((state) => state.setEchoSetRequirement);
  const updateCharacter = useTeamStore((state) => state.updateCharacter);

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

  const handleUpdateSet = (setIndex: number, id: string) => {
    setEchoSet(index, setIndex, id);
  };

  return (
    <Stack spacing="sm">
      <Stack spacing="sm">
        {selectedEchoSets.map((set, setIndex) => {
          const selectedSetConfig = echoSetList.find((s) => s.id === set.id);
          const availableTiers = selectedSetConfig?.tiers || [2, 5];

          return (
            <Row key={setIndex} className="items-end gap-2 px-1">
              <AssetIcon name="guord" className="brightness-0" />
              <div className="min-w-0 flex-1">
                <SearchableSelect
                  items={echoSetList}
                  value={selectedSetConfig?.name}
                  onItemClick={(item) => handleUpdateSet(setIndex, item.id)}
                  placeholder="Select echo set"
                  className="w-full"
                />
              </div>

              {set.id && (
                <div className="w-20 shrink-0">
                  <Select
                    value={String(set.requirement)}
                    onValueChange={(value) =>
                      setEchoSetRequirement(index, setIndex, value)
                    }
                  >
                    <SelectTrigger className="h-8 px-2 text-[10px]">
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
                </div>
              )}

              {selectedEchoSets.length > 1 && (
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
