import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Row, Section } from '@/components/ui/layout';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import type { Capability } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';

import { AttackCanvas } from './attack/AttackCanvas';
import { AttackPalette } from './attack/AttackPalette';
import { BuffCanvas } from './buff/BuffCanvas';
import { BuffPalette } from './buff/BuffPalette';

export const RotationBuilder = () => {
  const clearAll = useRotationStore((state) => state.clearAll);
  const addAttack = useRotationStore((state) => state.addAttack);
  const addBuff = useRotationStore((state) => state.addBuff);

  // Attack drag and drop
  const {
    handleDragStart: handleDragAttack,
    createHandleDrop: createHandleDropAttack,
  } = useDragAndDrop<Capability>();

  const handleDropAttack = createHandleDropAttack((attack, item) => {
    addAttack(attack, item.x);
  });

  const handleAddAttack = (attack: Capability) => {
    addAttack(attack);
  };

  // Buff drag and drop
  const { handleDragStart: handleDragBuff, createHandleDrop: createHandleDropBuff } =
    useDragAndDrop<Capability>();

  const handleDropBuff = createHandleDropBuff((buff, item) => {
    addBuff(buff, {
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    });
  });

  const handleAddBuff = (buff: Capability) => {
    addBuff(buff, { x: 0, y: 0, w: 2, h: 1 });
  };

  return (
    <Section className="min-h-0 flex-1">
      {/* Main Card */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="px-4 py-3">
          <Row className="items-center justify-between">
            <CardTitle className="text-base tracking-wider uppercase">
              Rotation Builder
            </CardTitle>
            <Row className="gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearAll()}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Clear All
              </Button>
            </Row>
          </Row>
        </CardHeader>

        <AttackPalette
          onClickAttack={handleAddAttack}
          onDragAttack={handleDragAttack}
        />

        {/* Shared scroll container for both canvases */}
        <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
          <AttackCanvas onDropAttack={handleDropAttack} />
          <BuffCanvas onDropBuff={handleDropBuff} />
        </div>

        <BuffPalette onClickBuff={handleAddBuff} onDragBuff={handleDragBuff} />
      </Card>
    </Section>
  );
};
