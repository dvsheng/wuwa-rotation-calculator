import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useCapabilityActions } from '@/hooks/useCapabilities';
import { useEntitySkills } from '@/hooks/useEntities';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

import { CapabilityForm } from './CapabilityForm';
import type { CapabilityFormValue } from './CapabilityForm';

export const CreateCapabilityDialog = ({ entityId }: { entityId: number }) => {
  const [open, setOpen] = useState(false);
  const { data: skills } = useEntitySkills(entityId);
  const { createCapability, isCreating } = useCapabilityActions(entityId);

  const handleCreate = async ({
    capabilityJson,
    description,
    name,
    skillId,
  }: CapabilityFormValue) => {
    if (!skillId) {
      return;
    }

    try {
      await createCapability({
        capabilityJson,
        description,
        name,
        skillId,
      });
      toast.success('Capability created.');
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create capability.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={skills.length === 0}
      >
        <Plus />
        Create capability
      </Button>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create capability</DialogTitle>
          <DialogDescription>
            Add a new capability to one of this entity&apos;s skills.
          </DialogDescription>
        </DialogHeader>
        <CapabilityForm
          key={`create-${open ? 'open' : 'closed'}`}
          mode="create"
          skills={skills}
          isSubmitting={isCreating}
          onCancel={() => setOpen(false)}
          onSubmit={handleCreate}
          submitLabel={isCreating ? 'Creating...' : 'Create capability'}
        />
      </DialogContent>
    </Dialog>
  );
};
