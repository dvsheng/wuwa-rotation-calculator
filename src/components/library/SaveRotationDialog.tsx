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
import { useStore } from '@/store';
import { useLibraryStore } from '@/store/libraryStore';

export function SaveRotationDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { team, enemy, attacks, buffs } = useStore();
  const addRotation = useLibraryStore((state) => state.addRotation);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a name for the rotation.');
      return;
    }

    try {
      addRotation(
        name,
        {
          team,
          enemy,
          attacks,
          buffs,
        },
        description,
      );
      toast.success('Rotation saved successfully!');
      setOpen(false);
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to save rotation:', error);
      toast.error('Failed to save rotation.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Save Current Rotation</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
