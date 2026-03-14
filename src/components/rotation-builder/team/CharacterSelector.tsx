import { useShallow } from 'zustand/react/shallow';

import { EntityIconDisplay } from '@/components/common/EntityIcon';
import { useCharacterEchoes } from '@/hooks/useCharacterEchoes';
import { useEntityList } from '@/hooks/useEntityList';
import { EntityType } from '@/services/game-data';
import { useStore } from '@/store';

import { EntitySelectionDialog } from './EntitySelectionDialog';
import { SecondarySelector, SelectorLayout } from './StyledBaseSelector';

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
    <SelectorLayout
      iconClassName="size-20"
      icon={
        <EntityIconDisplay
          url={characterList.find((c) => c.id === character.id)?.iconUrl}
          size="large"
          className="h-full w-full"
        />
      }
    >
      <EntitySelectionDialog
        items={characterList}
        value={character.id}
        onValueChange={(id) => {
          if (id === character.id) return;
          clearAllForCharacter(character.id);
          setCharacter(index, id);
          syncCharacterEchoes(id).catch((error: unknown) => {
            console.error(error);
          });
        }}
        excludeIds={otherSelectedCharacterIds}
      />
      <SecondarySelector
        value={String(character.sequence)}
        onValueChange={(value) => setSequence(index, Number.parseInt(value))}
        options={[0, 1, 2, 3, 4, 5, 6].map((s) => ({
          value: String(s),
          label: `S${s}`,
        }))}
      />
    </SelectorLayout>
  );
};
