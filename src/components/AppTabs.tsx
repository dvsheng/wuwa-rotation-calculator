import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Database, Library, PencilRuler } from 'lucide-react';
import type { ReactNode } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AppTabsProperties {
  children?: ReactNode;
}

export const AppTabs = ({ children }: AppTabsProperties) => {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdminRoute = pathname.startsWith('/admin');
  const isBuildsRoute = pathname === '/builds';
  const activeTab = isAdminRoute ? 'database' : isBuildsRoute ? 'builds' : 'home';

  const handleTabChange = (nextTab: string) => {
    if (nextTab === 'home') {
      if (!isAdminRoute && !isBuildsRoute) {
        return;
      }

      void navigate({ to: '/' });
      return;
    }

    if (nextTab === 'database') {
      if (isAdminRoute) {
        return;
      }

      void navigate({ to: '/admin/entities' });
      return;
    }

    if (nextTab === 'builds') {
      if (isBuildsRoute) {
        return;
      }

      void navigate({ to: '/builds' });
      return;
    }
  };

  return (
    <Tabs
      defaultValue="team"
      value={activeTab}
      onValueChange={handleTabChange}
      orientation="vertical"
      className="flex w-full flex-row gap-0"
    >
      {/* Sidebar */}
      <aside className="bg-muted/30 flex w-64 flex-col border-r p-4">
        <div className="mb-3 px-2">
          <h2 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Build
          </h2>
        </div>
        <TabsList className="flex h-auto flex-col items-stretch justify-start gap-1 bg-transparent p-0">
          <TabsTrigger
            value="home"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex h-10 items-center justify-start gap-3 border-none px-4 shadow-none"
          >
            <PencilRuler size={18} /> Build Rotation
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 mb-3 px-2">
          <h2 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Explore
          </h2>
        </div>
        <TabsList className="flex h-auto flex-col items-stretch justify-start gap-1 bg-transparent p-0">
          <TabsTrigger
            value="builds"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex h-10 items-center justify-start gap-3 border-none px-4 shadow-none"
          >
            <Library size={18} /> Explore Builds
          </TabsTrigger>
          <TabsTrigger
            value="database"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex h-10 items-center justify-start gap-3 border-none px-4 shadow-none"
          >
            <Database size={18} /> Configure Entities
          </TabsTrigger>
        </TabsList>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <TabsContent value="home" className="m-0 space-y-4 focus-visible:outline-none">
          {children}
        </TabsContent>

        <TabsContent
          value="builds"
          className="m-0 space-y-4 focus-visible:outline-none"
        >
          {children}
        </TabsContent>

        <TabsContent
          value="database"
          className="m-0 space-y-4 focus-visible:outline-none"
        >
          {children}
        </TabsContent>
      </div>
    </Tabs>
  );
};
