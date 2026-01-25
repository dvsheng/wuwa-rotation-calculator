import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCharacterDetails } from '@/hooks/useCharacterDetails';
import type { BuffWithPosition } from '@/schemas/rotation';

interface BuffConfigurationDialogProps {
  buff: BuffWithPosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (timelineId: string, parameterValue: number) => void;
}

export const BuffConfigurationDialog = ({
  buff,
  open,
  onOpenChange,
  onSave,
}: BuffConfigurationDialogProps) => {
  const [value, setValue] = useState<number | string>(buff?.parameterValue ?? '');

  // Fetch detailed info to get min/max/scaling logic
  const { data: characterData } = useCharacterDetails(buff?.buff.characterName || '');

  const buffDefinition = characterData?.modifiers.find(
    (m) => m.name === buff?.buff.name,
  );

  // Extract parameter definition if available
  const parameterDefinition = (() => {
    if (!buffDefinition?.modifiedStats) return null;
    for (const stats of Object.values(buffDefinition.modifiedStats)) {
      if (!stats) continue;
      for (const stat of stats) {
        if (typeof stat.value === 'object' && 'parameterConfigs' in stat.value) {
          // Return the first config found
          const configs = Object.values(stat.value.parameterConfigs);
          if (configs.length > 0) return configs[0];
        }
      }
    }
    return null;
  })();

  const handleSave = () => {
    if (buff && value !== '') {
      onSave(buff.timelineId, Number(value));
      onOpenChange(false);
    }
  };

  if (!buff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure {buff.buff.name}</DialogTitle>
          <DialogDescription>{buff.buff.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parameter-value" className="text-right">
              Value
            </Label>
            <Input
              id="parameter-value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="col-span-3"
              placeholder={
                parameterDefinition
                  ? `Min: ${parameterDefinition.minimum}`
                  : 'Enter value'
              }
            />
          </div>
          {parameterDefinition && (
            <div className="text-muted-foreground text-xs">
              Scale: {parameterDefinition.scale}, Minimum: {parameterDefinition.minimum}
              {parameterDefinition.maximum
                ? `, Maximum: ${parameterDefinition.maximum}`
                : ''}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
