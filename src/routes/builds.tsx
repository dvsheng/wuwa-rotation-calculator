import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { LibraryContainer } from '@/components/builds/LibraryContainer';
import { DataLoadFailed } from '@/components/common/DataLoadFailed';
import { Card, CardContent } from '@/components/ui/card';
import { Container, Stack } from '@/components/ui/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/typography';

function LibraryLoadingFallback() {
  return (
    <Container padding="page" className="h-full min-h-0 max-w-6xl">
      <Stack gap="component" className="h-full min-h-0">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Card className="border-dashed">
          <CardContent className="py-page text-center">
            <Text variant="bodySm" tone="muted">
              Loading saved rotations...
            </Text>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

function BuildsPage() {
  return (
    <Container padding="page" className="h-full min-h-0 max-w-6xl">
      <ErrorBoundary fallback={<DataLoadFailed />}>
        <Suspense fallback={<LibraryLoadingFallback />}>
          <LibraryContainer />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}

export const Route = createFileRoute('/builds')({ component: BuildsPage });
