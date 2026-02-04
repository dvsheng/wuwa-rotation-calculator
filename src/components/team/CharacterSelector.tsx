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
import { useTeamStore } from '@/store/useTeamStore';

interface CharacterSelectorProperties {
  index: number;
}

export const CharacterSelector = ({ index }: CharacterSelectorProperties) => {
  const character = useTeamStore((state) => state.team[index]);
  const otherSelectedCharacterIds = useTeamStore(
    useShallow((s) =>
      s.team.flatMap((c, index_) => (index_ !== index && c.id ? [c.id] : [])),
    ),
  );
  const setCharacter = useTeamStore((state) => state.setCharacter);
  const setSequence = useTeamStore((state) => state.setSequence);

  return (
    <Row className="flex-1 gap-2 overflow-hidden px-1">
      <AssetIcon name="role" className="brightness-0 dark:invert" />
      <div className="min-w-0 flex-1">
        <CharacterSelectionDialog
          value={character.id}
          onValueChange={(id) => setCharacter(index, id)}
          excludeIds={otherSelectedCharacterIds}
        />
      </div>
      <div className="w-16 shrink-0">
        <Select
          value={String(character.sequence)}
          onValueChange={(value) => setSequence(index, Number.parseInt(value))}
        >
          <SelectTrigger className="h-9 px-2">
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
