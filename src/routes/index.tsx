import { TooltipProvider } from '@radix-ui/react-tooltip';
import { createFileRoute } from '@tanstack/react-router';

import { AppHeader } from '@/components/AppHeader';
import { AppTabs } from '@/components/AppTabs';

// --- Main App ---

function App() {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="bg-background text-foreground flex min-h-screen flex-col font-sans">
        <AppHeader />

        <main className="flex flex-1 overflow-hidden">
          <AppTabs />
        </main>
      </div>
    </TooltipProvider>
  );
}

export const Route = createFileRoute('/')({ component: App });
