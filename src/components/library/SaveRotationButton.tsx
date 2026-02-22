import { format } from 'date-fns';
import { ChevronDown, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { SaveRotationDialog } from '@/components/library/SaveRotationDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SavedRotation } from '@/schemas/library';
import { calculateRotation } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import { useStore } from '@/store';
import { useLibraryStore } from '@/store/libraryStore';

export function SaveRotationButton() {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isUpdatingRotationId, setIsUpdatingRotationId] = useState<string>();
  const rotations = useLibraryStore((state) => state.rotations);
  const updateRotation = useLibraryStore((state) => state.updateRotation);
  const { team, enemy, attacks, buffs } = useStore();

  const sortedRotations = rotations.toSorted((a, b) => b.updatedAt - a.updatedAt);

  const handleUpdateRotation = async (rotation: SavedRotation) => {
    setIsUpdatingRotationId(rotation.id);

    try {
      let totalDamage: number | undefined;
      try {
        const result = await calculateRotation({
          data: { team, enemy, attacks, buffs },
        });
        totalDamage = result.totalDamage;
      } catch {
        // best-effort
      }

      updateRotation(rotation.id, {
        data: { team, enemy, attacks, buffs },
        totalDamage,
      });
      toast.success(`Updated rotation: ${rotation.name}`);
      setIsUpdateDialogOpen(false);
    } catch (error) {
      console.error('Failed to update rotation:', error);
      toast.error('Failed to update rotation.');
    } finally {
      setIsUpdatingRotationId(undefined);
    }
  };

  return (
    <>
      <div className="flex items-center">
        <Button
          size="sm"
          className="rounded-r-none"
          onClick={() => setIsSaveDialogOpen(true)}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Rotation
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="rounded-l-none border-l border-l-white/30 px-2"
              aria-label="Save rotation options"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                if (rotations.length === 0) {
                  toast.error('No saved rotations to update.');
                  return;
                }
                setIsUpdateDialogOpen(true);
              }}
            >
              Update Existing Rotation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SaveRotationDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        trigger={false}
      />

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Update Existing Rotation</DialogTitle>
            <DialogDescription>
              Select a saved rotation to overwrite with your current team and rotation.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {sortedRotations.map((rotation) => (
              <Button
                key={rotation.id}
                variant="outline"
                className="h-auto w-full justify-between py-3 text-left"
                disabled={isUpdatingRotationId !== undefined}
                onClick={() => void handleUpdateRotation(rotation)}
              >
                <span className="truncate">{rotation.name}</span>
                <span className="text-muted-foreground text-xs">
                  {format(new Date(rotation.updatedAt), 'PPP p')}
                </span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
