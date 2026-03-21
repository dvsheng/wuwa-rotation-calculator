import { Link } from '@tanstack/react-router';
import { Library } from 'lucide-react';
import { Suspense, useState } from 'react';

import { RotationTable } from '@/components/builds/RotationTable';
import { EntityIcon } from '@/components/common/EntityIcon';
import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox';
import { Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import { useEntityList } from '@/hooks/useEntityList';
import { useRotations } from '@/hooks/useRotations';
import { useSession } from '@/lib/auth-client';
import { EntityType } from '@/services/game-data';

const RotationTableSpinner = ({ message }: { message: string }) => {
  return (
    <Card>
      <CardContent className="py-page">
        <LoadingSpinnerContainer message={message} />
      </CardContent>
    </Card>
  );
};

const NoOwnedRotationsCard = () => {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="gap-component flex items-center">
          <Library />
          <CardTitle>No saved rotations</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="gap-panel flex flex-col items-center text-center">
        <Text variant="bodySm" tone="muted">
          Start building a rotation to save it to your library.
        </Text>
        <Button asChild>
          <Link to="/create">Start Building</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const OwnedRotationsSection = ({
  selectedCharacterIds,
}: {
  selectedCharacterIds: Array<number>;
}) => {
  const { data } = useRotations({
    scope: 'owned',
    offset: 0,
    limit: 20,
    characterIds: selectedCharacterIds,
  });
  return (
    <Suspense fallback={<RotationTableSpinner message="Loading your rotations..." />}>
      {data.items.length === 0 ? (
        <NoOwnedRotationsCard />
      ) : (
        <RotationTable
          title="Your Rotations"
          description="Manage your saved rotations."
          rotations={data.items}
          showOwnerActions
          emptyMessage="No saved rotations found."
        />
      )}
    </Suspense>
  );
};

const PublicRotationsSection = ({
  selectedCharacterIds,
  publicOffset,
  setPublicOffset,
}: {
  selectedCharacterIds: Array<number>;
  publicOffset: number;
  setPublicOffset: (value: number | ((currentOffset: number) => number)) => void;
}) => {
  const { data } = useRotations({
    scope: 'public',
    offset: publicOffset,
    limit: 20,
    characterIds: selectedCharacterIds,
  });
  const publicRotations = data.items.filter((rotation) => !rotation.isOwner);
  const hasNextPage = data.offset + data.limit < data.total;
  return (
    <Suspense fallback={<RotationTableSpinner message="Loading public rotations..." />}>
      <RotationTable
        key={selectedCharacterIds.join(',')}
        title="Public Rotations"
        description="Browse community rotations and load any public build into the calculator."
        rotations={publicRotations}
        showOwnerActions={false}
        emptyMessage="No public rotations found."
        hasNextPage={hasNextPage}
        onPreviousPage={
          publicOffset > 0
            ? () => setPublicOffset((currentOffset) => Math.max(currentOffset - 20, 0))
            : undefined
        }
        onNextPage={
          hasNextPage ? () => setPublicOffset(data.offset + data.limit) : undefined
        }
      />
    </Suspense>
  );
};

export const LibraryContainer = () => {
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Array<number>>([]);
  const [publicOffset, setPublicOffset] = useState(0);
  const { data: session } = useSession();
  const { data: characters } = useEntityList({ entityType: EntityType.CHARACTER });

  const handleSetCharactersFilter = (
    _characters: Array<(typeof characters)[number]>,
  ) => {
    setSelectedCharacterIds(
      _characters
        .map((character) => character.id)
        .toSorted((left, right) => left - right),
    );
    setPublicOffset(0);
  };

  const isAuthenticated = session?.user.id !== undefined;
  const selectedCharacters = characters.filter((character) =>
    selectedCharacterIds.includes(character.id),
  );
  return (
    <Stack gap="component" className="h-full min-h-0">
      <Text as="h2" variant="heading" className="gap-inset flex items-center">
        <Library /> Library
      </Text>
      <Combobox
        items={characters}
        multiple
        value={selectedCharacters}
        onValueChange={handleSetCharactersFilter}
        itemToStringValue={(character) => character.name}
      >
        <ComboboxChips>
          <ComboboxValue>
            {selectedCharacters.map((character) => (
              <ComboboxChip key={character.id}>{character.name}</ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput placeholder="Filter by characters" />
        </ComboboxChips>
        <ComboboxContent align="start">
          <ComboboxEmpty>No characters found.</ComboboxEmpty>
          <ComboboxList>
            {(character) => (
              <ComboboxGroup>
                <ComboboxItem key={character.id} value={character}>
                  <EntityIcon entityId={character.id} size="small" />
                  <span>{character.name}</span>
                </ComboboxItem>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <ScrollArea className="min-h-0 flex-1" orientation="both">
        <Stack gap="page">
          {isAuthenticated && (
            <OwnedRotationsSection selectedCharacterIds={selectedCharacterIds} />
          )}

          <PublicRotationsSection
            selectedCharacterIds={selectedCharacterIds}
            publicOffset={publicOffset}
            setPublicOffset={setPublicOffset}
          />
        </Stack>
      </ScrollArea>
    </Stack>
  );
};
