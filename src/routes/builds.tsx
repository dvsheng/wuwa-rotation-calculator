import { createFileRoute } from '@tanstack/react-router';

import { LibraryContainer } from '@/components/builds/LibraryContainer';
import { Container } from '@/components/ui/layout';

function BuildsPage() {
  return (
    <Container padding="page" className="h-full min-h-0 max-w-6xl">
      <LibraryContainer />
    </Container>
  );
}

export const Route = createFileRoute('/builds')({ component: BuildsPage });
