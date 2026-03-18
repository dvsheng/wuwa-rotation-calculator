import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { startCase } from 'es-toolkit';
import { Database } from 'lucide-react';
import { Suspense, useState } from 'react';

import { EntityIcon } from '@/components/common/EntityIcon';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Container, Stack } from '@/components/ui/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AdminEntity, UseAdminEntitiesOptions } from '@/hooks/useAdminEntities';
import { useAdminEntities } from '@/hooks/useAdminEntities';
import { EntityType } from '@/services/game-data';

export function AdminEntitiesPage() {
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
          <ToggleGroup type="single" value={entityType} onValueChange={setEntityType}>
            {Object.values(EntityType).map((type) => (
              <ToggleGroupItem key={type} value={type}>
                {startCase(type)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <AdminEntitiesTable entityType={entityType as EntityType} search={searchText} />
      </Stack>
    </Container>
  );
}

const AdminEntitiesTableSkeleton = () => {
  return (
    <div className="rounded-md border p-4">
      <Stack gap="component">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`entity-skeleton-${index}`} className="grid grid-cols-3 gap-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </Stack>
    </div>
  );
};

const AdminEntitiesErrorFallback = () => {
  return (
    <div className="text-destructive p-panel rounded-md border text-sm">
      Data failed to load.
    </div>
  );
};

const AdminEntitiesTable = (options: UseAdminEntitiesOptions) => {
  const { data } = useAdminEntities(options);
  const navigate = useNavigate();

  const columns: Array<ColumnDef<AdminEntity>> = [
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
      cell: ({ row }) => (
        <span className="capitalize">{row.original.type.replace('_', ' ')}</span>
      ),
    },
    {
      accessorKey: 'skillCount',
      header: 'Skill Count',
      cell: ({ row }) => row.original.skillCount,
    },
  ];
  return (
    <ErrorBoundary fallback={<AdminEntitiesErrorFallback />}>
      <Suspense fallback={<AdminEntitiesTableSkeleton />}>
        <DataTable
          columns={columns}
          data={data}
          emptyMessage="No entities found."
          classNames={{
            wrapper: 'min-h-0 flex-1 overflow-hidden',
            scrollArea: 'h-full',
          }}
          onRowClick={(row) =>
            navigate({
              to: '/admin/entities/$id',
              params: { id: String(row.id) },
            })
          }
        />
      </Suspense>
    </ErrorBoundary>
  );
};

export const Route = createFileRoute('/admin/entities')({
  component: () => (
    <ErrorBoundary>
      <AdminEntitiesPage />
    </ErrorBoundary>
  ),
});
