import { Button } from '@/components/ui/button';
import { Row, Stack } from '@/components/ui/layout';
import { Heading, Text } from '@/components/ui/typography';
import { useTeamAttacks } from '@/hooks/useTeamAttacks';
import type { Attack } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';
import { useTeamStore } from '@/store/useTeamStore';

import { AttackPalette } from './attack-palette/AttackPalette';
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

  const handleAddAttack = (attack: Attack, index?: number) => {
    addAttack(attack, index);
  };

  return (
    <Stack spacing="lg" className="h-[calc(100vh-140px)]">
      <Row className="items-center justify-between">
        <Heading level={2}>Rotation Builder</Heading>
        {(attacks.length > 0 || buffs.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Clear All
          </Button>
        )}
      </Row>

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
    </Stack>
  );
};
