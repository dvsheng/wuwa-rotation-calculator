import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import type { Team } from '@/types/client';

import type { RotationItem } from '../types';

import { SidebarCharacter } from './SidebarCharacter';

interface RotationSidebarProps {
  team: Team;
  onSkillClick: (item: Omit<RotationItem, 'id'>) => void;
  isDragging: boolean;
}

export const RotationSidebar = ({
  team,
  onSkillClick,
  isDragging,
}: RotationSidebarProps) => {
  return (
    <aside className="bg-card flex min-h-0 w-full flex-col rounded-xl border md:w-80">
      <div className="bg-muted/30 border-b p-4">
        <Text
          variant="small"
          className="text-muted-foreground font-bold tracking-wider uppercase"
        >
          Character Skills
        </Text>
      </div>
      <ScrollArea className="min-w-0 flex-1">
        <div className="divide-border/50 min-w-0 divide-y">
          {team.map((char, index) =>
            char.name ? (
              <SidebarCharacter
                key={`${char.name}-${index}`}
                character={char}
                onSkillClick={onSkillClick}
                isDragging={isDragging}
              />
            ) : null,
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};
