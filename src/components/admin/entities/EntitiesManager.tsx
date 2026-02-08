/* eslint-disable unicorn/no-null */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Section } from '@/components/ui/layout';
import { Heading } from '@/components/ui/typography';
import type { Entity } from '@/db/schema';
import { deleteEntity, listEntities } from '@/services/admin/entities.function';

import { entityColumns } from './entity-columns';
import { EntityDialog } from './EntityDialog';

export const EntitiesManager = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: entities = [],
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['admin', 'entities'],
    queryFn: () => listEntities(),
  });

  const filteredEntities = entities.filter((entity) =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleRowClick = (entity: Entity) => {
    navigate({ to: '/admin/entities/$id', params: { id: String(entity.id) } });
  };

  const handleCreateNew = () => {
    setSelectedEntityId(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (
      globalThis.confirm(
        `Are you sure you want to delete "${name}"?\n\nThis will also delete all associated attacks, modifiers, and permanent stats.`,
      )
    ) {
      await deleteEntity({ data: { id } });
      refetch();
    }
  };

  const columnsWithActions = [
    ...entityColumns,
    {
      id: 'actions',
      header: 'Actions',
      size: 80,
      cell: ({ row }: { row: { original: Entity } }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            handleDelete(row.original.id, row.original.name);
          }}
        >
          <Trash2 size={16} className="text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <Section>
      <div className="flex items-center justify-between">
        <Heading>Entities</Heading>
        <Button onClick={handleCreateNew}>
          <Plus size={16} className="mr-2" />
          Create Entity
        </Button>
      </div>

      <div className="relative">
        <Search
          className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          size={18}
        />
        <Input
          placeholder="Search entities by name..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground p-8 text-center">Loading...</div>
      ) : (
        <DataTable
          columns={columnsWithActions}
          data={filteredEntities}
          onRowClick={handleRowClick}
          emptyMessage={
            searchTerm
              ? `No entities found matching "${searchTerm}".`
              : 'No entities found. Create one to get started.'
          }
        />
      )}

      <EntityDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        entityId={selectedEntityId}
        onSuccess={() => {
          refetch();
          setIsDialogOpen(false);
        }}
      />
    </Section>
  );
};
