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

interface CharacterSelectorProps {
  index: number;
}

export const CharacterSelector = ({ index }: CharacterSelectorProps) => {
  const character = useTeamStore((state) => state.team[index]);
  const team = useTeamStore((state) => state.team);
  const setCharacter = useTeamStore((state) => state.setCharacter);
  const setSequence = useTeamStore((state) => state.setSequence);

  const otherSelectedCharacterNames = team
    .filter((_c, i) => i !== index)
    .map((c) => c.name)
    .filter((n): n is string => !!n);

  return (
    <Row className="flex-1 gap-2 overflow-hidden px-1">
      <AssetIcon name="role" className="brightness-0 dark:invert" />
      <div className="min-w-0 flex-1">
        <CharacterSelectionDialog
          selectedCharacterName={character.name}
          onSelect={(id, name) => setCharacter(index, id, name)}
          excludeNames={otherSelectedCharacterNames}
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
