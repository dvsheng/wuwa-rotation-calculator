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
import type { Attack } from '@/schemas/rotation';

interface AttackConfigurationDialogProps {
  attack: Attack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, parameterValue: number) => void;
}

export const AttackConfigurationDialog = ({
  attack,
  open,
  onOpenChange,
  onSave,
}: AttackConfigurationDialogProps) => {
  const [value, setValue] = useState<number | string>(attack?.parameterValue ?? '');

  // Use parameters directly from the attack object
  const parameterDefinition = attack?.parameters?.[0] || null;

  const handleSave = () => {
    if (attack && value !== '') {
      onSave(attack.id, Number(value));
      onOpenChange(false);
    }
  };

  if (!attack) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure {attack.name}</DialogTitle>
          <DialogDescription>{attack.description}</DialogDescription>
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
              Minimum: {parameterDefinition.minimum}
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
