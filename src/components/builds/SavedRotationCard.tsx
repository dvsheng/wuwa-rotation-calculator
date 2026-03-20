import { format } from 'date-fns';
import { isNil } from 'es-toolkit/predicate';
import { Eye, EyeOff, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AttributeIcon } from '@/components/common/AssetIcon';
import { EntityIcon } from '@/components/common/EntityIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
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
import { Row } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { useLoadRotation } from '@/hooks/useLoadRotation';
import { useRotationMutations } from '@/hooks/useRotationMutations';
import { useSession } from '@/lib/auth-client';
import type { SavedRotation } from '@/schemas/library';
import { Attribute } from '@/types';

interface SavedRotationCardProperties {
  rotation: SavedRotation;
}

export function SavedRotationCard({ rotation }: SavedRotationCardProperties) {
  const loadRotation = useLoadRotation();
  const { deleteRotation, updateRotation, isDeleting, isUpdating } =
    useRotationMutations();
  const { data: session } = useSession();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteRotation({ id: rotation.id });
      toast.success('Rotation deleted.');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete rotation:', error);
      toast.error('Failed to delete rotation.');
    }
  };

  const handleVisibilityChange = async (
    nextVisibility: SavedRotation['visibility'],
  ) => {
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

  const userId = session?.user.id;
  const isOwner = !isNil(userId) && userId === rotation.ownerId;
  const configuredCharacters = rotation.data.team.filter(
    (character) => character.id > 0,
  );
  const resistanceEntries = Object.values(Attribute).map((attribute) => ({
    attribute,
    value: rotation.data.enemy.resistances[attribute],
  }));

  const nextVisibility = rotation.visibility === 'public' ? 'private' : 'public';
  return (
    <Card>
      <CardHeader className="relative pb-3">
        <CardTitle className="pr-20">{rotation.name}</CardTitle>
        <CardDescription>
          Last updated: {format(new Date(rotation.updatedAt), 'PPP p')}
        </CardDescription>
        {isOwner && (
          <Row gap="trim" className="absolute top-6 right-6">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isUpdating}
              aria-label={
                rotation.visibility === 'public'
                  ? 'Make rotation private'
                  : 'Make rotation public'
              }
              title={
                rotation.visibility === 'public'
                  ? 'Make rotation private'
                  : 'Make rotation public'
              }
              onClick={() => void handleVisibilityChange(nextVisibility)}
            >
              {rotation.visibility === 'public' ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </Button>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isDeleting}
                  title="Delete rotation"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the
                    rotation "{rotation.name}".
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
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
          </Row>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {rotation.description && (
          <Text variant="bodySm" tone="muted" className="line-clamp-2">
            {rotation.description}
          </Text>
        )}
        {configuredCharacters.length > 0 ? (
          <Row gap="inset" wrap>
            {configuredCharacters.map((character) => (
              <EntityIcon key={character.id} entityId={character.id} size="xlarge" />
            ))}
          </Row>
        ) : (
          <Text variant="bodySm" tone="muted">
            No characters configured.
          </Text>
        )}
        <Row gap="inset" wrap>
          <Badge variant="outline">{rotation.data.attacks.length} Attacks</Badge>
          <Badge variant="outline">{rotation.data.buffs.length} Buffs</Badge>
          <HoverCard openDelay={150} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Badge variant="outline" className="cursor-default">
                Enemy
              </Badge>
            </HoverCardTrigger>
            <HoverCardContent className="w-fit max-w-sm">
              <div className="space-y-3">
                <Text variant="label">Enemy Configuration</Text>
                <Text variant="bodySm" tone="muted">
                  Level: {rotation.data.enemy.level}
                </Text>
                <Row gap="inset" wrap>
                  {resistanceEntries.map(({ attribute, value }) => (
                    <Badge
                      key={attribute}
                      variant="outline"
                      className="gap-inset px-inset py-trim"
                    >
                      {attribute !== 'physical' && (
                        <AttributeIcon attribute={attribute} size={14} />
                      )}
                      <Text as="span" variant="caption">
                        {value}%
                      </Text>
                    </Badge>
                  ))}
                </Row>
              </div>
            </HoverCardContent>
          </HoverCard>
          {rotation.totalDamage !== undefined && (
            <Badge variant="secondary">
              {rotation.totalDamage.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{' '}
              dmg
            </Badge>
          )}
        </Row>
      </CardContent>
      <CardFooter className="justify-end pt-0">
        <Button onClick={() => void loadRotation(rotation)} size="sm">
          <Play className="mr-2 h-4 w-4" />
          Load
        </Button>
      </CardFooter>
    </Card>
  );
}
