import { TooltipProvider } from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

import { AppHeader } from '@/components/AppHeader';
import { AppTabs } from '@/components/AppTabs';

interface AppShellProperties {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProperties) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="bg-background text-foreground flex min-h-screen flex-col font-sans">
        <AppHeader />

        <main className="flex flex-1 overflow-hidden">
          <AppTabs>{children}</AppTabs>
        </main>
      </div>
    </TooltipProvider>
  );
}
