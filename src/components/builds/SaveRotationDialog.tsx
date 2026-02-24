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
import { calculateRotation } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import { useStore } from '@/store';
import { useLibraryStore } from '@/store/libraryStore';

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
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const { team, enemy, attacks, buffs } = useStore();
  const addRotation = useLibraryStore((state) => state.addRotation);

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

      addRotation(name, { team, enemy, attacks, buffs }, description, totalDamage);
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
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Save Rotation</DialogTitle>
          <DialogDescription>
            Save your current team, enemy, and rotation configuration to the library.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="col-span-3"
              placeholder="My Awesome Rotation"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="col-span-3"
              placeholder="Optional notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
