import type { ColumnDef } from '@tanstack/react-table';
import { sumBy } from 'es-toolkit/math';
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

interface CharacterBreakdownDataTableProperties {
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>;
  totalDamage: number;
  inspectorPortalNode: HTMLDivElement | undefined;
}

const buildCharacterRows = ({
  mergedDamageDetails,
  totalDamage,
}: Pick<
  CharacterBreakdownDataTableProperties,
  'mergedDamageDetails' | 'totalDamage'
>): Array<CharacterBreakdownRow> => {
  const hitCountPerAttack = new Map<number, number>();
  const enriched = mergedDamageDetails.map(({ detail, attack }) => {
    const hitIndex = hitCountPerAttack.get(detail.attackIndex) ?? 0;
    hitCountPerAttack.set(detail.attackIndex, hitIndex + 1);
    return {
      detail,
      attack,
      characterName: attack?.characterName ?? '',
      damageType: attack?.damageInstances[hitIndex]?.damageType ?? 'unknown',
    };
  });

  const byCharacter = Object.groupBy(enriched, (item) => item.characterName);
  return Object.entries(byCharacter)
    .filter(([characterName]) => characterName !== '')
    .map(([characterName, items]) => {
      const iconUrl = items!.find((item) => item.attack?.characterIconUrl)?.attack
        ?.characterIconUrl;
      const charTotalDamage = sumBy(items ?? [], (item) => item.detail.damage);
      const byType = Object.groupBy(items!, (item) => item.damageType);
      const damageTypes = Object.entries(byType)
        .map(([damageType, typeItems]) => {
          const damage = sumBy(typeItems ?? [], (item) => item.detail.damage);
          return {
            damageType,
            damage,
            pctOfCharacter: charTotalDamage > 0 ? (damage / charTotalDamage) * 100 : 0,
          };
        })
        .toSorted((a, b) => b.damage - a.damage);
      return {
        characterName,
        iconUrl,
        totalDamage: charTotalDamage,
        pctOfTotal: totalDamage > 0 ? (charTotalDamage / totalDamage) * 100 : 0,
        damageTypes,
      };
    })
    .toSorted((a, b) => b.totalDamage - a.totalDamage);
};

export const CharacterBreakdownDataTable = ({
  mergedDamageDetails,
  totalDamage,
  inspectorPortalNode,
}: CharacterBreakdownDataTableProperties) => {
  const [expandedCharacters, setExpandedCharacters] = useState<Set<string>>(
    new Set(mergedDamageDetails.map((row) => row.attack?.characterName ?? '')),
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
        <Stack align="end">
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
