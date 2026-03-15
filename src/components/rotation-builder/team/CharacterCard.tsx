import { Suspense } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { ECHO_PIECE_COUNT } from '@/schemas/echo';

import { CharacterSelector } from './CharacterSelector';
import { EchoPieceEditor } from './EchoPieceEditor';
import { EchoSetSelector } from './EchoSetSelector';
import { PrimaryEchoSelector } from './PrimaryEchoSelector';
import { SelectorSkeleton } from './StyledBaseSelector';
import { WeaponSelector } from './WeaponSelector';

interface CharacterCardProperties {
  index: number;
}

const CharacterCardHeaderSkeleton = () => (
  <Stack gap="panel">
    <SelectorSkeleton />
    <SelectorSkeleton />
    <SelectorSkeleton />
    <SelectorSkeleton withSecondary={false} />
  </Stack>
);

export const CharacterCard = ({ index }: CharacterCardProperties) => {
  return (
    <Card className="w-md p-0">
      <CardHeader className="bg-accent p-compact h-80">
        <Suspense fallback={<CharacterCardHeaderSkeleton />}>
          <CharacterSelector index={index} />
          <WeaponSelector index={index} />
          <EchoSetSelector index={index} />
          <PrimaryEchoSelector index={index} />
        </Suspense>
      </CardHeader>
      <CardContent>
        <Stack gap="component" className="p-component">
          <Text variant="title">Echo Stats</Text>
          <Stack className="gap-component divide-border divide-y">
            {Array.from({ length: ECHO_PIECE_COUNT }, (_, echoIndex) => (
              <EchoPieceEditor
                key={echoIndex}
                characterIndex={index}
                echoIndex={echoIndex}
              />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
