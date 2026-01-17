import { useForm } from '@tanstack/react-form';
import { Link, createFileRoute } from '@tanstack/react-router';
import {
  Calculator,
  ChevronDown,
  Loader2,
  Settings,
  Shield,
  Sword,
  User,
  Zap,
} from 'lucide-react';
import { Suspense, useState } from 'react';

import { EnemyContainer } from '@/components/enemy/EnemyContainer';
import { RotationBuilder } from '@/components/rotation/RotationBuilder';
import { TeamContainer } from '@/components/team/TeamContainer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateRotationDamage } from '@/services/rotation-calculator/calculate-rotation-damage';
import type { RotationResult } from '@/services/rotation-calculator/types';
import { useTeamStore } from '@/store/useTeamStore';
import type { Integer } from '@/types';
import type { Enemy } from '@/types/server';

// --- Main App ---

function App() {
  const [result, setResult] = useState<RotationResult | null>(null);
  const team = useTeamStore((state) => state.team);
  const enemyData = useTeamStore((state) => state.enemy);

  const form = useForm({
    defaultValues: {
      duration: 20,
    },
    onSubmit: ({ value }) => {
      try {
        const mappedEnemy: Enemy = {
          level: enemyData.level as Integer,
          stats: {
            baseResistance: Object.entries(enemyData.resistances).map(
              ([attr, val]) => ({
                value: val / 100,
                tags: [attr],
              }),
            ),
            resistanceReduction: [],
            defenseReduction: [],
            fusionBurst: [],
            glacioChafe: [],
            aeroErosion: [],
            electroFlare: [],
            spectroFrazzle: [],
            havocBane: [],
          },
        };

        // TODO: Get actual damage instances from RotationBuilder
        const res = calculateRotationDamage({
          duration: value.duration,
          team,
          enemy: mappedEnemy,
          damageInstances: [],
        } as any);
        setResult(res);
      } catch (e: any) {
        alert('Error calculating damage: ' + e.message);
      }
    },
  });

  return (
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
          <Button
            onClick={form.handleSubmit}
            size="lg"
            className="shadow-primary/20 gap-2 font-semibold shadow-lg transition-all active:scale-95"
          >
            <Zap size={18} /> Calculate
          </Button>
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

        {/* --- RESULTS AREA --- */}
        {result && (
          <div className="bg-background/95 border-border animate-in slide-in-from-bottom fixed right-0 bottom-0 left-0 z-50 border-t p-6 shadow-2xl backdrop-blur duration-300">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div>
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                  Total Damage
                </h3>
                <div className="from-primary bg-gradient-to-r to-blue-500 bg-clip-text text-4xl font-black text-transparent">
                  {Math.round(result.totalDamage).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-8">
                <div>
                  <div className="text-muted-foreground text-sm">DPS</div>
                  <form.Field
                    name="duration"
                    children={(field) => (
                      <div className="text-foreground text-xl font-bold">
                        {Math.round(
                          result.totalDamage / (field.state.value || 1),
                        ).toLocaleString()}
                      </div>
                    )}
                  />
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Hits</div>
                  <div className="text-foreground text-xl font-bold">
                    {result.damageInstances.length}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setResult(null)}
                className="h-10 w-10 rounded-full"
              >
                <ChevronDown />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export const Route = createFileRoute('/')({ component: App });
