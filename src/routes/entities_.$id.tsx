/* eslint-disable unicorn/filename-case */
import { createFileRoute } from '@tanstack/react-router';

import { EntityContainer } from '@/components/entities/EntityContainer';
import { Container } from '@/components/ui/layout';

function EntityDetailsPage() {
  const { id } = Route.useParams();
  return (
    <Container padding="page" className="max-w-6xl">
      <EntityContainer id={Number.parseInt(id)} />
    </Container>
  );
}

export const Route = createFileRoute('/entities_/$id')({
  component: EntityDetailsPage,
});
