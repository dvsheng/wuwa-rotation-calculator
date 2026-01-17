import { GripVertical } from 'lucide-react';

import { Text } from '@/components/ui/typography';

export const EmptyRotationState = () => {
  return (
    <div className="text-muted-foreground pointer-events-none flex min-h-64 flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="bg-muted/50 mb-4 rounded-full p-4">
        <GripVertical className="h-8 w-8 opacity-20" />
      </div>
      <Text>Drag skills here to start building your rotation</Text>
      <Text variant="small" className="mt-1 opacity-60">
        You can also reorder items by dragging them
      </Text>
    </div>
  );
};
