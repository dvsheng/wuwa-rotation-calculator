import { useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Play, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { GameImage } from '@/components/common/GameImage';
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
import type { SavedRotation } from '@/schemas/library';
import { calculateRotation } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import { useStore } from '@/store';
import { useLibraryStore } from '@/store/libraryStore';
import { Attribute } from '@/types';

interface SavedRotationCardProperties {
  rotation: SavedRotation;
}

export function SavedRotationCard({ rotation }: SavedRotationCardProperties) {
  const navigate = useNavigate();
  const { setTeam, setEnemy, setAttacks, setBuffs } = useStore();
  const deleteRotation = useLibraryStore((state) => state.deleteRotation);
  const updateRotation = useLibraryStore((state) => state.updateRotation);
  const { team, enemy, attacks, buffs } = useStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOverwriteDialogOpen, setIsOverwriteDialogOpen] = useState(false);
  const configuredCharacters = rotation.data.team.filter(
    (character) => character.id > 0,
  );
  const resistanceEntries = Object.values(Attribute).map((attribute) => ({
    attribute,
    value: rotation.data.enemy.resistances[attribute],
  }));

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

  const handleDelete = () => {
    deleteRotation(rotation.id);
    toast.success('Rotation deleted.');
    setIsDeleteDialogOpen(false);
  };

  const handleOverwrite = async () => {
    let totalDamage: number | undefined;
    try {
      const result = await calculateRotation({ data: { team, enemy, attacks, buffs } });
      totalDamage = result.totalDamage;
    } catch {
      // best-effort
    }
    updateRotation(rotation.id, { data: { team, enemy, attacks, buffs }, totalDamage });
    toast.success(`Overwrote rotation: ${rotation.name}`);
    setIsOverwriteDialogOpen(false);
  };

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
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          {rotation.description || 'No description.'}
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Team
            </p>
            {configuredCharacters.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {configuredCharacters.map((character) => (
                  <GameImage
                    key={character.id}
                    entity="character"
                    type="icon"
                    id={character.id}
                    alt={`Character ${character.id}`}
                    title={`Character ID: ${character.id}`}
                    className="h-16 w-16 rounded-full border object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No characters configured.</p>
            )}
          </div>

          <div>
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Enemy
            </p>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Level: {rotation.data.enemy.level}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">Resistances:</span>
              {resistanceEntries.map(({ attribute, value }) => (
                <Badge key={attribute} variant="outline" className="gap-1.5 px-2 py-1">
                  <GameImage
                    entity="attribute"
                    type="icon"
                    id={attribute}
                    alt={attribute}
                    className="h-3.5 w-3.5 object-contain"
                  />
                  <span>{value}%</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
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
      <CardFooter className="flex justify-end gap-2">
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
              <Button variant="outline" onClick={() => setIsOverwriteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleOverwrite}>Overwrite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button onClick={handleLoad} size="sm">
          <Play className="mr-2 h-4 w-4" />
          Load
        </Button>
      </CardFooter>
    </Card>
  );
}
