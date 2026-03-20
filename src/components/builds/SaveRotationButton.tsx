import { format } from 'date-fns';
import { ChevronDown, Save } from 'lucide-react';
import { Suspense, useState } from 'react';

import { SaveRotationDialog } from '@/components/builds/SaveRotationDialog';
import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
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
import { Row } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { useRotations } from '@/hooks/useRotations';
import { useSaveRotation } from '@/hooks/useSaveRotation';
import { useSession } from '@/lib/auth-client';
import type { SavedRotation } from '@/schemas/library';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '../ui/item';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

function UpdateExistingRotationList({ onUpdated }: { onUpdated: () => void }) {
  const { saveRotation, isSaving } = useSaveRotation();
  const { data } = useRotations({
    scope: 'owned',
    offset: 0,
    limit: 20,
  });

  const handleUpdateRotation = async (rotation: SavedRotation) => {
    if (isPending) {
      return;
    }
    try {
      await saveRotation({
        rotationId: rotation.id,
        name: rotation.name,
        description: rotation.description,
      });
      onUpdated();
    } catch {}
  };

  const rotations = data.items;
  const isPending = isSaving;
  return (
    <Suspense
      fallback={<LoadingSpinnerContainer message="Loading saved rotations..." />}
    >
      {rotations.length === 0 ? (
        <Text variant="bodySm" tone="muted">
          No saved rotations available to update.
        </Text>
      ) : (
        <ItemGroup>
          {rotations.map((rotation) => (
            <Item variant="outline">
              <ItemContent>
                <ItemTitle>{rotation.name}</ItemTitle>
                <ItemDescription>
                  {format(new Date(rotation.createdAt), 'PPP p')}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  key={rotation.id}
                  disabled={isPending}
                  onClick={() => handleUpdateRotation(rotation)}
                >
                  Update Rotation
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}
    </Suspense>
  );
}

const SaveRotationActions = ({
  isLoggedIn,
  onSaveNew,
  onUpdateExisting,
}: {
  isLoggedIn: boolean;
  onSaveNew: () => void;
  onUpdateExisting: () => void;
}) => (
  <Row>
    <Button
      size="sm"
      className="rounded-r-none border-r-0"
      onClick={onSaveNew}
      disabled={!isLoggedIn}
    >
      <Save className="mr-1 h-4 w-4" />
      Save Rotation
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="rounded-l-none px-2" disabled={!isLoggedIn}>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onUpdateExisting}>
          Update Existing Rotation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </Row>
);

const UpdateRotationDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Update Existing Rotation</DialogTitle>
        <DialogDescription>
          Select a saved rotation to overwrite with your current team and rotation.
        </DialogDescription>
      </DialogHeader>
      <UpdateExistingRotationList onUpdated={() => onOpenChange(false)} />
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const SaveRotationButton = () => {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const { data: session } = useSession();

  const isLoggedIn = session?.user.id !== undefined;
  return (
    <>
      {isLoggedIn ? (
        <SaveRotationActions
          isLoggedIn={isLoggedIn}
          onSaveNew={() => setIsSaveDialogOpen(true)}
          onUpdateExisting={() => setIsUpdateDialogOpen(true)}
        />
      ) : (
        <Tooltip>
          <TooltipTrigger>
            <SaveRotationActions
              isLoggedIn={isLoggedIn}
              onSaveNew={() => setIsSaveDialogOpen(true)}
              onUpdateExisting={() => setIsUpdateDialogOpen(true)}
            />
          </TooltipTrigger>
          <TooltipContent>Log in to save or update a rotation.</TooltipContent>
        </Tooltip>
      )}
      <SaveRotationDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen} />
      <UpdateRotationDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
      />
    </>
  );
};
