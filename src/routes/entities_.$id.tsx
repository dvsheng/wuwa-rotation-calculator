/* eslint-disable unicorn/filename-case */
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AdminEntity } from '@/components/entities/AdminEntity';

const entitySearchSchema = z.object({
  capabilityId: z.coerce.number().int().positive().optional(),
});

function EntityDetailsPage() {
  const { id } = Route.useParams();

  return <AdminEntity id={Number.parseInt(id)} />;
}

export const Route = createFileRoute('/entities_/$id')({
  validateSearch: entitySearchSchema,
  component: EntityDetailsPage,
});
