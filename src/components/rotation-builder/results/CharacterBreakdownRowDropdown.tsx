import type { Row } from '@tanstack/react-table';

import { DataTable } from '@/components/ui/data-table';
import { Row as LayoutRow } from '@/components/ui/layout';
import { TableCell, TableRow } from '@/components/ui/table';

import { toDisplayName } from './character-breakdown.types';
import type { CharacterBreakdownRow } from './character-breakdown.types';
import { rotationResultTableColumnLayout } from './data-table.style';

interface CharacterBreakdownRowDropdownProperties {
  row: Row<CharacterBreakdownRow>;
  columnCount: number;
  isOpen: boolean;
}

export const CharacterBreakdownRowDropdown = ({
  row,
  columnCount,
  isOpen,
}: CharacterBreakdownRowDropdownProperties) => {
  if (!isOpen) {
    return;
  }

  return (
    <TableRow className="border-b-0 hover:bg-transparent">
      <TableCell colSpan={columnCount} className="p-0 pb-3">
        <DataTable
          columns={[
            {
              id: 'rank',
              header: '',
              meta: {
                headerClassName: rotationResultTableColumnLayout.index,
                cellClassName: rotationResultTableColumnLayout.index,
              },
              cell: () => {},
            },
            {
              id: 'damageType',
              header: 'Damage Type',
              meta: {
                headerClassName: rotationResultTableColumnLayout.attack,
                cellClassName: rotationResultTableColumnLayout.attack,
              },
              cell: ({ row: childRow }) => toDisplayName(childRow.original.damageType),
            },
            {
              id: 'damage',
              header: () => <div className="text-right">Damage</div>,
              meta: {
                headerClassName: rotationResultTableColumnLayout.damage,
                cellClassName: rotationResultTableColumnLayout.damage,
              },
              cell: ({ row: childRow }) => (
                <LayoutRow gap="tight" className="justify-end text-right">
                  <div className="text-muted-foreground text-right font-mono">
                    ({childRow.original.pctOfCharacter.toFixed(1)}%)
                  </div>
                  <div className="text-muted-foreground text-right font-mono">
                    {Math.round(childRow.original.damage).toLocaleString()}
                  </div>
                </LayoutRow>
              ),
            },
            {
              id: 'pct',
              header: () => <div className="text-right">% of Character</div>,
              meta: {
                headerClassName: rotationResultTableColumnLayout.details,
                cellClassName: rotationResultTableColumnLayout.details,
              },
              cell: () => {},
            },
            {
              id: 'expand-spacer',
              header: '',
              meta: {
                headerClassName: rotationResultTableColumnLayout.expand,
                cellClassName: rotationResultTableColumnLayout.expand,
              },
              cell: () => '',
            },
          ]}
          data={row.original.damageTypes}
          showHeader={false}
          classNames={{
            wrapper: 'border-0 bg-transparent',
            row: 'transition-colors',
          }}
        />
      </TableCell>
    </TableRow>
  );
};
