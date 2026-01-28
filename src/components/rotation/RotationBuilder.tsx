import { Play } from 'lucide-react';
import { useState } from 'react';
import { useContainerWidth } from 'react-grid-layout';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Row, Section } from '@/components/ui/layout';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';
import { useTeamAttacks } from '@/hooks/useTeamAttacks';
import { useTeamModifiers } from '@/hooks/useTeamModifiers';
import { useRotationStore } from '@/store/useRotationStore';
import { useTeamStore } from '@/store/useTeamStore';
import type { DetailedAttack, DetailedBuff } from '@/types/client/capability';

import { AttackSequenceBuilder } from './AttackSequenceBuilder';
import { BuffTimelineBuilder } from './BuffTimelineBuilder';
import { RotationResultDisplay } from './RotationResultDisplay';
import { createSharedGridConfig } from './types';

/**
 * Parent Component: Manages state and layout for the Rotation Builder
 * Fetches all necessary game data and enriches rotation state for children.
 */
export const RotationBuilder = () => {
  const team = useTeamStore((state) => state.team);
  const rotationAttacks = useRotationStore((state) => state.attacks);
  const rotationBuffs = useRotationStore((state) => state.buffs);
  const clearAll = useRotationStore((state) => state.clearAll);

  // Fetch detailed data from service hooks
  const { attacks: availableAttacks, isLoading: isAttacksLoading } =
    useTeamAttacks(team);
  const { buffs: availableBuffs, isLoading: isBuffsLoading } = useTeamModifiers(team);

  // Enrichment Logic: Combine store state (IDs/Values) with detailed metadata
  const enrichedAttacks = rotationAttacks.map((attack) => ({
    ...attack,
    ...(availableAttacks.find((a) => a.id === attack.id) as DetailedAttack),
  }));

  const enrichedBuffs = rotationBuffs.map((buff) => ({
    ...buff,
    ...(availableBuffs.find((b) => b.id === buff.id) as DetailedBuff),
  }));

  const [showResult, setShowResult] = useState(false);
  const rotationMutation = useRotationCalculation();

  const handleCalculate = async () => {
    try {
      await rotationMutation.mutateAsync();
      setShowResult(true);
    } catch (err) {
      console.error('Calculation failed', err);
    }
  };

  const isLoading = isAttacksLoading || isBuffsLoading;

  // Measure container width for shared grid config
  const { width: containerWidth, containerRef } = useContainerWidth();

  // Shared grid config for horizontal alignment between attack sequence and buff canvas
  const sharedGridConfig = createSharedGridConfig(
    enrichedAttacks.length,
    containerWidth - 32, // Account for padding
  );

  return (
    <Section ref={containerRef} className="min-h-0 flex-1">
      {/* Result Display */}
      {showResult && rotationMutation.data && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <RotationResultDisplay
            result={rotationMutation.data}
            attacks={enrichedAttacks}
          />
        </div>
      )}

      {/* Main Card */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="px-4 py-3">
          <Row className="items-center justify-between">
            <CardTitle className="text-base tracking-wider uppercase">
              Rotation Builder
            </CardTitle>
            <Row className="gap-2">
              {(rotationAttacks.length > 0 || rotationBuffs.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearAll();
                    setShowResult(false);
                  }}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Clear All
                </Button>
              )}
              {rotationAttacks.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleCalculate}
                  disabled={rotationMutation.isPending || isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 font-bold shadow-lg"
                >
                  <Play className="mr-2 h-4 w-4 fill-current" />
                  {rotationMutation.isPending
                    ? 'Calculating...'
                    : 'Calculate Rotation Damage'}
                </Button>
              )}
            </Row>
          </Row>
        </CardHeader>

        <AttackSequenceBuilder
          availableAttacks={availableAttacks}
          enrichedAttacks={enrichedAttacks}
          gridConfig={sharedGridConfig}
          isLoading={isAttacksLoading}
        />

        <BuffTimelineBuilder
          availableBuffs={availableBuffs}
          enrichedBuffs={enrichedBuffs}
          gridConfig={sharedGridConfig}
          isLoading={isBuffsLoading}
        />
      </Card>
    </Section>
  );
};
