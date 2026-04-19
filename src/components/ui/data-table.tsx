import type { ColumnDef, Row, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableColumnMeta {
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProperties<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>;
  data: Array<TData>;
  showHeader?: boolean;
  onRowClick?: (row: TData, index: number) => void;
  renderRow?: (row: Row<TData>, defaultRow: ReactNode) => ReactNode;
  renderFooter?: (rows: Array<Row<TData>>) => ReactNode;
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
  showHeader = true,
  onRowClick,
  renderRow,
  renderFooter,
  classNames,
  emptyMessage = 'No results.',
}: DataTableProperties<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className={cn('rounded-md border', classNames?.wrapper)}>
      <div className={cn('overflow-auto', classNames?.scrollArea)}>
        <Table>
          {showHeader && (
            <TableHeader className={classNames?.header}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className={classNames?.headerRow}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as
                      | DataTableColumnMeta
                      | undefined;

                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          classNames?.headerCell,
                          meta?.headerClassName,
                          header.column.getCanSort() && 'cursor-pointer select-none',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder ? undefined : (
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanSort() &&
                              (header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="text-muted-foreground h-3 w-3" />
                              ))}
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
          )}
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
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as
                        | DataTableColumnMeta
                        | undefined;

                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(classNames?.cell, meta?.cellClassName)}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
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
          {renderFooter && (
            <TableFooter>{renderFooter(table.getRowModel().rows)}</TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
