import { createFileRoute } from '@tanstack/react-router';

import { AdminTabs } from '@/components/admin/AdminTabs';
import { AppHeader } from '@/components/AppHeader';

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex flex-1 overflow-hidden">
        <AdminTabs />
      </main>
    </div>
  );
}
