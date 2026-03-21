import type { ReactNode } from 'react';

import { AppHeader } from '@/components/AppHeader';

import { Stack } from './ui/layout';

interface AppShellProperties {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProperties) {
  return (
    <Stack className="h-screen">
      <AppHeader />
      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <main className="min-h-0 flex-1 [view-transition-name:main-content]">
        {children}
      </main>
    </Stack>
  );
}
