import { useTeamStore } from '@/store/useTeamStore';

import { CharacterPalette } from '../palette';

export const BuffPalette = () => {
  const team = useTeamStore((state) => state.team);
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2">
      {team.map((char, index) =>
        char.name ? (
          <CharacterPalette
            key={`${char.name}-${index}`}
            character={char}
            itemType="buffs"
            variant="compact"
            grouped={false}
          />
        ) : null,
      )}
    </div>
  );
};
