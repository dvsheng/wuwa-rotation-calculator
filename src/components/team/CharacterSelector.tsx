import { useShallow } from 'zustand/react/shallow';

import { AssetIcon } from '@/components/common/AssetIcon';
import { CharacterSelectionDialog } from '@/components/team/CharacterSelectionDialog';
import { Row } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/store';

interface CharacterSelectorProperties {
  index: number;
}

export const CharacterSelector = ({ index }: CharacterSelectorProperties) => {
  const character = useStore((state) => state.team[index]);
  const otherSelectedCharacterIds = useStore(
    useShallow((s) =>
      s.team.flatMap((c, index_) => (index_ !== index && c.id ? [c.id] : [])),
    ),
  );
  const setCharacter = useStore((state) => state.setCharacter);
  const setSequence = useStore((state) => state.setSequence);

  return (
    <Row className="selector-row flex-1 overflow-hidden">
      <AssetIcon name="role" className="selector-icon" />
      <div className="selector-main">
        <CharacterSelectionDialog
          value={character.id}
          onValueChange={(id) => setCharacter(index, id)}
          excludeIds={otherSelectedCharacterIds}
        />
      </div>
      <div className="selector-secondary">
        <Select
          value={String(character.sequence)}
          onValueChange={(value) => setSequence(index, Number.parseInt(value))}
        >
          <SelectTrigger className="h-9 w-full px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4, 5, 6].map((s) => (
              <SelectItem key={s} value={String(s)}>
                S{s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Row>
  );
};
