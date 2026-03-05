import { Library } from 'lucide-react';

import { SavedRotationCard } from '@/components/builds/SavedRotationCard';
import { SaveRotationDialog } from '@/components/builds/SaveRotationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BodyText } from '@/components/ui/typography';
import { useLibraryStore } from '@/store/libraryStore';

export function LibraryContainer() {
  const rotations = useLibraryStore((state) => state.rotations);

  return (
    <div className="container mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="gap-compact flex items-center">
          <Library className="h-6 w-6" />
          <h2 className="text-2xl font-bold tracking-tight">Library</h2>
        </div>
      </div>

      {rotations.length === 0 ? (
        <Card className="animate-in fade-in-50 border-dashed">
          <CardHeader className="items-center text-center">
            <div className="bg-muted/50 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
              <Library className="h-10 w-10 opacity-20" />
            </div>
            <CardTitle>No saved rotations</CardTitle>
          </CardHeader>
          <CardContent className="gap-panel flex flex-col items-center text-center">
            <BodyText className="text-muted-foreground text-sm">
              Save your current configuration to see it here.
            </BodyText>
            <SaveRotationDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="gap-page grid lg:grid-cols-2">
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
