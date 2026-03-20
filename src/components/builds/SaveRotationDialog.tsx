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
import { Textarea } from '@/components/ui/textarea';
import { useSaveRotation } from '@/hooks/useSaveRotation';

import { Stack } from '../ui/layout';

interface SaveRotationDialogProperties {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SaveRotationDialog({
  open,
  onOpenChange,
}: SaveRotationDialogProperties = {}) {
  // TODO: Refactor to use useForm
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const { saveRotation, isSaving } = useSaveRotation();

  const handleSave = async () => {
    try {
      await saveRotation({
        name,
        description,
      });
      setOpen(false);
      setName('');
      setDescription('');
    } catch {}
  };

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
          <Button type="submit" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
