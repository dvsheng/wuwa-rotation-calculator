import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AdminEntity } from '@/components/entities/AdminEntity';

const entitySearchSchema = z.object({
  capabilityId: z.coerce.number().int().positive().optional(),
});

function EntityDetailsPage() {
  const { id } = Route.useParams();
  const { capabilityId } = Route.useSearch();

  return <AdminEntity id={Number.parseInt(id)} capabilityId={capabilityId} />;
}

export const Route = createFileRoute('/entities_/$id')({
  validateSearch: entitySearchSchema,
  component: EntityDetailsPage,
});
