import { User } from 'lucide-react';

import { SearchableSelect } from '@/components/common/SearchableSelect';
import { Row } from '@/components/ui/layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCharacterList } from '@/hooks/useCharacterList';
import { useTeamStore } from '@/store/useTeamStore';

interface CharacterSelectorProps {
  index: number;
}

export const CharacterSelector = ({ index }: CharacterSelectorProps) => {
  const character = useTeamStore((state) => state.team[index]);
  const team = useTeamStore((state) => state.team);
  const setCharacter = useTeamStore((state) => state.setCharacter);
  const setSequence = useTeamStore((state) => state.setSequence);

  const { data: characterList } = useCharacterList();

  const otherSelectedCharacterNames = team
    .filter((_c, i) => i !== index)
    .map((c) => c.name)
    .filter((n): n is string => !!n);

  const availableCharacters = characterList.filter(
    (c) => !otherSelectedCharacterNames.includes(c.name),
  );

  return (
    <Row className="flex-1 gap-2">
      <User className="text-primary h-5 w-5 shrink-0" />
      <div className="flex-1">
        <SearchableSelect
          options={availableCharacters}
          value={character.name}
          onChange={(newName) => {
            const char = characterList.find((c) => c.name === newName);
            if (char) setCharacter(index, char.id.toString(), newName);
          }}
          placeholder="Select character"
        />
      </div>
      <div className="w-16 shrink-0">
        <Select
          value={String(character.sequence)}
          onValueChange={(val) => setSequence(index, parseInt(val))}
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
