import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { GridLayoutProps } from 'react-grid-layout';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Text } from '@/components/ui/typography';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import type { Capability } from '@/schemas/rotation';
import { CapabilitySchema } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';

import { AttackPalette } from './attack-palette/AttackPalette';
import { RotationAttackSequence } from './step-list/RotationAttackSequence';

export interface AttackSequenceBuilderProps {
  gridLayoutProps: Omit<GridLayoutProps, 'children'>;
}

export const AttackSequenceBuilder = ({
  gridLayoutProps,
}: AttackSequenceBuilderProps) => {
  const addAttack = useRotationStore((state) => state.addAttack);
  const [paletteOpen, setPaletteOpen] = useState(true);
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
          <AttackPalette
            onClickAttack={handleAddAttack}
            onDragAttack={handleDragAttack}
          />
        </CollapsibleContent>
      </Collapsible>
      <RotationAttackSequence
        gridLayoutProps={gridLayoutProps}
        onDropAttack={handleDropAttack}
      />
    </>
  );
};
