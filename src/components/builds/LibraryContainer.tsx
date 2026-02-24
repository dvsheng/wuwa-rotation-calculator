import { Library } from 'lucide-react';

import { SavedRotationCard } from '@/components/builds/SavedRotationCard';
import { SaveRotationDialog } from '@/components/builds/SaveRotationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/typography';
import { useLibraryStore } from '@/store/libraryStore';

export function LibraryContainer() {
  const rotations = useLibraryStore((state) => state.rotations);

  return (
    <div className="container mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Library className="h-6 w-6" />
          <h2 className="text-2xl font-bold tracking-tight">Library</h2>
        </div>
        <SaveRotationDialog />
      </div>

      {rotations.length === 0 ? (
        <Card className="animate-in fade-in-50 border-dashed">
          <CardHeader className="items-center text-center">
            <div className="bg-muted/50 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
              <Library className="h-10 w-10 opacity-20" />
            </div>
            <CardTitle>No saved rotations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <Text className="text-muted-foreground text-sm">
              Save your current configuration to see it here.
            </Text>
            <SaveRotationDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {rotations
            .toSorted((a, b) => b.updatedAt - a.updatedAt)
            .map((rotation) => (
              <SavedRotationCard key={rotation.id} rotation={rotation} />
            ))}
        </div>
      )}
    </div>
  );
}
