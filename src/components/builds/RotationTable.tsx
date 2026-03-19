import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Play,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { EntityIcon } from '@/components/common/EntityIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { useLoadRotation } from '@/hooks/useLoadRotation';
import { useRotationMutations } from '@/hooks/useRotationMutations';
import type { ListedRotation, SavedRotation } from '@/schemas/library';

interface RotationTableProperties {
  title: string;
  description: string;
  rotations: Array<SavedRotation | ListedRotation>;
  showOwnerActions: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  emptyMessage: string;
  totalLabel?: string;
  hasNextPage?: boolean;
  isPreviousData?: boolean;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
}

function RotationDetailsHoverCard({
  rotation,
}: {
  rotation: SavedRotation | ListedRotation;
}) {
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`View details for ${rotation.name}`}
          title={`View details for ${rotation.name}`}
        >
          <Info className="size-4" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80">
        <Stack gap="component">
          <Stack gap="trim">
            <Text variant="title">{rotation.name}</Text>
            <Stack gap="none">
              <Text variant="caption" tone="muted">
                Total Damage
              </Text>
              <Text variant="stat" tabular>
                {rotation.totalDamage?.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                }) ?? 'Not calculated'}
              </Text>
            </Stack>
            <Text variant="bodySm" tone="muted">
              {rotation.description || 'No description.'}
            </Text>
          </Stack>
          <Row gap="inset" wrap>
            <Badge variant="outline">
              {rotation.visibility === 'public' ? 'Public' : 'Private'}
            </Badge>
            <Badge variant="outline">{rotation.data.attacks.length} Attacks</Badge>
            <Badge variant="outline">{rotation.data.buffs.length} Buffs</Badge>
          </Row>
          <Stack gap="trim">
            <Text variant="bodySm">
              <Text as="span" variant="label">
                Created:{' '}
              </Text>
              {format(new Date(rotation.createdAt), 'PPP p')}
            </Text>
            <Text variant="bodySm">
              <Text as="span" variant="label">
                Updated:{' '}
              </Text>
              {format(new Date(rotation.updatedAt), 'PPP p')}
            </Text>
          </Stack>
        </Stack>
      </HoverCardContent>
    </HoverCard>
  );
}

export function RotationTable({
  title,
  description,
  rotations,
  showOwnerActions,
  isLoading = false,
  isFetching = false,
  emptyMessage,
  totalLabel,
  hasNextPage = false,
  isPreviousData = false,
  onPreviousPage,
  onNextPage,
}: RotationTableProperties) {
  const loadRotation = useLoadRotation();
  const { deleteRotation, updateRotation, isDeleting, isUpdating } =
    useRotationMutations();
  const [rotationPendingDeletion, setRotationPendingDeletion] = useState<
    SavedRotation | undefined
  >();

  const handleVisibilityChange = async (rotation: SavedRotation | ListedRotation) => {
    const nextVisibility = rotation.visibility === 'public' ? 'private' : 'public';

    try {
      await updateRotation({
        id: rotation.id,
        visibility: nextVisibility,
      });
      toast.success(
        nextVisibility === 'public'
          ? 'Rotation is now public.'
          : 'Rotation is now private.',
      );
    } catch (error) {
      console.error('Failed to update rotation visibility:', error);
      toast.error('Failed to update rotation visibility.');
    }
  };

  const handleDelete = async () => {
    if (!rotationPendingDeletion) {
      return;
    }

    try {
      await deleteRotation({ id: rotationPendingDeletion.id });
      toast.success('Rotation deleted.');
      setRotationPendingDeletion(undefined);
    } catch (error) {
      console.error('Failed to delete rotation:', error);
      toast.error('Failed to delete rotation.');
    }
  };

  const columns: Array<ColumnDef<SavedRotation | ListedRotation>> = [
    {
      id: 'team',
      header: 'Team',
      cell: ({ row }) => {
        const configuredCharacters = row.original.data.team
          .filter((character) => character.id > 0)
          .slice(0, 3);

        return (
          <Row gap="inset" className="min-w-0">
            <RotationDetailsHoverCard rotation={row.original} />
            {configuredCharacters.length > 0 ? (
              <Row gap="inset">
                {configuredCharacters.map((character) => (
                  <EntityIcon key={character.id} entityId={character.id} size="large" />
                ))}
              </Row>
            ) : (
              <Text variant="caption" tone="muted">
                No team
              </Text>
            )}
          </Row>
        );
      },
      meta: {
        headerClassName: 'w-52',
        cellClassName: 'w-52',
      },
    },
    {
      accessorKey: 'totalDamage',
      header: 'Damage',
      cell: ({ row }) => (
        <Text variant="bodySm" tabular>
          {row.original.totalDamage?.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          }) ?? 'Not calculated'}
        </Text>
      ),
      meta: {
        headerClassName: 'w-40',
        cellClassName: 'w-40',
      },
    },
    {
      accessorKey: 'name',
      header: 'Rotation',
      cell: ({ row }) => (
        <Text variant="bodySm" className="font-medium">
          {row.original.name}
        </Text>
      ),
      meta: {
        cellClassName: 'min-w-56',
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Row gap="trim" className="justify-end">
          {showOwnerActions && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isUpdating}
                aria-label={
                  row.original.visibility === 'public'
                    ? 'Make rotation private'
                    : 'Make rotation public'
                }
                onClick={() => void handleVisibilityChange(row.original)}
              >
                {row.original.visibility === 'public' ? (
                  <Eye className="size-4" />
                ) : (
                  <EyeOff className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isDeleting}
                aria-label="Delete rotation"
                onClick={() =>
                  setRotationPendingDeletion(row.original as SavedRotation)
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
          <Button size="sm" onClick={() => void loadRotation(row.original)}>
            <Play className="size-4" />
            Load
          </Button>
        </Row>
      ),
      meta: {
        headerClassName: showOwnerActions ? 'w-56' : 'w-24',
        cellClassName: showOwnerActions ? 'w-56' : 'w-24',
      },
    },
  ];

  return (
    <>
      <Stack gap="component">
        <Stack gap="trim">
          <Text as="h3" variant="heading">
            {title}
          </Text>
          <Text variant="bodySm" tone="muted">
            {description}
          </Text>
        </Stack>

        <DataTable
          columns={columns}
          data={rotations}
          emptyMessage={isLoading ? `Loading ${title.toLowerCase()}...` : emptyMessage}
          classNames={{
            wrapper: 'overflow-hidden',
            cell: 'py-3 align-middle',
          }}
        />

        {(totalLabel || onPreviousPage || onNextPage) && (
          <Row justify="between" wrap className="gap-component">
            <Text variant="bodySm" tone="muted">
              {isFetching && !isLoading ? 'Updating results...' : totalLabel}
            </Text>
            {(onPreviousPage || onNextPage) && (
              <Row gap="inset">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!onPreviousPage || isFetching}
                  onClick={onPreviousPage}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasNextPage || !onNextPage || isFetching || isPreviousData}
                  onClick={onNextPage}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </Row>
            )}
          </Row>
        )}
      </Stack>

      <Dialog
        open={rotationPendingDeletion !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setRotationPendingDeletion(undefined);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the rotation "
              {rotationPendingDeletion?.name}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRotationPendingDeletion(undefined)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
