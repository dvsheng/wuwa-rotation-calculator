import { Library } from 'lucide-react';

import { SavedRotationCard } from '@/components/builds/SavedRotationCard';
import { SaveRotationDialog } from '@/components/builds/SaveRotationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/typography';
import { useRotationLibrary } from '@/hooks/useRotationLibrary';

export function LibraryContainer() {
  const { rotations, isLoading, error } = useRotationLibrary();

  return (
    <div className="container mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="gap-compact flex items-center">
          <Library className="h-6 w-6" />
          <Text as="h2" variant="heading" className="font-bold">
            Library
          </Text>
        </div>
      </div>

      {isLoading ? (
        <Card className="border-dashed">
          <CardContent className="py-page text-center">
            <Text variant="small">Loading saved rotations...</Text>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-dashed">
          <CardContent className="py-page text-center">
            <Text variant="small" className="text-destructive">
              Failed to load saved rotations.
            </Text>
          </CardContent>
        </Card>
      ) : rotations.length === 0 ? (
        <Card className="animate-in fade-in-50 border-dashed">
          <CardHeader className="items-center text-center">
            <div className="bg-muted/50 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
              <Library className="h-10 w-10 opacity-20" />
            </div>
            <CardTitle>No saved rotations</CardTitle>
          </CardHeader>
          <CardContent className="gap-panel flex flex-col items-center text-center">
            <Text variant="small">Save your current configuration to see it here.</Text>
            <SaveRotationDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="gap-page grid lg:grid-cols-2">
          {rotations
            .toSorted((a, b) => b.updatedAt.getDate() - a.updatedAt.getDate())
            .map((rotation) => (
              <SavedRotationCard key={rotation.id} rotation={rotation} />
            ))}
        </div>
      )}
    </div>
  );
}
