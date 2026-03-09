import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';

import { LibraryContainer } from '@/components/builds/LibraryContainer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/typography';

function LibraryLoadingFallback() {
  return (
    <div className="container mx-auto max-w-5xl space-y-6">
      <Skeleton className="h-7 w-32" />
      <Card className="border-dashed">
        <CardContent className="py-page text-center">
          <Text variant="small">Loading saved rotations...</Text>
        </CardContent>
      </Card>
    </div>
  );
}

function BuildsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LibraryLoadingFallback />}>
        <LibraryContainer />
      </Suspense>
    </ErrorBoundary>
  );
}

export const Route = createFileRoute('/builds')({ component: BuildsPage });
