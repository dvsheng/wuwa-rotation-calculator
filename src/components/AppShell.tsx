import { TooltipProvider } from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

import { AppHeader } from '@/components/AppHeader';

interface AppShellProperties {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProperties) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="bg-background text-foreground flex min-h-screen flex-col font-sans">
        <AppHeader />
        <main>
          <div className="min-h-0 flex-1">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
