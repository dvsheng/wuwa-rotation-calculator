import { TooltipProvider } from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

import { AppHeader } from '@/components/AppHeader';

import { Stack } from './ui/layout';

interface AppShellProperties {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProperties) {
  return (
    <TooltipProvider delayDuration={100}>
      <Stack className="h-screen overflow-hidden">
        <AppHeader />
        <main className="h-full min-h-0 flex-1">{children}</main>
      </Stack>
    </TooltipProvider>
  );
}
