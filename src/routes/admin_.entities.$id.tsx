/* eslint-disable unicorn/filename-case */
import { createFileRoute } from '@tanstack/react-router';

import { EntityDetails } from '@/components/admin/entities/EntityDetails';
import { AppHeader } from '@/components/AppHeader';

export const Route = createFileRoute('/admin_/entities/$id')({
  component: EntityDetailsPage,
});

function EntityDetailsPage() {
  const { id } = Route.useParams();

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex flex-1 overflow-hidden">
        <EntityDetails entityId={Number(id)} />
      </main>
    </div>
  );
}
