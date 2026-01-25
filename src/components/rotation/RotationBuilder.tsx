import { Play } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Row, Stack } from '@/components/ui/layout';
import { Heading, Text } from '@/components/ui/typography';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';
import { useTeamAttacks } from '@/hooks/useTeamAttacks';
import type { Attack } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';
import { useTeamStore } from '@/store/useTeamStore';

import { AttackPalette } from './attack-palette/AttackPalette';
import { RotationResultDisplay } from './RotationResultDisplay';
import { RotationAttackSequence } from './step-list/RotationAttackSequence';
import { BuffTimeline } from './timeline/BuffTimeline';

/**
 * Parent Component: Manages state and layout for the Rotation Builder
 */
export const RotationBuilder = () => {
  const attacks = useRotationStore((state) => state.attacks);
  const buffs = useRotationStore((state) => state.buffs);
  const addAttack = useRotationStore((state) => state.addAttack);
  const removeAttack = useRotationStore((state) => state.removeAttack);
  const setAttacks = useRotationStore((state) => state.setAttacks);
  const clearAll = useRotationStore((state) => state.clearAll);
  const team = useTeamStore((state) => state.team);
  const availableAttacks = useTeamAttacks(team);

  const [showResult, setShowResult] = useState(false);

  const rotationMutation = useRotationCalculation();

  const handleAddAttack = (attack: Attack, index?: number) => {
    addAttack(attack, index);
  };

  const handleCalculate = async () => {
    try {
      await rotationMutation.mutateAsync();
      setShowResult(true);
    } catch (err) {
      console.error('Calculation failed', err);
    }
  };

  return (
    <Stack spacing="lg" className="min-h-0 flex-1">
      <Row className="items-center justify-between">
        <Heading level={2}>Rotation Builder</Heading>
        <Row>
          {(attacks.length > 0 || buffs.length > 0) && (
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
          {attacks.length > 0 && (
            <Button
              size="sm"
              onClick={handleCalculate}
              disabled={rotationMutation.isPending}
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

      <div className="flex flex-col gap-6 overflow-hidden">
        {showResult && rotationMutation.data && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <RotationResultDisplay result={rotationMutation.data} attacks={attacks} />
          </div>
        )}

        <BuffTimeline />

        <div className="flex flex-1 flex-col gap-6 overflow-hidden md:flex-row">
          <RotationAttackSequence
            attacks={attacks}
            onRemove={removeAttack}
            onReorder={setAttacks}
            onDrop={handleAddAttack}
          />
          <aside className="bg-card flex min-h-0 w-full flex-col rounded-xl border md:w-80">
            <div className="bg-muted/30 border-b p-4">
              <Text
                variant="small"
                className="text-muted-foreground font-bold tracking-wider uppercase"
              >
                Available Attacks
              </Text>
            </div>
            {availableAttacks.isLoading ? (
              <div className="flex flex-1 items-center justify-center p-4">
                <Text variant="muted">Loading attacks...</Text>
              </div>
            ) : (
              <AttackPalette attacks={availableAttacks.attacks} />
            )}
          </aside>
        </div>
      </div>
    </Stack>
  );
};
