import type { ColumnDef, Row } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ReactNode } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableProperties<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>;
  data: Array<TData>;
  onRowClick?: (row: TData, index: number) => void;
  renderRow?: (row: Row<TData>, defaultRow: ReactNode) => ReactNode;
  classNames?: {
    wrapper?: string;
    scrollArea?: string;
    header?: string;
    headerRow?: string;
    headerCell?: string;
    body?: string;
    row?: string;
    cell?: string;
  };
  emptyMessage?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  renderRow,
  classNames,
  emptyMessage = 'No results.',
}: DataTableProperties<TData, TValue>) {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={cn('rounded-md border', classNames?.wrapper)}>
      <div className={cn('overflow-auto', classNames?.scrollArea)}>
        <Table>
          <TableHeader className={classNames?.header}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={classNames?.headerRow}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className={classNames?.headerCell}>
                      {header.isPlaceholder
                        ? undefined
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={classNames?.body}>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, index) => {
                const defaultRow = (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => onRowClick?.(row.original, index)}
                    className={cn(onRowClick ? 'cursor-pointer' : '', classNames?.row)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={classNames?.cell}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );

                return renderRow ? renderRow(row, defaultRow) : defaultRow;
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
