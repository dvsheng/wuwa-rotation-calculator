import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useCapabilityActions } from '@/hooks/useCapabilities';
import type { Capability } from '@/services/game-data';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface DeleteCapabilityButtonProperties {
  capability: Capability;
}

export const DeleteCapabilityButton = ({
  capability,
}: DeleteCapabilityButtonProperties) => {
  const [open, setOpen] = useState(false);
  const { deleteCapability, isDeleting } = useCapabilityActions(capability.entityId);

  const handleDelete = async () => {
    try {
      await deleteCapability({ capabilityId: capability.id });
      toast.success('Capability deleted.');
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete capability.');
    }
  };

  const trigger = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Delete capability"
          onClick={() => setOpen(true)}
        >
          <Trash2 />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Delete capability</TooltipContent>
    </Tooltip>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete capability?</DialogTitle>
          <DialogDescription>
            This will permanently remove{' '}
            {capability.name || `capability #${capability.id}`}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete capability'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
