import { Suspense } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Stack } from '@/components/ui/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { ECHO_PIECE_COUNT } from '@/schemas/echo';

import { CharacterSelector } from './CharacterSelector';
import { EchoPieceEditor } from './EchoPieceEditor';
import { EchoSetSelector } from './EchoSetSelector';
import { PrimaryEchoSelector } from './PrimaryEchoSelector';
import { WeaponSelector } from './WeaponSelector';

interface CharacterCardProperties {
  index: number;
}

const CharacterCardSkeleton = () => (
  <Stack gap="panel">
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-full" />
    {Array.from({ length: ECHO_PIECE_COUNT }, (_, index) => (
      <Skeleton key={index} className="h-8 w-full" />
    ))}
  </Stack>
);

export const CharacterCard = ({ index }: CharacterCardProperties) => {
  return (
    <Card className="w-120">
      <CardContent>
        <ErrorBoundary>
          <Suspense fallback={<CharacterCardSkeleton />}>
            <Stack gap="panel">
              <CharacterSelector index={index} />
              <WeaponSelector index={index} />
              <EchoSetSelector index={index} />
              <PrimaryEchoSelector index={index} />
              {Array.from({ length: ECHO_PIECE_COUNT }, (_, echoIndex) => (
                <EchoPieceEditor
                  key={echoIndex}
                  characterIndex={index}
                  echoIndex={echoIndex}
                />
              ))}
            </Stack>
          </Suspense>
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
};
