import type { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, Info } from 'lucide-react';
import { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';

import { CharacterIconDisplay } from '@/components/common/CharacterIcon';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';
import { cn } from '@/lib/utils';

import type { CharacterBreakdownRow } from './character-breakdown.types';
import { CharacterBreakdownPieChart } from './CharacterBreakdownPieChart';
import { CharacterBreakdownRowDropdown } from './CharacterBreakdownRowDropdown';
import {
  rotationResultDataTableClassNames,
  rotationResultTableColumnLayout,
} from './data-table.style';
import { useRotationResultPopover } from './RotationResultPopoverContext';

interface CharacterBreakdownDataTableProperties {
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>;
  totalDamage: number;
}

const buildCharacterRows = ({
  mergedDamageDetails,
  totalDamage,
}: CharacterBreakdownDataTableProperties): Array<CharacterBreakdownRow> => {
  const byCharacter = new Map<
    string,
    { iconUrl?: string; totalDamage: number; byType: Record<string, number> }
  >();
  const hitCountPerAttack = new Map<number, number>();

  for (const { detail, attack, characterName } of mergedDamageDetails) {
    const hitIndex = hitCountPerAttack.get(detail.attackIndex) ?? 0;
    hitCountPerAttack.set(detail.attackIndex, hitIndex + 1);

    let existing = byCharacter.get(characterName);
    if (!existing) {
      existing = {
        iconUrl: attack?.characterIconUrl,
        totalDamage: 0,
        byType: {},
      };
    }

    if (!existing.iconUrl && attack?.characterIconUrl) {
      existing.iconUrl = attack.characterIconUrl;
    }

    const damageType = attack?.damageInstances[hitIndex]?.damageType ?? 'unknown';
    existing.byType[damageType] = (existing.byType[damageType] ?? 0) + detail.damage;
    existing.totalDamage += detail.damage;

    byCharacter.set(characterName, existing);
  }

  return [...byCharacter.entries()]
    .map(([characterName, item]) => ({
      characterName,
      iconUrl: item.iconUrl,
      totalDamage: item.totalDamage,
      pctOfTotal: totalDamage > 0 ? (item.totalDamage / totalDamage) * 100 : 0,
      damageTypes: Object.entries(item.byType)
        .map(([damageType, damage]) => ({
          damageType,
          damage,
          pctOfCharacter: item.totalDamage > 0 ? (damage / item.totalDamage) * 100 : 0,
        }))
        .toSorted((a, b) => b.damage - a.damage),
    }))
    .toSorted((a, b) => b.totalDamage - a.totalDamage);
};

export const CharacterBreakdownDataTable = ({
  mergedDamageDetails,
  totalDamage,
}: CharacterBreakdownDataTableProperties) => {
  const { inspectorPortalNode } = useRotationResultPopover();
  const [expandedCharacters, setExpandedCharacters] = useState<Set<string>>(
    new Set(mergedDamageDetails.map((row) => row.characterName)),
  );
  const [selectedCharacterName, setSelectedCharacterName] = useState<
    string | undefined
  >();
  const rows = buildCharacterRows({ mergedDamageDetails, totalDamage });
  const selectedCharacter = rows.find(
    (row) => row.characterName === selectedCharacterName,
  );

  const characterColumns: Array<ColumnDef<CharacterBreakdownRow>> = [
    {
      id: 'index',
      header: 'Character #',
      meta: {
        headerClassName: rotationResultTableColumnLayout.index,
        cellClassName: rotationResultTableColumnLayout.index,
      },
      cell: ({ row }) => (
        <Text variant="small" className="text-primary justify-center font-mono">
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
        <Row align="center" gap="tight" className="min-w-0">
          <CharacterIconDisplay url={row.original.iconUrl} size="small" />
          <Text as="span" variant="small" className="truncate">
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
        <Stack className="items-end">
          <Text as="p" variant="small" className="text-primary text-right font-mono">
            {Math.round(row.original.totalDamage).toLocaleString()}
          </Text>
          <Text as="p" variant="caption" className="text-primary text-right font-mono">
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
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedCharacterName((previous) =>
                previous === row.original.characterName
                  ? undefined
                  : row.original.characterName,
              );
            }}
            aria-label="Open character damage type pie chart"
          >
            <Info />
          </Button>
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
      {inspectorPortalNode
        ? createPortal(
            <CharacterBreakdownPieChart selectedCharacter={selectedCharacter} />,
            inspectorPortalNode,
          )
        : undefined}
    </Fragment>
  );
};
