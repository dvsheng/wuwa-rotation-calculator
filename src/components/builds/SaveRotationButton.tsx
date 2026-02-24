import { format } from 'date-fns';
import { ChevronDown, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { SaveRotationDialog } from '@/components/builds/SaveRotationDialog';
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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SavedRotation } from '@/schemas/library';
import { calculateRotation } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import { useStore } from '@/store';
import { useLibraryStore } from '@/store/libraryStore';

export function SaveRotationButton() {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [saveAction, setSaveAction] = useState<'save' | 'update'>('save');
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
          data-role="save-main"
          size="sm"
          onClick={() => setIsSaveDialogOpen(true)}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Rotation
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-role="save-menu"
              size="sm"
              className="px-2"
              aria-label="Save rotation options"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Save Action</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={saveAction}
              onValueChange={(value) => {
                const next = value as 'save' | 'update';
                setSaveAction(next);
                if (next === 'save') {
                  setIsSaveDialogOpen(true);
                  return;
                }
                if (rotations.length === 0) {
                  toast.error('No saved rotations to update.');
                  return;
                }
                setIsUpdateDialogOpen(true);
              }}
            >
              <DropdownMenuRadioItem value="save">
                Save New Rotation
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="update" disabled={rotations.length === 0}>
                Update Existing Rotation
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SaveRotationDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        trigger={false}
      />

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-130">
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
