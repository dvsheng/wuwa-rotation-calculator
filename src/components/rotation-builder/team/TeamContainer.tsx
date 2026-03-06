import { Shield, Users } from 'lucide-react';

import { Row, Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { TEAM_SIZE } from '@/schemas/team';

import { EnemyContainer } from '../enemy/EnemyContainer';

import { CharacterCard } from './CharacterCard';

export const TeamContainer = () => {
  return (
    <Row justify="center" className="min-h-0 min-w-0 flex-1">
      <Stack className="border-border flex h-full w-fit overflow-hidden border-r">
        <Row
          gap="compact"
          align="center"
          justify="center"
          className="p-panel border-border canvas-header shrink-0 border-b"
        >
          <Users className="text-muted-foreground size-4" />
          <Text as="span" variant="heading">
            Team
          </Text>
        </Row>
        <ScrollArea className="min-h-0 flex-1">
          <Row gap="component" className="p-component w-fit">
            {Array.from({ length: TEAM_SIZE }).map((_, index) => (
              <CharacterCard key={index} index={index} />
            ))}
          </Row>
        </ScrollArea>
      </Stack>
      <Stack className="w-fit">
        <Row
          gap="compact"
          align="center"
          justify="center"
          className="p-panel border-border canvas-header shrink-0 border-b"
        >
          <Shield className="text-muted-foreground size-4" />
          <Text as="span" variant="heading">
            Enemy
          </Text>
        </Row>
        <div className="p-component">
          <EnemyContainer />
        </div>
      </Stack>
    </Row>
  );
};
