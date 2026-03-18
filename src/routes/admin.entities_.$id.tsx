import { createFileRoute } from '@tanstack/react-router';

import { AdminEntity } from '@/components/admin/AdminEntity';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AdminEntityDetailsPageWithBoundary() {
  const { id } = Route.useParams();

  return (
    <ErrorBoundary>
      <AdminEntity id={Number.parseInt(id)} />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute('/admin/entities_/$id')({
  component: AdminEntityDetailsPageWithBoundary,
});
