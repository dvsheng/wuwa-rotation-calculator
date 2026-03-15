import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { isNil } from 'es-toolkit/predicate';
import { Play } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AttributeIcon } from '@/components/common/AssetIcon';
import { EntityIcon } from '@/components/common/EntityIcon';
import { TrashButton } from '@/components/common/TrashButton';
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
import { Text } from '@/components/ui/typography';
import { useRotationLibrary } from '@/hooks/useRotationLibrary';
import { useSession } from '@/lib/auth-client';
import type { SavedRotation } from '@/schemas/library';
import { calculateRotation } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import { useStore } from '@/store';
import { Attribute } from '@/types';

interface SavedRotationCardProperties {
  rotation: SavedRotation;
}

export function SavedRotationCard({ rotation }: SavedRotationCardProperties) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setTeam, setEnemy, setAttacks, setBuffs } = useStore();
  const { deleteRotation, isDeleting } = useRotationLibrary();
  const { data: session } = useSession();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleLoad = async () => {
    const toastId = toast.loading(`Loading rotation: ${rotation.name}`);

    try {
      setTeam(rotation.data.team);
      setEnemy(rotation.data.enemy);
      setAttacks(rotation.data.attacks);
      setBuffs(rotation.data.buffs);

      try {
        await queryClient.fetchQuery({
          queryKey: [
            'rotation-calculation',
            rotation.data.team,
            rotation.data.enemy,
            rotation.data.attacks,
            rotation.data.buffs,
          ],
          queryFn: () =>
            calculateRotation({
              data: {
                team: rotation.data.team,
                enemy: rotation.data.enemy,
                attacks: rotation.data.attacks,
                buffs: rotation.data.buffs,
              },
            }),
        });

        toast.success(`Loaded rotation: ${rotation.name}`, {
          id: toastId,
        });
        void navigate({ to: '/', search: { tab: 'results' } });
      } catch (error) {
        console.warn('Failed to fetch rotation results while loading build:', error);
        toast.warning(`Loaded rotation: ${rotation.name}`, {
          id: toastId,
          description:
            'Rotation data loaded, but damage results could not be calculated.',
        });
        void navigate({ to: '/', search: { tab: 'rotation' } });
      }
    } catch (error) {
      console.error('Failed to load rotation:', error);
      toast.error('Failed to load rotation.', {
        id: toastId,
      });
    }
  };

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

  const userId = session?.user.id;
  const isOwner = !isNil(userId) && userId === rotation.ownerId;
  const configuredCharacters = rotation.data.team.filter(
    (character) => character.id > 0,
  );
  const resistanceEntries = Object.values(Attribute).map((attribute) => ({
    attribute,
    value: rotation.data.enemy.resistances[attribute],
  }));
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{rotation.name}</CardTitle>
            <CardDescription>
              Last updated: {format(new Date(rotation.updatedAt), 'PPP p')}
            </CardDescription>
          </div>
          {isOwner && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <TrashButton
                  stopPropagation={false}
                  onRemove={() => setIsDeleteDialogOpen(true)}
                />
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
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Text variant="bodySm" tone="muted">
          {rotation.description || 'No description.'}
        </Text>
        <div className="mt-4 space-y-3">
          <div>
            <Text variant="overline" tone="muted" className="mb-2">
              Team
            </Text>
            {configuredCharacters.length > 0 ? (
              <div className="gap-compact flex flex-wrap items-center">
                {configuredCharacters.map((character) => (
                  <EntityIcon key={character.id} entityId={character.id} size="large" />
                ))}
              </div>
            ) : (
              <Text variant="bodySm" tone="muted">
                No characters configured.
              </Text>
            )}
          </div>

          <div>
            <Text variant="overline" tone="muted" className="mb-2">
              Enemy
            </Text>
            <div className="gap-compact mb-2 flex flex-wrap items-center">
              <Text as="span" variant="bodySm" tone="muted">
                Level: {rotation.data.enemy.level}
              </Text>
            </div>
            <div className="gap-compact flex flex-wrap items-center">
              <Text as="span" variant="bodySm" tone="muted">
                Resistances:
              </Text>
              {resistanceEntries.map(({ attribute, value }) => (
                <Badge
                  key={attribute}
                  variant="outline"
                  className="gap-compact px-compact py-tight"
                >
                  {attribute !== 'physical' && (
                    <AttributeIcon attribute={attribute} size={14} />
                  )}
                  <Text as="span" variant="caption">
                    {value}%
                  </Text>
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="gap-compact mt-4 flex flex-wrap">
          <Badge variant="outline">{rotation.data.attacks.length} Attacks</Badge>
          <Badge variant="outline">{rotation.data.buffs.length} Buffs</Badge>
          {rotation.totalDamage !== undefined && (
            <Badge variant="secondary">
              {rotation.totalDamage.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{' '}
              dmg
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="gap-compact flex justify-end">
        <Button onClick={() => void handleLoad()} size="sm">
          <Play className="mr-2 h-4 w-4" />
          Load
        </Button>
      </CardFooter>
    </Card>
  );
}
