import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { startCase } from 'es-toolkit';
import { Suspense, useState } from 'react';

import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Container, Stack } from '@/components/ui/layout';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { GameDataEntity } from '@/hooks/useGameDataEntities';
import { useGameDataEntities } from '@/hooks/useGameDataEntities';
import { EntityType } from '@/services/game-data/types';

function GameDataTable({
  search,
  entityType,
}: {
  search: string;
  entityType: string | undefined;
}) {
  const { data } = useGameDataEntities({
    search,
    entityType: entityType as EntityType,
  });
  const navigate = useNavigate();

  const columns: Array<ColumnDef<GameDataEntity>> = [
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      enableSorting: true,
      cell: ({ row }) => startCase(row.original.type),
    },
    {
      id: 'rarity',
      header: 'Rarity',
      enableSorting: true,
      accessorFn: (row) => row.metadata.rarity ?? row.metadata.cost ?? undefined,
      cell: ({ getValue }) => getValue() ?? '—',
    },
    {
      id: 'attribute',
      header: 'Attribute',
      enableSorting: true,
      accessorFn: (row) => row.metadata.attribute ?? undefined,
      cell: ({ getValue }) => getValue() ?? '—',
    },
    {
      id: 'weaponType',
      header: 'Weapon Type',
      enableSorting: true,
      accessorFn: (row) => row.metadata.weaponType ?? undefined,
      cell: ({ getValue }) => getValue() ?? '—',
    },
    {
      id: 'actions',
      header: undefined,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate({
              to: '/game-data/$id',
              params: { id: String(row.original.id) },
              search: { tab: 'buffs' },
            })
          }
        >
          View Buffs
        </Button>
      ),
    },
  ];

  return (
    <>
      <p className="text-muted-foreground text-sm">{data.length} entities</p>
      <DataTable
        columns={columns}
        data={data}
        emptyMessage="No entities found."
        classNames={{
          wrapper: 'min-h-0 flex-1 overflow-hidden flex flex-col',
          scrollArea: 'h-full overflow-auto bg-card',
        }}
      />
    </>
  );
}

function GameDataPage() {
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState<string | undefined>();

  return (
    <Container padding="page" className="h-full min-h-0 max-w-6xl">
      <Stack gap="component" className="h-full min-h-0">
        <div className="gap-component grid">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search entity name..."
          />
          <ToggleGroup
            variant="outline"
            type="single"
            value={entityType}
            onValueChange={setEntityType}
          >
            {Object.values(EntityType).map((type) => (
              <ToggleGroupItem key={type} value={type}>
                {startCase(type)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <Suspense
          fallback={
            <Card className="h-full">
              <LoadingSpinnerContainer message="Loading entities..." spinnerSize={40} />
            </Card>
          }
        >
          <GameDataTable search={search} entityType={entityType} />
        </Suspense>
      </Stack>
    </Container>
  );
}

export const Route = createFileRoute('/game-data')({
  component: GameDataPage,
});
