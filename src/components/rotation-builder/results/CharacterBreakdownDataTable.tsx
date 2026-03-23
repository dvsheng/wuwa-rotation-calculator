import type { ColumnDef } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { Fragment, useState } from 'react';

import { CharacterIconDisplay } from '@/components/common/CharacterIcon';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { DataTable } from '@/components/ui/data-table';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';
import { cn } from '@/lib/utils';

import type { CharacterBreakdownRow } from './character-breakdown.types';
import { CharacterBreakdownDetails } from './CharacterBreakdownDetails';
import { CharacterBreakdownRowDropdown } from './CharacterBreakdownRowDropdown';
import {
  rotationResultDataTableClassNames,
  rotationResultTableColumnLayout,
} from './data-table.style';
import { RelativeMagnitudeBar } from './RelativeMagnitudeBar';
import { characterBreakdown } from './result-pipelines';
import { InspectorContent } from './RotationResultInspectorContext';

interface CharacterBreakdownDataTableProperties {
  result: Array<RotationResultMergedDamageDetail>;
}

export const CharacterBreakdownDataTable = ({
  result,
}: CharacterBreakdownDataTableProperties) => {
  const [expandedCharacters, setExpandedCharacters] = useState<Set<string>>(
    new Set(result.map((row) => row.characterName)),
  );
  const [selectedCharacterName, setSelectedCharacterName] = useState<
    string | undefined
  >();

  const rows = characterBreakdown(result);
  const maxDamage = Math.max(...rows.map((row) => row.totalDamage), 0);
  const selectedCharacter = selectedCharacterName
    ? rows.find((row) => row.characterName === selectedCharacterName)
    : undefined;
  const characterColumns: Array<ColumnDef<CharacterBreakdownRow>> = [
    {
      id: 'index',
      header: 'Character #',
      meta: {
        headerClassName: rotationResultTableColumnLayout.index,
        cellClassName: rotationResultTableColumnLayout.index,
      },
      cell: ({ row }) => (
        <Text
          variant="bodySm"
          tabular={true}
          className="text-primary justify-center font-mono"
        >
          {row.index + 1}
        </Text>
      ),
    },
    {
      id: 'character',
      header: 'Character',
      meta: {
        headerClassName: rotationResultTableColumnLayout.attack,
        cellClassName: rotationResultTableColumnLayout.attack,
      },
      cell: ({ row }) => (
        <Row align="center" gap="trim" className="min-w-0">
          <CharacterIconDisplay url={row.original.iconUrl} size="small" />
          <Text as="span" variant="bodySm" tone="muted" className="truncate">
            {row.original.characterName}
          </Text>
        </Row>
      ),
    },
    {
      id: 'damage',
      header: () => <div className="text-right">Damage</div>,
      meta: {
        headerClassName: rotationResultTableColumnLayout.damage,
        cellClassName: rotationResultTableColumnLayout.damage,
      },
      cell: ({ row }) => (
        <Stack align="end">
          <Text
            as="p"
            variant="bodySm"
            tabular={true}
            className="text-primary text-right font-mono"
          >
            {Math.round(row.original.totalDamage).toLocaleString()}
          </Text>
          <Text
            as="p"
            variant="caption"
            tabular={true}
            className="text-primary text-right font-mono"
          >
            {row.original.pctOfTotal.toFixed(1)}%
          </Text>
        </Stack>
      ),
    },
    {
      id: 'details',
      header: () => {},
      meta: {
        headerClassName: rotationResultTableColumnLayout.details,
        cellClassName: rotationResultTableColumnLayout.details,
      },
      cell: ({ row }) => (
        <div className="flex justify-end">
          <InfoTooltip
            onClick={(event) => {
              event.stopPropagation();
              setSelectedCharacterName((previous) =>
                previous === row.original.characterName
                  ? undefined
                  : row.original.characterName,
              );
            }}
          >
            Open character attack breakdown
          </InfoTooltip>
        </div>
      ),
    },
    {
      id: 'expand',
      header: () => {},
      meta: {
        headerClassName: rotationResultTableColumnLayout.expand,
        cellClassName: rotationResultTableColumnLayout.expand,
      },
      cell: ({ row }) => (
        <ChevronDown
          className={cn(
            'h-4 w-4',
            expandedCharacters.has(row.original.characterName) && 'rotate-180',
          )}
        />
      ),
    },
    {
      id: 'magnitude',
      header: () => {},
      meta: {
        headerClassName: rotationResultTableColumnLayout.magnitude,
        cellClassName: rotationResultTableColumnLayout.magnitude,
      },
      cell: ({ row }) => (
        <RelativeMagnitudeBar value={row.original.totalDamage} maxValue={maxDamage} />
      ),
    },
  ];

  return (
    <Fragment>
      <DataTable
        columns={characterColumns}
        data={rows}
        onRowClick={(row) => {
          setExpandedCharacters((previous) => {
            const next = new Set(previous);
            if (next.has(row.characterName)) {
              next.delete(row.characterName);
            } else {
              next.add(row.characterName);
            }
            return next;
          });
        }}
        emptyMessage="No character damage data."
        classNames={rotationResultDataTableClassNames}
        renderRow={(row, defaultRow) => (
          <Fragment key={row.id}>
            {defaultRow}
            <CharacterBreakdownRowDropdown
              row={row}
              columnCount={characterColumns.length}
              isOpen={expandedCharacters.has(row.original.characterName)}
            />
          </Fragment>
        )}
      />
      {selectedCharacter && (
        <InspectorContent>
          <CharacterBreakdownDetails selectedCharacter={selectedCharacter} />
        </InspectorContent>
      )}
    </Fragment>
  );
};
