import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Text } from '@/components/ui/typography';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import type { Attack, Capability } from '@/schemas/rotation';
import { CapabilitySchema } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';
import type { DetailedAttack } from '@/types/client/capability';

import { AttackPalette } from './attack-palette/AttackPalette';
import { RotationAttackSequence } from './step-list/RotationAttackSequence';
import type { SharedGridConfig } from './types';

interface AttackSequenceBuilderProps {
  availableAttacks: Array<DetailedAttack>;
  enrichedAttacks: Array<DetailedAttack & Attack>;
  gridConfig: SharedGridConfig;
  isLoading: boolean;
}

export const AttackSequenceBuilder = ({
  availableAttacks,
  enrichedAttacks,
  gridConfig,
  isLoading,
}: AttackSequenceBuilderProps) => {
  const [paletteOpen, setPaletteOpen] = useState(true);

  const addAttack = useRotationStore((state) => state.addAttack);
  const removeAttack = useRotationStore((state) => state.removeAttack);
  const setAttacks = useRotationStore((state) => state.setAttacks);
  const { handleDragStart: handleDragAttack, createHandleDrop } = useDragAndDrop({
    schema: CapabilitySchema,
  });

  const handleDropAttack = createHandleDrop((attack, item) => {
    addAttack(attack, item.x);
  });

  const handleAddAttack = (attack: Capability) => {
    addAttack(attack);
  };

  return (
    <>
      {/* Attack Palette - Collapsible */}
      <Collapsible open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CollapsibleTrigger asChild>
          <div className="hover:bg-accent/50 flex cursor-pointer items-center justify-between border-t border-b px-4 py-2 transition-colors">
            <Text className="text-sm font-semibold tracking-wider uppercase">
              Attack Palette
            </Text>
            <ChevronDown
              className={`text-muted-foreground h-4 w-4 transition-transform ${
                paletteOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Text variant="muted">Loading attacks...</Text>
            </div>
          ) : (
            <AttackPalette
              attacks={availableAttacks}
              onClickAttack={handleAddAttack}
              onDragAttack={handleDragAttack}
            />
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Attack Sequence */}
      <RotationAttackSequence
        attacks={enrichedAttacks}
        gridConfig={gridConfig}
        onRemove={removeAttack}
        onReorder={setAttacks}
        onDropAttack={handleDropAttack}
      />
    </>
  );
};
