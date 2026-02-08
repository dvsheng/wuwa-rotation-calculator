import type { ColumnDef } from '@tanstack/react-table';

import type { Entity } from '@/db/schema';

export const entityColumns: Array<ColumnDef<Entity>> = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 60,
  },
  {
    accessorKey: 'hakushinId',
    header: 'Hakushin ID',
    size: 100,
    cell: ({ row }) => row.original.hakushinId ?? '—',
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 200,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    size: 120,
    cell: ({ row }) => (
      <span className="capitalize">{row.original.type.replace('_', ' ')}</span>
    ),
  },
  {
    accessorKey: 'attribute',
    header: 'Attribute',
    size: 120,
    cell: ({ row }) =>
      row.original.attribute ? (
        <span className="capitalize">{row.original.attribute}</span>
      ) : (
        '—'
      ),
  },
];
