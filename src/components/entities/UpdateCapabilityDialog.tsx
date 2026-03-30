import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useCapabilityActions } from '@/hooks/useCapabilities';
import type { Capability } from '@/services/game-data';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

import { CapabilityForm } from './CapabilityForm';
import type { CapabilityFormValue } from './CapabilityForm';

interface UpdateCapabilityDialogProperties {
  capability: Capability;
}

export const UpdateCapabilityDialog = ({
  capability,
}: UpdateCapabilityDialogProperties) => {
  const [open, setOpen] = useState(false);
  const { isUpdating, updateCapability } = useCapabilityActions(capability.entityId);

  const handleUpdate = async ({
    capabilityJson,
    description,
    name,
  }: CapabilityFormValue) => {
    try {
      await updateCapability({
        capabilityId: capability.id,
        capabilityJson,
        description,
        name,
      });
      toast.success('Capability updated.');
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update capability.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild size="icon-sm" variant="outline">
            <DialogTrigger type="button" onClick={() => setOpen(true)}>
              <Pencil />
            </DialogTrigger>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit capability</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Update capability</DialogTitle>
          <DialogDescription>
            Edit {capability.name || `capability #${capability.id}`}.
          </DialogDescription>
        </DialogHeader>
        <CapabilityForm
          key={`${capability.id}-${open ? 'open' : 'closed'}`}
          mode="update"
          initialValues={{
            capabilityJson: capability.capabilityJson,
            description: capability.description,
            name: capability.name,
            skillId: capability.skillId,
          }}
          isSubmitting={isUpdating}
          onCancel={() => setOpen(false)}
          onSubmit={handleUpdate}
          submitLabel={isUpdating ? 'Saving...' : 'Save changes'}
        />
      </DialogContent>
    </Dialog>
  );
};
