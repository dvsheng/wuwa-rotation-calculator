import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { startCase } from 'es-toolkit';
import { Database } from 'lucide-react';
import { Suspense, useState } from 'react';

import { EntityIcon } from '@/components/common/EntityIcon';
import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Container, Stack } from '@/components/ui/layout';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { EntityListItem, UseEntitiesOptions } from '@/hooks/useEntities';
import { useEntities } from '@/hooks/useEntities';
import { EntityType } from '@/services/game-data';

function EntitiesPage() {
  const [searchText, setSearchText] = useState('');
  const [entityType, setEntityType] = useState<string | undefined>();
  return (
    <Container padding="page" className="h-full min-h-0 max-w-6xl">
      <Stack gap="component" className="h-full min-h-0">
        <div className="space-y-2">
          <h2 className="gap-inset tracking-trim flex items-center text-2xl font-bold">
            <Database className="h-6 w-6" /> Entities
          </h2>
          <p className="text-muted-foreground text-sm">
            Filter by entity type and search by name.
          </p>
        </div>

        <div className="gap-component grid">
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
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
        <EntitiesTable entityType={entityType as EntityType} search={searchText} />
      </Stack>
    </Container>
  );
}

const EntitiesTableLoading = () => {
  return (
    <Card className="h-full">
      <LoadingSpinnerContainer message="Loading entities..." spinnerSize={40} />
    </Card>
  );
};

const EntitiesTable = (options: UseEntitiesOptions) => {
  const { data } = useEntities(options);
  const navigate = useNavigate();

  const columns: Array<ColumnDef<EntityListItem>> = [
    {
      accessorKey: 'icon',
      header: undefined,
      cell: ({ row }) => <EntityIcon iconUrl={row.original.iconUrl} size="large" />,
    },
    {
      accessorKey: 'name',
      header: 'Entity Name',
      cell: ({ row }) => row.original.name,
    },
    {
      accessorKey: 'type',
      header: 'Entity Type',
      cell: ({ row }) => <span>{startCase(row.original.type)}</span>,
    },
  ];
  return (
    <Suspense fallback={<EntitiesTableLoading />}>
      <DataTable
        columns={columns}
        data={data}
        emptyMessage="No entities found."
        classNames={{
          wrapper: 'min-h-0 flex-1 overflow-hidden flex flex-col',
          scrollArea: 'h-full overflow-auto bg-card',
        }}
        onRowClick={(row) =>
          navigate({
            to: '/entities/$id',
            params: { id: String(row.id) },
          })
        }
      />
    </Suspense>
  );
};

export const Route = createFileRoute('/entities')({
  component: EntitiesPage,
});
