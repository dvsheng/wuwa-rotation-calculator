import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AdminEntity } from '@/components/admin/AdminEntity';

const adminEntitySearchSchema = z.object({
  capabilityId: z.coerce.number().int().positive().optional(),
});

function AdminEntityDetailsPage() {
  const { id } = Route.useParams();
  const { capabilityId } = Route.useSearch();

  return <AdminEntity id={Number.parseInt(id)} capabilityId={capabilityId} />;
}

export const Route = createFileRoute('/admin/entities_/$id')({
  validateSearch: adminEntitySearchSchema,
  component: AdminEntityDetailsPage,
});
