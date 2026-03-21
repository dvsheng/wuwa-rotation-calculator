import { Link, useLocation } from '@tanstack/react-router';
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
import { toast } from 'sonner';

import { EntityIcon } from '@/components/common/EntityIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Row, Stack } from '@/components/ui/layout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { useLoadRotation } from '@/hooks/useLoadRotation';
import { useRotationMutations } from '@/hooks/useRotationMutations';
import { useSession } from '@/lib/auth-client';
import type { ListedRotation, SavedRotation } from '@/schemas/library';

interface RotationTableProperties {
  title: string;
  description: string;
  rotations: Array<ListedRotation>;
  showOwnerActions: boolean;
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

function RotationVisibilityButton({
  isDisabled,
  onClick,
  visibility,
}: {
  isDisabled: boolean;
  onClick: () => void;
  visibility: ListedRotation['visibility'];
}) {
  const currentLocation = useLocation();
  const buttonLabel =
    visibility === 'public' ? 'Make rotation private' : 'Make rotation public';
  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isDisabled}
      aria-label={buttonLabel}
      title={buttonLabel}
      onClick={onClick}
    >
      {visibility === 'public' ? <Eye /> : <EyeOff />}
    </Button>
  );

  if (!isDisabled) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" tabIndex={0}>
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <Stack gap="trim">
          <Text variant="caption">
            Choose a username before making rotations public.
          </Text>
          <Link
            to="/auth/$authView"
            params={{ authView: 'complete-profile' }}
            search={{ redirectTo: currentLocation.href }}
            className="text-xs underline underline-offset-2"
          >
            Finish configuring your account
          </Link>
        </Stack>
      </TooltipContent>
    </Tooltip>
  );
}

const DeleteRotationButton = ({
  deleteRotation,
  isDeleting,
  rotation,
}: {
  deleteRotation: (input: { id: number }) => Promise<unknown>;
  isDeleting: boolean;
  rotation: ListedRotation;
}) => {
  const handleDelete = async () => {
    try {
      await deleteRotation({ id: rotation.id });
      toast.success('Rotation deleted.');
    } catch {
      toast.error('Failed to delete rotation.');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={isDeleting}>
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the rotation "
            {rotation.name}".
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
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
  );
};

export function RotationTable({
  title,
  description,
  rotations,
  showOwnerActions,
  emptyMessage,
  hasNextPage = false,
  isPreviousData = false,
  onPreviousPage,
  onNextPage,
}: RotationTableProperties) {
  const loadRotation = useLoadRotation();
  const { deleteRotation, updateRotation, isDeleting, isUpdating } =
    useRotationMutations();
  const { data: session } = useSession();

  const handleVisibilityChange = async (rotation: SavedRotation | ListedRotation) => {
    const nextVisibility = rotation.visibility === 'public' ? 'private' : 'public';
    try {
      await updateRotation({
        id: rotation.id,
        visibility: nextVisibility,
      });
      toast.success(`Rotation is now ${nextVisibility}.`);
    } catch {
      toast.error('Failed to update rotation visibility.');
    }
  };

  const columns: Array<ColumnDef<ListedRotation>> = [
    {
      id: 'team',
      header: 'Team',
      cell: ({ row }) => {
        const configuredCharacters = row.original.data.team;
        return (
          <Row>
            <RotationDetailsHoverCard rotation={row.original} />
            <Row>
              {configuredCharacters.map((character) => (
                <EntityIcon
                  key={character.id}
                  entityId={character.id}
                  size="medium"
                  className="shrink-0"
                />
              ))}
            </Row>
          </Row>
        );
      },
      meta: { headerClassName: 'w-[30%]', cellClassName: 'w-[30%]' },
    },
    {
      accessorKey: 'totalDamage',
      header: 'Damage',
      cell: ({ row }) => (
        <Text variant="bodySm" tabular className="font-mono whitespace-nowrap">
          {row.original.totalDamage?.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          }) ?? 'Not calculated'}
        </Text>
      ),
      meta: { headerClassName: 'w-[15%]', cellClassName: 'w-[15%]' },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Text variant="bodySm" className="block truncate">
          {row.original.name}
        </Text>
      ),
      meta: { headerClassName: 'w-[25%]', cellClassName: 'w-[25%]' },
    },
    {
      id: 'context',
      header: showOwnerActions ? 'Status' : 'Owner',
      cell: ({ row }) => {
        if (showOwnerActions) {
          return (
            <Text className="block truncate">
              {row.original.visibility === 'public' ? 'Public' : 'Private'}
            </Text>
          );
        }
        return (
          <Text variant="bodySm" className="block truncate">
            {row.original.ownerName}
          </Text>
        );
      },
      meta: { headerClassName: 'w-[10%]', cellClassName: 'w-[10%]' },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <Row justify="end" gap="inset">
            {showOwnerActions && (
              <>
                {!session?.user.isAnonymous && (
                  <RotationVisibilityButton
                    visibility={row.original.visibility}
                    isDisabled={!session?.user.username || isUpdating}
                    onClick={() => handleVisibilityChange(row.original)}
                  />
                )}
                <DeleteRotationButton
                  rotation={row.original}
                  deleteRotation={deleteRotation}
                  isDeleting={isDeleting}
                />
              </>
            )}
            <Button size="sm" onClick={() => loadRotation(row.original)}>
              <Play />
              Load
            </Button>
          </Row>
        );
      },
      meta: {
        headerClassName: 'w-[20%] text-right',
        cellClassName: 'w-[20%] text-right',
      },
    },
  ];

  return (
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
        emptyMessage={emptyMessage}
        classNames={{
          wrapper: 'bg-card',
        }}
      />

      {(onPreviousPage || onNextPage) && (
        <Row justify="between" gap="component" wrap>
          <Button
            variant="outline"
            size="sm"
            disabled={!onPreviousPage}
            onClick={onPreviousPage}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage || !onNextPage || isPreviousData}
            onClick={onNextPage}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </Row>
      )}
    </Stack>
  );
}
