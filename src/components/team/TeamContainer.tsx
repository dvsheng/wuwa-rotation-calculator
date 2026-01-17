import { CharacterCard } from '@/components/team/CharacterCard';
import { CardGrid, Section } from '@/components/ui/layout';
import { Heading } from '@/components/ui/typography';
import { useTeamStore } from '@/store/useTeamStore';

export const TeamContainer = () => {
  const team = useTeamStore((state) => state.team);

  return (
    <Section>
      <div className="flex items-center justify-between">
        <Heading>Team Configuration</Heading>
      </div>

      <CardGrid>
        {team.map((char, index) => (
          <CharacterCard key={`${char.name}-${index}`} index={index} />
        ))}
      </CardGrid>
    </Section>
  );
};
