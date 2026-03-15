import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRotationLibrary } from '@/hooks/useRotationLibrary';
import { calculateRotation } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import { useStore } from '@/store';

import { Stack } from '../ui/layout';

interface SaveRotationDialogProperties {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}

export function SaveRotationDialog({
  open,
  onOpenChange,
  trigger,
}: SaveRotationDialogProperties = {}) {
  // TODO: Refactor to use useForm
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const { team, enemy, attacks, buffs } = useStore();
  const { createRotation, isCreating } = useRotationLibrary();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for the rotation.');
      return;
    }
    try {
      let totalDamage: number | undefined;
      try {
        const result = await calculateRotation({
          data: { team, enemy, attacks, buffs },
        });
        totalDamage = result.totalDamage;
      } catch {
        // calculation is best-effort; save without it if it fails
      }

      await createRotation({
        name,
        data: { team, enemy, attacks, buffs },
        description: description || undefined,
        totalDamage,
      });
      toast.success('Rotation saved successfully!');
      setOpen(false);
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to save rotation:', error);
      toast.error('Failed to save rotation.');
    }
  };

  const resolvedTrigger =
    trigger === undefined ? (
      <Button variant="default">Save Current Rotation</Button>
    ) : (
      trigger
    );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setName('');
          setDescription('');
        }
      }}
    >
      {resolvedTrigger && <DialogTrigger asChild>{resolvedTrigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Rotation</DialogTitle>
          <DialogDescription>
            Save your current team, enemy, and rotation configuration to the library.
          </DialogDescription>
        </DialogHeader>
        <Stack gap="component">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My Awesome Rotation"
          />
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional notes..."
          />
        </Stack>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={isCreating}>
            {isCreating ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
