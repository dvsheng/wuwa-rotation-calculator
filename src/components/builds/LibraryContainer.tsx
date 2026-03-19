import { Check, ChevronsUpDown, Library } from 'lucide-react';
import { useState } from 'react';

import { RotationTable } from '@/components/builds/RotationTable';
import { SaveRotationDialog } from '@/components/builds/SaveRotationDialog';
import { EntityIcon } from '@/components/common/EntityIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Row, Stack } from '@/components/ui/layout';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { useEntityList } from '@/hooks/useEntityList';
import { useRotations } from '@/hooks/useRotations';
import { useSession } from '@/lib/auth-client';
import { EntityType } from '@/services/game-data';

const formatCharacterFilterLabel = (selectedNames: Array<string>) => {
  if (selectedNames.length === 0) {
    return 'Filter by characters';
  }

  if (selectedNames.length <= 2) {
    return selectedNames.join(', ');
  }

  return `${selectedNames.length} characters selected`;
};

export function LibraryContainer() {
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Array<number>>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [publicOffset, setPublicOffset] = useState(0);
  const { data: session } = useSession();
  const { data: characters } = useEntityList({ entityType: EntityType.CHARACTER });
  const ownedRotationsQuery = useRotations(
    {
      scope: 'owned',
      offset: 0,
      limit: 20,
      characterIds: selectedCharacterIds,
    },
    {
      enabled: Boolean(session?.user.id),
    },
  );
  const ownedRotations = ownedRotationsQuery.data.items;
  const publicRotationsQuery = useRotations({
    scope: 'public',
    offset: publicOffset,
    limit: 20,
    characterIds: selectedCharacterIds,
  });
  const publicRotations = publicRotationsQuery.data.items.filter(
    (rotation) => !rotation.isOwner,
  );
  const isAuthenticated = Boolean(session?.user.id);
  const selectedCharacters = characters.filter((character) =>
    selectedCharacterIds.includes(character.id),
  );
  const hasNextPublicPage =
    publicRotationsQuery.data.offset + publicRotationsQuery.data.limit <
    publicRotationsQuery.data.total;

  const toggleCharacter = (characterId: number) => {
    setSelectedCharacterIds((currentIds) => {
      const nextIds = currentIds.includes(characterId)
        ? currentIds.filter((currentId) => currentId !== characterId)
        : [...currentIds, characterId];

      return nextIds.toSorted((left, right) => left - right);
    });
    setPublicOffset(0);
  };

  return (
    <Stack className="p-page gap-page h-full w-full">
      <Row gap="inset">
        <Library className="size-6" />
        <Text as="h2" variant="heading">
          Library
        </Text>
      </Row>
      <Row justify="between" align="start" wrap className="gap-component">
        <Stack gap="trim">
          <Text variant="bodySm" tone="muted">
            Filter both your saved rotations and public rotations by character.
          </Text>
        </Stack>
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-64 justify-between">
              <span>
                {formatCharacterFilterLabel(
                  selectedCharacters.map((item) => item.name),
                )}
              </span>
              <ChevronsUpDown className="size-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search characters..." />
              <CommandList>
                <CommandEmpty>No characters found.</CommandEmpty>
                <CommandGroup>
                  {characters.map((character) => {
                    const isSelected = selectedCharacterIds.includes(character.id);

                    return (
                      <CommandItem
                        key={character.id}
                        value={character.name}
                        onSelect={() => toggleCharacter(character.id)}
                      >
                        <Check className={isSelected ? 'opacity-100' : 'opacity-0'} />
                        <EntityIcon entityId={character.id} size="small" />
                        <span>{character.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </Row>
      {selectedCharacters.length > 0 && (
        <Row gap="inset" wrap>
          {selectedCharacters.map((character) => (
            <Badge key={character.id} variant="secondary">
              {character.name}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setSelectedCharacterIds([])}>
            Clear filters
          </Button>
        </Row>
      )}
      <ScrollArea className="min-h-0 flex-1">
        <Stack gap="page">
          {isAuthenticated && (
            <Stack gap="component">
              {ownedRotationsQuery.isLoading ? (
                <Card>
                  <CardContent className="py-page">
                    <Text variant="bodySm" tone="muted">
                      Loading your rotations...
                    </Text>
                  </CardContent>
                </Card>
              ) : ownedRotations.length === 0 ? (
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
                <RotationTable
                  title="Your Rotations"
                  description="Manage your saved rotations and choose which ones are public."
                  rotations={ownedRotations}
                  showOwnerActions
                  isLoading={ownedRotationsQuery.isLoading}
                  emptyMessage="No saved rotations found."
                />
              )}
            </Stack>
          )}

          <RotationTable
            key={selectedCharacterIds.join(',')}
            title="Public Rotations"
            description="Browse community rotations and load any public build into the calculator."
            rotations={publicRotations}
            showOwnerActions={false}
            isLoading={publicRotationsQuery.isLoading}
            isFetching={publicRotationsQuery.isFetching}
            emptyMessage="No public rotations found."
            totalLabel={`${publicRotationsQuery.data.total} public rotations`}
            hasNextPage={hasNextPublicPage}
            isPreviousData={publicRotationsQuery.isPreviousData}
            onPreviousPage={
              publicOffset > 0
                ? () =>
                    setPublicOffset((currentOffset) => Math.max(currentOffset - 20, 0))
                : undefined
            }
            onNextPage={
              hasNextPublicPage
                ? () =>
                    setPublicOffset(
                      publicRotationsQuery.data.offset +
                        publicRotationsQuery.data.limit,
                    )
                : undefined
            }
          />
        </Stack>
      </ScrollArea>
    </Stack>
  );
}
