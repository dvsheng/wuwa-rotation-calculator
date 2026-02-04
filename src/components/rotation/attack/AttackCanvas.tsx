import { compact } from 'es-toolkit/array';
import { cloneDeep, merge } from 'es-toolkit/object';
import type { Layout, LayoutItem } from 'react-grid-layout';
import GridLayout, { horizontalCompactor } from 'react-grid-layout';

import { Text } from '@/components/ui/typography';
import { useCanvasLayout } from '@/hooks/useCanvasLayout';
import { useTeamAttackInstances } from '@/hooks/useTeamAttackInstances';
import { useRotationStore } from '@/store/useRotationStore';

import { AttackCanvasItem } from './AttackCanvasItem';

export interface AttackCanvasProperties {
  onDropAttack: (layout: Layout, item: LayoutItem | undefined, event: Event) => void;
}

export const AttackCanvas = ({ onDropAttack }: AttackCanvasProperties) => {
  const { layout: gridLayoutProperties, containerRef } = useCanvasLayout();
  const { attacks } = useTeamAttackInstances();
  const storedAttacks = useRotationStore((state) => state.attacks);
  const removeAttack = useRotationStore((state) => state.removeAttack);
  const setAttacks = useRotationStore((state) => state.setAttacks);

  const handleLayoutChange = (layout: Layout) => {
    if (layout.length !== storedAttacks.length) return;
    const newAttackInstanceIdOrder = [...layout]
      .toSorted((a, b) => a.x - b.x)
      .map((layoutItem) => layoutItem.i);
    const hasAttackOrderChanged = storedAttacks.some(
      (attack, index) => attack.instanceId !== newAttackInstanceIdOrder[index],
    );
    if (hasAttackOrderChanged) {
      const newAttackOrder = compact(
        newAttackInstanceIdOrder.map((id) =>
          storedAttacks.find((attack) => attack.instanceId === id),
        ),
      );
      setAttacks(newAttackOrder);
    }
  };

  const additionalLayoutProperties = {
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

  const fullLayoutProperties = merge(
    cloneDeep(gridLayoutProperties),
    additionalLayoutProperties,
  );

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
          {attacks.length === 0 && (
            <div className="canvas-empty-state">
              <Text className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                Drag attacks here to build your rotation
              </Text>
            </div>
          )}

          <GridLayout {...fullLayoutProperties}>
            {attacks.map((attack, index) => (
              <div key={attack.instanceId} className="h-full w-full">
                <AttackCanvasItem
                  attack={attack}
                  index={index}
                  onRemove={removeAttack}
                />
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
    </div>
  );
};
