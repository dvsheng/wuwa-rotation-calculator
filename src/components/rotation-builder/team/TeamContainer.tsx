import { Shield, Users } from 'lucide-react';

import { CardGrid, Container, Section } from '@/components/ui/layout';
import { TeamSchema } from '@/schemas/team';

import { EnemyContainer } from '../enemy/EnemyContainer';

import { CharacterCard } from './CharacterCard';

export const TeamContainer = () => {
  const teamSize = TeamSchema.def.items.length;
  return (
    <Container className="mx-auto grid min-h-0 w-fit grid-cols-4 overflow-hidden p-0">
      <Section className="border-border col-span-3 flex flex-col space-y-0 overflow-hidden border-r">
        <div className="canvas-header border-border bg-muted/40 w-full border-b px-panel py-component">
          <div className="gap-compact flex items-center justify-center">
            <Users className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-semibold">Team</span>
          </div>
        </div>
        <div className="overflow-auto p-page">
          <CardGrid className="w-fit">
            {Array.from({ length: teamSize }).map((_, index) => (
              <CharacterCard key={index} index={index} />
            ))}
          </CardGrid>
        </div>
      </Section>
      <Section className="col-span-1 flex flex-col space-y-0 overflow-hidden">
        <div className="canvas-header border-border bg-muted/40 w-full border-b px-panel py-component">
          <div className="gap-compact flex items-center">
            <Shield className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-semibold">Enemy</span>
          </div>
        </div>
        <div className="overflow-auto p-page">
          <EnemyContainer />
        </div>
      </Section>
    </Container>
  );
};
