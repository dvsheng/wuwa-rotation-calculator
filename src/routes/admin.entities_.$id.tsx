import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AdminEntity } from '@/components/admin/AdminEntity';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const adminEntitySearchSchema = z.object({
  capabilityId: z.coerce.number().int().positive().optional(),
});

function AdminEntityDetailsPageWithBoundary() {
  const { id } = Route.useParams();
  const { capabilityId } = Route.useSearch();

  return (
    <ErrorBoundary>
      <AdminEntity id={Number.parseInt(id)} capabilityId={capabilityId} />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute('/admin/entities_/$id')({
  validateSearch: adminEntitySearchSchema,
  component: AdminEntityDetailsPageWithBoundary,
});
