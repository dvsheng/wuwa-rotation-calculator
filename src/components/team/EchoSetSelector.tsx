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

interface EchoSetSelectorProps {
  index: number;
}

export const EchoSetSelector = ({ index }: EchoSetSelectorProps) => {
  const character = useTeamStore((state) => state.team[index]);
  const { data: echoSetList = [] } = useEchoSetList();
  const setEchoSet = useTeamStore((state) => state.setEchoSet);
  const setEchoSetRequirement = useTeamStore((state) => state.setEchoSetRequirement);
  const updateCharacter = useTeamStore((state) => state.updateCharacter);

  const handleAddSet = () => {
    if (character.echoSets.length < 2) {
      updateCharacter(index, (draft) => {
        draft.echoSets = [
          draft.echoSets[0],
          { id: '', name: '', requirement: '2' },
        ] as any;
      });
    }
  };

  const handleRemoveSet = (setIndex: number) => {
    if (character.echoSets.length > 1) {
      updateCharacter(index, (draft) => {
        const newSets = [...draft.echoSets];
        newSets.splice(setIndex, 1);
        draft.echoSets = newSets as any;
      });
    }
  };

  return (
    <Stack spacing="sm">
      <Stack spacing="sm">
        {character.echoSets.map((set, setIndex) => {
          const selectedSetConfig = echoSetList.find((s) => s.id === set.id);
          const availableTiers = selectedSetConfig?.tiers || [2, 5];

          return (
            <Row key={setIndex} className="items-end gap-2 px-1">
              <AssetIcon name="guord" className="brightness-0" />
              <div className="min-w-0 flex-1">
                <SearchableSelect
                  options={echoSetList}
                  value={set.name}
                  onChange={(val) => {
                    const foundSet = echoSetList.find((s) => s.name === val);
                    if (foundSet) {
                      setEchoSet(index, setIndex, foundSet.id, foundSet.name);
                    }
                  }}
                  placeholder="Select echo set"
                  className="w-full"
                />
              </div>

              {set.id && (
                <div className="w-20 shrink-0">
                  <Select
                    value={String(set.requirement)}
                    onValueChange={(val) => setEchoSetRequirement(index, setIndex, val)}
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

              {character.echoSets.length > 1 && (
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

        {character.echoSets.length < 2 && (
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
