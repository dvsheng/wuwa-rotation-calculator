import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ErrorBoundary } from 'react-error-boundary';

import { AdminEntity } from '@/components/admin/AdminEntity';
import { DataLoadFailed } from '@/components/common/DataLoadFailed';

const adminEntitySearchSchema = z.object({
  capabilityId: z.coerce.number().int().positive().optional(),
});

function AdminEntityDetailsPage() {
  const { id } = Route.useParams();
  const { capabilityId } = Route.useSearch();

  return (
    <ErrorBoundary fallback={<DataLoadFailed />}>
      <AdminEntity id={Number.parseInt(id)} capabilityId={capabilityId} />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute('/admin/entities_/$id')({
  validateSearch: adminEntitySearchSchema,
  component: AdminEntityDetailsPage,
});
