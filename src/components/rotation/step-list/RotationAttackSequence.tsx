import { merge } from 'es-toolkit/object';
import type { GridLayoutProps, Layout, LayoutItem } from 'react-grid-layout';
import GridLayout, { horizontalCompactor } from 'react-grid-layout';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { useRotationStore } from '@/store/useRotationStore';

import { EmptyRotationState } from './EmptyRotationState';
import { RotationAttack } from './RotationAttack';

export interface RotationAttackSequenceProps {
  gridLayoutProps: Omit<GridLayoutProps, 'children'>;
  onDropAttack: (layout: Layout, item: LayoutItem | undefined, event: Event) => void;
}

export const RotationAttackSequence = ({
  gridLayoutProps,
  onDropAttack,
}: RotationAttackSequenceProps) => {
  const attacks = useRotationStore((state) => state.attacks);
  const removeAttack = useRotationStore((state) => state.removeAttack);
  const setAttacks = useRotationStore((state) => state.setAttacks);

  const handleLayoutChange = (layout: Layout) => {
    if (layout.length !== attacks.length) return;
    const newAttackInstanceIdOrder = [...layout]
      .sort((a, b) => a.x - b.x)
      .map((layoutItem) => layoutItem.i);
    const hasAttackOrderChanged = attacks.some(
      (attack, index) => attack.instanceId !== newAttackInstanceIdOrder[index],
    );
    if (hasAttackOrderChanged) {
      const newAttackOrder = newAttackInstanceIdOrder
        .map((id) => attacks.find((attack) => attack.id === id))
        .filter((attack) => attack !== undefined);
      setAttacks(newAttackOrder);
    }
  };

  const additionalLayoutProps = {
    layout: attacks.map((attack, index) => ({
      i: attack.instanceId,
      x: index,
      y: 0,
      w: 1,
      h: 1,
    })),
    gridConfig: { maxRows: 1 },
    compactor: horizontalCompactor,
    resizeConfig: { enabled: false },
    onDrop: onDropAttack,
    onLayoutChange: handleLayoutChange,
  };

  const fullLayoutProps = merge(gridLayoutProps, additionalLayoutProps);

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t">
      <div className="flex items-center justify-between px-4 py-2">
        <Text className="text-sm font-semibold tracking-wider uppercase">
          Attack Sequence
        </Text>
        <Text variant="tiny" className="text-muted-foreground font-medium">
          {attacks.length} {attacks.length === 1 ? 'Attack' : 'Attacks'}
        </Text>
      </div>

      <div className="px-4 pb-4">
        <ScrollArea className="w-full">
          <div
            className="border-border/50 bg-muted/10 relative min-h-[80px] rounded-lg border transition-colors"
            style={{ minWidth: gridLayoutProps.width }}
          >
            {attacks.length === 0 && <EmptyRotationState />}

            <GridLayout {...fullLayoutProps}>
              {attacks.map((attack, index) => (
                <div key={attack.instanceId} className="h-full w-full">
                  <RotationAttack
                    attack={attack}
                    index={index}
                    onRemove={removeAttack}
                  />
                </div>
              ))}
            </GridLayout>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};
