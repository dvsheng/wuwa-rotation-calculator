import { compact } from 'es-toolkit/array';
import type { Layout, LayoutItem } from 'react-grid-layout';
import GridLayout, { verticalCompactor } from 'react-grid-layout';

import { Text } from '@/components/ui/typography';
import { useCanvasLayout } from '@/hooks/useCanvasLayout';
import { useTeamAttackInstances } from '@/hooks/useTeamAttackInstances';
import { useStore } from '@/store';

import { AttackCanvasItem } from './AttackCanvasItem';

export interface AttackCanvasProperties {
  onDropAttack: (layout: Layout, item: LayoutItem | undefined, event: Event) => void;
}

export const AttackCanvas = ({ onDropAttack }: AttackCanvasProperties) => {
  const { attacks } = useTeamAttackInstances();
  const storedAttacks = useStore((state) => state.attacks);
  const removeAttack = useStore((state) => state.removeAttack);
  const setAttacks = useStore((state) => state.setAttacks);

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

  const { layout: fullLayoutProperties, isInteracting } = useCanvasLayout({
    layout: attacks.map((attack, index) => ({
      i: attack.instanceId,
      x: index,
      y: 0,
      w: 1,
      h: 1,
    })),
    gridConfig: { maxRows: 1 },
    compactor: verticalCompactor,
    resizeConfig: { enabled: false },
    onDrop: onDropAttack,
    onLayoutChange: handleLayoutChange,
  });

  const handleRemoveAttack = (instanceId: string) => {
    removeAttack(instanceId);
  };

  return (
    <div className="canvas-section">
      <div className="canvas-content">
        <div
          className="canvas-drop-zone"
          style={{ minWidth: fullLayoutProperties.width }}
        >
          {attacks.length === 0 && (
            <div className="canvas-empty-state">
              <Text variant="overline" tone="muted">
                Drag attacks here to build your rotation
              </Text>
            </div>
          )}

          <GridLayout {...fullLayoutProperties}>
            {attacks.map((attack, index) => (
              <div key={attack.instanceId}>
                <AttackCanvasItem
                  attack={attack}
                  index={index}
                  onRemove={handleRemoveAttack}
                  isDialogClickable={!isInteracting}
                />
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
    </div>
  );
};
