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
import { useCharacterEchoes } from '@/hooks/useCharacterEchoes';
import { useEntityList } from '@/hooks/useEntityList';
import { EntityType } from '@/services/game-data';
import { useStore } from '@/store';

import { EntitySelectionDialog } from './EntitySelectionDialog';

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
  const { syncCharacterEchoes } = useCharacterEchoes(index);
  const { data: characterList = [] } = useEntityList({
    entityType: EntityType.CHARACTER,
  });

  return (
    <Row className="selector-row">
      <AssetIcon name="role" className="selector-icon" />
      <EntitySelectionDialog
        items={characterList}
        value={character.id}
        onValueChange={(id) => {
          if (id === character.id) {
            return;
          }

          clearAllForCharacter(character.id);
          setCharacter(index, id);
          syncCharacterEchoes(id).catch((error: unknown) => {
            console.error(error);
          });
        }}
        excludeIds={otherSelectedCharacterIds}
      />
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
