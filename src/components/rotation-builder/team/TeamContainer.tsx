import { CardGrid, Section } from '@/components/ui/layout';
import { TeamSchema } from '@/schemas/team';

import { CharacterCard } from './CharacterCard';

export const TeamContainer = () => {
  const teamSize = TeamSchema.def.items.length;
  return (
    <Section>
      <CardGrid>
        {Array.from({ length: teamSize }).map((_, index) => (
          <CharacterCard key={index} index={index} />
        ))}
      </CardGrid>
    </Section>
  );
};
