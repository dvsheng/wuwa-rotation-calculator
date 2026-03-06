import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Row } from '@/components/ui/layout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { useStore } from '@/store';

export const RotationCanvasHeader = () => {
  const attacks = useStore((state) => state.attacks);
  const buffs = useStore((state) => state.buffs);
  const clearAll = useStore((state) => state.clearAll);

  return (
    <Row
      justify="between"
      align="center"
      className="canvas-header border-border px-panel border-b"
    >
      <Row align="center" className="gap-compact">
        <Text as="span" variant="heading">
          Rotation
        </Text>
        <Text as="span" variant="caption">
          ({attacks.length} {attacks.length === 1 ? 'attack' : 'attacks'},{' '}
          {buffs.length} {buffs.length === 1 ? 'buff' : 'buffs'})
        </Text>
        <Tooltip>
          <TooltipContent side="right">
            Drag attacks and buffs from the sidebar onto the canvas to build your
            rotation
          </TooltipContent>
          <TooltipTrigger asChild>
            <Info className="text-muted-foreground size-3.5 shrink-0" />
          </TooltipTrigger>
        </Tooltip>
      </Row>
      <Button variant="destructive" size="xs" onClick={clearAll}>
        Clear All
      </Button>
    </Row>
  );
};
