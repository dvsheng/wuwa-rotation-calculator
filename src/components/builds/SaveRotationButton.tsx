import { format } from 'date-fns';
import { ChevronDown, Loader2, Save } from 'lucide-react';
import { Suspense, useState } from 'react';
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Row } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/typography';
import { useRotationMutations } from '@/hooks/useRotationMutations';
import { useRotations } from '@/hooks/useRotations';
import { useSession } from '@/lib/auth-client';
import type { SavedRotation } from '@/schemas/library';
import { calculateRotation } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import { useStore } from '@/store';

function UpdateExistingRotationList({
  onSelect,
  isUpdating,
}: {
  onSelect: (rotation: SavedRotation) => void;
  isUpdating: boolean;
}) {
  const ownedRotationsQuery = useRotations({
    scope: 'owned',
    offset: 0,
    limit: 20,
  });
  const ownedRotations = ownedRotationsQuery.data.items;

  return (
    <>
      {ownedRotations.map((rotation) => (
        <Button
          key={rotation.id}
          variant="outline"
          className="w-full justify-between"
          disabled={isUpdating}
          onClick={() => onSelect(rotation)}
        >
          <Text as="span" className="truncate">
            {rotation.name}
          </Text>
          <Text className="text-muted-foreground text-xs">
            {format(new Date(rotation.updatedAt), 'PPP p')}
          </Text>
        </Button>
      ))}
      {ownedRotations.length === 0 && (
        <Text variant="bodySm" tone="muted">
          No saved rotations available to update.
        </Text>
      )}
    </>
  );
}

export function SaveRotationButton() {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const { data: session } = useSession();
  const { updateRotation, isUpdating } = useRotationMutations();
  const { team, enemy, attacks, buffs } = useStore();

  const handleUpdateRotation = async (rotation: SavedRotation) => {
    // TODO: Use proper useMutation and useQuery for this
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

      await updateRotation({
        id: rotation.id,
        data: { team, enemy, attacks, buffs },
        totalDamage,
      });
      toast.success(`Updated rotation: ${rotation.name}`);
      setIsUpdateDialogOpen(false);
    } catch (error) {
      console.error('Failed to update rotation:', error);
      toast.error('Failed to update rotation.');
    }
  };

  return (
    <>
      <Row>
        <Button
          size="sm"
          className="rounded-r-none"
          onClick={() => setIsSaveDialogOpen(true)}
        >
          <Save size={14} />
          Save Rotation
        </Button>
        <Separator orientation="vertical"></Separator>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="rounded-l-none">
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setIsSaveDialogOpen(true)}>
                Save New Rotation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsUpdateDialogOpen(true)}>
                Update Existing Rotation
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Row>

      <SaveRotationDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        trigger={false}
      />
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Existing Rotation</DialogTitle>
            <DialogDescription>
              Select a saved rotation to overwrite with your current team and rotation.
            </DialogDescription>
          </DialogHeader>
          {session?.user.id ? (
            <Suspense
              fallback={
                <Row gap="inset">
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                  <Text variant="bodySm" tone="muted">
                    Loading saved rotations...
                  </Text>
                </Row>
              }
            >
              <UpdateExistingRotationList
                onSelect={(rotation) => void handleUpdateRotation(rotation)}
                isUpdating={isUpdating}
              />
            </Suspense>
          ) : (
            <Text variant="bodySm" tone="muted">
              Sign in to update a saved rotation.
            </Text>
          )}
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
