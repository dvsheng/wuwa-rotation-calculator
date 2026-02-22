import { createFileRoute } from '@tanstack/react-router';

import { LibraryContainer } from '@/components/library/LibraryContainer';

function BuildsPage() {
  return <LibraryContainer />;
}

export const Route = createFileRoute('/builds')({ component: BuildsPage });
