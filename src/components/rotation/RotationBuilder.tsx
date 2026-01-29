import { useState } from 'react';
import { useContainerWidth } from 'react-grid-layout';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Row, Section } from '@/components/ui/layout';
import { useTeamAttacks } from '@/hooks/useTeamAttacks';
import { useTeamModifiers } from '@/hooks/useTeamModifiers';
import type { Capability } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';
import { useTeamStore } from '@/store/useTeamStore';

import { AttackSequenceBuilder } from './AttackSequenceBuilder';
import { BuffTimelineBuilder } from './BuffTimelineBuilder';
import { RotationSummary } from './RotationSummary';
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
  const [showResult, setShowResult] = useState(false);
  // Measure container width for shared grid config
  const { width: containerWidth, containerRef } = useContainerWidth();
  // Fetch detailed data from service hooks
  const { attacks: availableAttacks, isLoading: isAttacksLoading } =
    useTeamAttacks(team);
  const { buffs: availableBuffs, isLoading: isBuffsLoading } = useTeamModifiers(team);

  // Enrichment Logic: Combine store state (IDs/Values) with detailed metadata
  const enrichedAttacks = rotationAttacks.map((attack) => ({
    ...(availableAttacks.find((a) => a.id === attack.id) as Capability),
    ...attack,
  }));
  const enrichedBuffs = rotationBuffs.map((buff) => ({
    ...(availableBuffs.find((b) => b.id === buff.id) as Capability),
    ...buff,
  }));
  const isLoading = isAttacksLoading || isBuffsLoading;
  const sharedGridConfig = createSharedGridConfig(
    enrichedAttacks.length,
    containerWidth - 32, // Account for padding
  );

  return (
    <Section ref={containerRef} className="min-h-0 flex-1">
      <RotationSummary
        enrichedAttacks={enrichedAttacks}
        isLoading={isLoading}
        showResult={showResult}
        onShowResultChange={setShowResult}
      />

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
