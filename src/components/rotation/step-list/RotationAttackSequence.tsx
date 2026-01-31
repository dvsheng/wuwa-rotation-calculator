import { compact } from 'es-toolkit/array';
import { cloneDeep, merge } from 'es-toolkit/object';
import type { Layout, LayoutItem } from 'react-grid-layout';
import GridLayout, { horizontalCompactor } from 'react-grid-layout';

import { Text } from '@/components/ui/typography';
import { useCanvasLayout } from '@/hooks/useCanvasLayout';
import { useRotationStore } from '@/store/useRotationStore';

import { EmptyRotationState } from './EmptyRotationState';
import { RotationAttack } from './RotationAttack';

export interface RotationAttackSequenceProps {
  onDropAttack: (layout: Layout, item: LayoutItem | undefined, event: Event) => void;
}

export const RotationAttackSequence = ({
  onDropAttack,
}: RotationAttackSequenceProps) => {
  const { layout: gridLayoutProps, containerRef } = useCanvasLayout();
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
      const newAttackOrder = compact(
        newAttackInstanceIdOrder.map((id) =>
          attacks.find((attack) => attack.instanceId === id),
        ),
      );
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

  const fullLayoutProps = merge(cloneDeep(gridLayoutProps), additionalLayoutProps);

  return (
    <div className="canvas-section">
      <div className="canvas-header">
        <Text className="text-sm font-semibold tracking-wider uppercase">
          Attack Sequence
        </Text>
        <Text variant="tiny" className="text-muted-foreground font-medium">
          {attacks.length} {attacks.length === 1 ? 'Attack' : 'Attacks'}
        </Text>
      </div>

      <div className="canvas-content">
        <div className="canvas-drop-zone" ref={containerRef}>
          {attacks.length === 0 && <EmptyRotationState />}

          <GridLayout {...fullLayoutProps}>
            {attacks.map((attack, index) => (
              <div key={attack.instanceId} className="h-full w-full">
                <RotationAttack attack={attack} index={index} onRemove={removeAttack} />
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
    </div>
  );
};
