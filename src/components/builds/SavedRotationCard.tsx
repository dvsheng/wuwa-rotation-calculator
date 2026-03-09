import { useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { isNil } from 'es-toolkit/predicate';
import { Play, Save } from 'lucide-react';
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
  const navigate = useNavigate();
  const { setTeam, setEnemy, setAttacks, setBuffs } = useStore();
  const { deleteRotation, updateRotation, isDeleting, isUpdating } =
    useRotationLibrary();
  const { data: session } = useSession();
  const { team, enemy, attacks, buffs } = useStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOverwriteDialogOpen, setIsOverwriteDialogOpen] = useState(false);

  const handleLoad = () => {
    try {
      setTeam(rotation.data.team);
      setEnemy(rotation.data.enemy);
      setAttacks(rotation.data.attacks);
      setBuffs(rotation.data.buffs);
      toast.success(`Loaded rotation: ${rotation.name}`);
      void navigate({ to: '/' });
    } catch (error) {
      console.error('Failed to load rotation:', error);
      toast.error('Failed to load rotation.');
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

  const handleOverwrite = async () => {
    let totalDamage: number | undefined;
    try {
      const result = await calculateRotation({ data: { team, enemy, attacks, buffs } });
      totalDamage = result.totalDamage;
    } catch {
      // best-effort
    }
    try {
      await updateRotation({
        id: rotation.id,
        data: { team, enemy, attacks, buffs },
        totalDamage,
      });
      toast.success(`Overwrote rotation: ${rotation.name}`);
      setIsOverwriteDialogOpen(false);
    } catch (error) {
      console.error('Failed to overwrite rotation:', error);
      toast.error('Failed to overwrite rotation.');
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
        <Text variant="small">{rotation.description || 'No description.'}</Text>
        <div className="mt-4 space-y-3">
          <div>
            <Text variant="overline" className="mb-2">
              Team
            </Text>
            {configuredCharacters.length > 0 ? (
              <div className="gap-compact flex flex-wrap items-center">
                {configuredCharacters.map((character) => (
                  <EntityIcon key={character.id} entityId={character.id} size="large" />
                ))}
              </div>
            ) : (
              <Text variant="small">No characters configured.</Text>
            )}
          </div>

          <div>
            <Text variant="overline" className="mb-2">
              Enemy
            </Text>
            <div className="gap-compact mb-2 flex flex-wrap items-center">
              <Text as="span" variant="small">
                Level: {rotation.data.enemy.level}
              </Text>
            </div>
            <div className="gap-compact flex flex-wrap items-center">
              <Text as="span" variant="small">
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
                  <Text as="span" variant="caption" className="text-foreground">
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
        {isOwner && (
          <Dialog open={isOverwriteDialogOpen} onOpenChange={setIsOverwriteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="mr-2 h-4 w-4" />
                Overwrite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Overwrite rotation?</DialogTitle>
                <DialogDescription>
                  This will replace the saved data in "{rotation.name}" with the current
                  rotation.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsOverwriteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => void handleOverwrite()} disabled={isUpdating}>
                  Overwrite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Button onClick={handleLoad} size="sm">
          <Play className="mr-2 h-4 w-4" />
          Load
        </Button>
      </CardFooter>
    </Card>
  );
}
