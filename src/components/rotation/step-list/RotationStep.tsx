import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

import type { RotationItem } from '../types';

interface RotationStepProps {
  item: RotationItem;
  index: number;
  onRemove: (id: string) => void;
}

export const RotationStep = ({ item, index, onRemove }: RotationStepProps) => {
  return (
    <Card className="group hover:border-primary/40 bg-card p-3 transition-colors">
      <Row className="items-center gap-4">
        <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
          {index + 1}
        </div>
        <Stack spacing="default" className="min-w-0 flex-1">
          <Text variant="small" className="text-primary/80 truncate font-semibold">
            {item.characterName}
          </Text>
          <Text className="truncate text-sm">
            {item.skillName}:{' '}
            <span className="text-muted-foreground">{item.damageInstanceName}</span>
          </Text>
        </Stack>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </Row>
    </Card>
  );
};
