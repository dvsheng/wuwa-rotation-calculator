import { format } from 'date-fns';
import { Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { useStore } from '@/store';
import { useLibraryStore } from '@/store/libraryStore';

interface SavedRotationCardProperties {
  rotation: SavedRotation;
}

export function SavedRotationCard({ rotation }: SavedRotationCardProperties) {
  const { setTeam, setEnemy, setAttacks, setBuffs } = useStore();
  const deleteRotation = useLibraryStore((state) => state.deleteRotation);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleLoad = () => {
    try {
      setTeam(rotation.data.team);
      setEnemy(rotation.data.enemy);
      setAttacks(rotation.data.attacks);
      setBuffs(rotation.data.buffs);
      toast.success(`Loaded rotation: ${rotation.name}`);
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
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          {rotation.description || 'No description.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">{rotation.data.team.length} Characters</Badge>
          <Badge variant="outline">{rotation.data.attacks.length} Attacks</Badge>
          <Badge variant="outline">{rotation.data.buffs.length} Buffs</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the rotation
                "{rotation.name}".
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

        <Button onClick={handleLoad} size="sm">
          <Play className="mr-2 h-4 w-4" />
          Load
        </Button>
      </CardFooter>
    </Card>
  );
}
