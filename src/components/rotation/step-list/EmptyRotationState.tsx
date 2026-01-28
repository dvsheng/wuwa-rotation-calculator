import { GripVertical } from 'lucide-react';

import { Text } from '@/components/ui/typography';

export const EmptyRotationState = () => {
  return (
    <div className="text-muted-foreground pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
      <div className="bg-muted/50 mb-2 rounded-full p-2">
        <GripVertical className="h-5 w-5 opacity-20" />
      </div>
      <Text variant="small">Drag attacks here to build your rotation</Text>
    </div>
  );
};
