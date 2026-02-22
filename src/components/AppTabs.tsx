import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Database, Library, Loader2, Shield, Sword, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { Suspense, useState } from 'react';

import { EnemyContainer } from '@/components/enemy/EnemyContainer';
import { RotationSummary } from '@/components/results/RotationSummary';
import { RotationBuilder } from '@/components/rotation/RotationBuilder';
import { TeamContainer } from '@/components/team/TeamContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AppTabsProperties {
  children?: ReactNode;
}

export const AppTabs = ({ children }: AppTabsProperties) => {
  const [selectedTab, setSelectedTab] = useState('team');
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdminRoute = pathname.startsWith('/admin');
  const isBuildsRoute = pathname === '/builds';
  const activeTab = isAdminRoute ? 'database' : isBuildsRoute ? 'builds' : selectedTab;
  const isBuildTab =
    activeTab === 'team' || activeTab === 'enemy' || activeTab === 'rotation';

  const handleTabChange = (nextTab: string) => {
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

    if (isAdminRoute || isBuildsRoute) {
      setSelectedTab(nextTab);
      void navigate({ to: '/' });
      return;
    }

    setSelectedTab(nextTab);
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
            value="team"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex h-10 items-center justify-start gap-3 border-none px-4 shadow-none"
          >
            <User size={18} /> Team
          </TabsTrigger>
          <TabsTrigger
            value="enemy"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex h-10 items-center justify-start gap-3 border-none px-4 shadow-none"
          >
            <Shield size={18} /> Enemy
          </TabsTrigger>
          <TabsTrigger
            value="rotation"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex h-10 items-center justify-start gap-3 border-none px-4 shadow-none"
          >
            <Sword size={18} /> Rotation
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 mb-3 px-2">
          <h2 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Builds
          </h2>
        </div>
        <TabsList className="flex h-auto flex-col items-stretch justify-start gap-1 bg-transparent p-0">
          <TabsTrigger
            value="builds"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex h-10 items-center justify-start gap-3 border-none px-4 shadow-none"
          >
            <Library size={18} /> Explore builds
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
        {isBuildTab && (
          <div className="mb-8">
            <RotationSummary />
          </div>
        )}

        <TabsContent value="team" className="m-0 space-y-4 focus-visible:outline-none">
          <Suspense
            fallback={
              <div className="text-muted-foreground animate-in fade-in flex flex-col items-center justify-center p-20 duration-500">
                <Loader2 className="text-primary mb-4 h-10 w-10 animate-spin" />
                <p className="text-lg font-medium">Loading character data...</p>
              </div>
            }
          >
            <TeamContainer />
          </Suspense>
        </TabsContent>

        <TabsContent value="enemy" className="m-0 space-y-4 focus-visible:outline-none">
          <EnemyContainer />
        </TabsContent>

        <TabsContent
          value="rotation"
          className="m-0 space-y-4 focus-visible:outline-none"
        >
          <RotationBuilder />
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
