import { useQuery } from '@tanstack/react-query';
import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Database } from 'lucide-react';
import { z } from 'zod';

import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdminListEntitiesRow } from '@/schemas/admin';
import { listAdminEntities } from '@/services/admin';
import { EntityType } from '@/services/game-data';

const adminEntitiesSearchSchema = z.object({
  entityType: z.enum(EntityType).optional(),
  search: z.string().optional(),
});

function AdminEntitiesPage() {
  const navigate = useNavigate();
  const searchParameters = Route.useSearch();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isDetailRoute = pathname.startsWith('/admin/entities/');
  const requestData = {
    ...(searchParameters.entityType ? { entityType: searchParameters.entityType } : {}),
    ...(searchParameters.search ? { search: searchParameters.search } : {}),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-entities', searchParameters.entityType, searchParameters.search],
    queryFn: () => listAdminEntities({ data: requestData }),
    enabled: !isDetailRoute,
  });

  const columns: Array<ColumnDef<AdminListEntitiesRow>> = [
    {
      accessorKey: 'entity.name',
      header: 'Entity Name',
      cell: ({ row }) => row.original.entity.name,
    },
    {
      accessorKey: 'entity.type',
      header: 'Entity Type',
      cell: ({ row }) => (
        <span className="capitalize">{row.original.entity.type.replace('_', ' ')}</span>
      ),
    },
    {
      accessorKey: 'skillCount',
      header: 'Skills',
      cell: ({ row }) => row.original.skillCount,
    },
  ];

  if (isDetailRoute) {
    return <Outlet />;
  }

  return (
    <div className="p-page container mx-auto max-w-6xl space-y-4">
      <div className="space-y-2">
        <h2 className="gap-compact flex items-center text-2xl font-bold tracking-tight">
          <Database className="h-6 w-6" /> Entities
        </h2>
        <p className="text-muted-foreground text-sm">
          Filter by entity type and search by name.
        </p>
      </div>

      <div className="gap-component grid">
        <Select
          value={searchParameters.entityType ?? 'all'}
          onValueChange={(value) => {
            void navigate({
              to: '/admin/entities',
              replace: true,
              search: {
                ...searchParameters,
                entityType:
                  value === 'all' ? undefined : z.enum(EntityType).parse(value),
              },
            });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All entity types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={EntityType.CHARACTER}>Character</SelectItem>
            <SelectItem value={EntityType.WEAPON}>Weapon</SelectItem>
            <SelectItem value={EntityType.ECHO}>Echo</SelectItem>
            <SelectItem value={EntityType.ECHO_SET}>Echo Set</SelectItem>
          </SelectContent>
        </Select>

        <Input
          value={searchParameters.search ?? ''}
          placeholder="Search entity name..."
          onChange={(event) => {
            const value = event.target.value;
            void navigate({
              to: '/admin/entities',
              replace: true,
              search: {
                ...searchParameters,
                search: value.trim() ? value : undefined,
              },
            });
          }}
        />
      </div>

      {error instanceof Error && (
        <div className="text-destructive p-panel rounded-md border text-sm">
          {error.message}
        </div>
      )}

      <DataTable
        columns={columns}
        data={data ?? []}
        emptyMessage={isLoading ? 'Loading entities...' : 'No entities found.'}
        onRowClick={(row) => {
          void navigate({
            to: '/admin/entities/$id',
            params: { id: String(row.entity.id) },
          });
        }}
      />
    </div>
  );
}

export const Route = createFileRoute('/admin/entities')({
  validateSearch: adminEntitiesSearchSchema,
  component: AdminEntitiesPage,
});
