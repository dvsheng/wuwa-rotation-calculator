import { Library } from 'lucide-react';

import { SavedRotationCard } from '@/components/library/SavedRotationCard';
import { SaveRotationDialog } from '@/components/library/SaveRotationDialog';
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
        <div className="animate-in fade-in-50 flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="bg-muted/50 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
            <Library className="h-10 w-10 opacity-20" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No saved rotations</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Save your current configuration to see it here.
          </p>
          <SaveRotationDialog />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
