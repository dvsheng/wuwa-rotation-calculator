import { useShallow } from 'zustand/react/shallow';

import { AssetIcon } from '@/components/common/AssetIcon';
import { Row } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/store';

import { CharacterSelectionDialog } from './CharacterSelectionDialog';

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
  const clearAllForCharacter = useStore((state) => state.clearAllForCharacter);
  const setSequence = useStore((state) => state.setSequence);

  return (
    <Row className="selector-row">
      <AssetIcon name="role" className="selector-icon" />
      <div className="selector-main">
        <CharacterSelectionDialog
          value={character.id}
          onValueChange={(id) => {
            if (id !== character.id) clearAllForCharacter(character.id);
            setCharacter(index, id);
          }}
          excludeIds={otherSelectedCharacterIds}
        />
      </div>
      <Select
        value={String(character.sequence)}
        onValueChange={(value) => setSequence(index, Number.parseInt(value))}
      >
        <SelectTrigger className="selector-secondary">
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
    </Row>
  );
};
