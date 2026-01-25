import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Calculator, Loader2, Settings, Shield, Sword, User } from 'lucide-react';
import { Suspense } from 'react';

import { EnemyContainer } from '@/components/enemy/EnemyContainer';
import { RotationBuilder } from '@/components/rotation/RotationBuilder';
import { TeamContainer } from '@/components/team/TeamContainer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Main App ---

function App() {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="bg-background text-foreground flex min-h-screen flex-col font-sans">
        <header className="bg-card border-border sticky top-0 z-20 flex items-center justify-between border-b p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Calculator className="text-primary h-6 w-6" />
            </div>
            <h1 className="from-primary bg-gradient-to-r to-blue-600 bg-clip-text text-xl font-bold text-transparent">
              Wuthering Waves Rotation Builder
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="icon" title="Admin Console">
                <Settings size={18} />
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <Tabs defaultValue="team" className="w-full space-y-6">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="team" className="flex items-center gap-2">
                  <User size={16} /> Team
                </TabsTrigger>
                <TabsTrigger value="enemy" className="flex items-center gap-2">
                  <Shield size={16} /> Enemy
                </TabsTrigger>
                <TabsTrigger value="rotation" className="flex items-center gap-2">
                  <Sword size={16} /> Rotation
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="team" className="space-y-4 focus-visible:outline-none">
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

            <TabsContent value="enemy" className="space-y-4 focus-visible:outline-none">
              <EnemyContainer />
            </TabsContent>

            <TabsContent
              value="rotation"
              className="space-y-4 focus-visible:outline-none"
            >
              <RotationBuilder />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
}

export const Route = createFileRoute('/')({ component: App });
