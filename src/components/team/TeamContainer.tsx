import { CharacterCard } from '@/components/team/CharacterCard';
import { CardGrid, Section } from '@/components/ui/layout';
import { Heading } from '@/components/ui/typography';
import { TeamSchema } from '@/schemas/team';

export const TeamContainer = () => {
  const teamSize = TeamSchema.def.items.length;
  return (
    <Section>
      <div className="flex items-center justify-between">
        <Heading>Team Configuration</Heading>
      </div>

      <CardGrid>
        {Array.from({ length: teamSize }).map((_, index) => (
          <CharacterCard key={index} index={index} />
        ))}
      </CardGrid>
    </Section>
  );
};
