import { Shield, Users } from 'lucide-react';

import { DashboardSectionHeader } from '@/components/common/DashboardSectionHeader';
import { Row, Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TEAM_SIZE } from '@/schemas/team';

import { EnemyContainer } from '../enemy/EnemyContainer';

import { CharacterCard } from './CharacterCard';

export const TeamContainer = () => {
  return (
    <Row justify="center" align="start" fullWidth className="min-h-0 min-w-0 flex-1">
      <Stack className="border-border h-full min-w-0 flex-1 overflow-hidden border-r">
        <DashboardSectionHeader
          title="Team"
          description="Configure your team, weapons, and echoes."
          icon={<Users />}
        />
        <ScrollArea orientation="both" className="min-h-0 flex-1">
          <Row gap="component" className="p-component w-fit">
            {Array.from({ length: TEAM_SIZE }).map((_, index) => (
              <CharacterCard key={index} index={index} />
            ))}
          </Row>
        </ScrollArea>
      </Stack>
      <Stack className="w-fit">
        <DashboardSectionHeader
          title="Enemy"
          description="Set enemy level and elemental resistances."
          icon={<Shield />}
        />
        <div className="p-component">
          <EnemyContainer />
        </div>
      </Stack>
    </Row>
  );
};
