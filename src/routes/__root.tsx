import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';

import { AppShell } from '@/components/AppShell';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { themeInitScript } from '@/hooks/useTheme';
import appCss from '@/styles.css?url';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        // eslint-disable-next-line unicorn/text-encoding-identifier-case
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'I.R.I.S. Rotation Inspector',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicon.png',
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function NotFound() {
  return <div className="p-6 text-center">Page not found</div>;
}

function RootErrorFallback() {
  return (
    <div className="flex h-screen items-center justify-center p-6">
      <div className="border-destructive/20 bg-destructive/5 p-panel flex items-start gap-2 rounded-md border">
        <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex flex-col gap-1">
          <span className="text-destructive text-sm font-medium">
            Something went wrong
          </span>
        </div>
      </div>
    </div>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {import.meta.env.DEV && <script src="http://localhost:8097"></script>}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppShell>
              <ErrorBoundary FallbackComponent={RootErrorFallback}>
                {children}
              </ErrorBoundary>
            </AppShell>
          </TooltipProvider>
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              {
                name: 'React Query',
                render: <ReactQueryDevtoolsPanel />,
              },
            ]}
          />
        </QueryClientProvider>
        <Toaster position="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
