import { Library } from 'lucide-react';

import { SavedRotationCard } from '@/components/builds/SavedRotationCard';
import { SaveRotationDialog } from '@/components/builds/SaveRotationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid, Row, Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { useRotationLibrary } from '@/hooks/useRotationLibrary';

export function LibraryContainer() {
  const { rotations } = useRotationLibrary();

  return (
    <Stack className="p-page gap-page h-full w-full">
      <Row gap="inset">
        <Library className="size-6" />
        <Text as="h2" variant="heading">
          Library
        </Text>
      </Row>
      <ScrollArea className="min-h-0 flex-1">
        {rotations.length === 0 ? (
          <Card>
            <CardHeader className="items-center text-center">
              <Row gap="component">
                <Library className="h-10 w-10 opacity-20" />
                <CardTitle>No saved rotations</CardTitle>
              </Row>
            </CardHeader>
            <CardContent className="gap-panel flex flex-col items-center text-center">
              <Text variant="bodySm" tone="muted">
                Save your current configuration to see it here.
              </Text>
              <SaveRotationDialog />
            </CardContent>
          </Card>
        ) : (
          <Grid className="gap-page lg:grid-cols-2">
            {rotations
              .toSorted((a, b) => b.updatedAt.getDate() - a.updatedAt.getDate())
              .map((rotation) => (
                <SavedRotationCard key={rotation.id} rotation={rotation} />
              ))}
          </Grid>
        )}
      </ScrollArea>
    </Stack>
  );
}
