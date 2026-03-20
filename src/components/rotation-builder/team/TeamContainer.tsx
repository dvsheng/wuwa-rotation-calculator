import { Users } from 'lucide-react';

import { DashboardSectionHeader } from '@/components/common/DashboardSectionHeader';
import { Row, Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TEAM_SIZE } from '@/schemas/team';

import { EnemySheet } from '../enemy/EnemyContainer';

import { CharacterCard } from './CharacterCard';

export const TeamContainer = () => {
  return (
    <Row justify="center" align="start" fullWidth className="min-h-0 min-w-0 flex-1">
      <Stack className="border-border relative h-full min-w-0 flex-1 overflow-hidden border-r">
        <DashboardSectionHeader
          title="Team"
          description="Build the team here by choosing each slot's character, weapon, echoes, and substats. Those choices set the stats and passives used everywhere else in the rotation."
          icon={<Users />}
          action={<EnemySheet />}
        />
        <ScrollArea orientation="both" className="min-h-0 flex-1">
          <Row gap="component" align="start" className="p-page justify-center">
            {Array.from({ length: TEAM_SIZE }).map((_, index) => (
              <CharacterCard key={index} index={index} />
            ))}
          </Row>
        </ScrollArea>
      </Stack>
    </Row>
  );
};
