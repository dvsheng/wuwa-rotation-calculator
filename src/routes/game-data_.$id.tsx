/* eslint-disable unicorn/filename-case */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { partition, startCase } from 'es-toolkit';
import { Cat, User, Users } from 'lucide-react';
import React, { Suspense } from 'react';
import { z } from 'zod';

import { AttributeIcon } from '@/components/common/AssetIcon';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
import { BulletItem } from '@/components/game-data/BulletItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DataTable } from '@/components/ui/data-table';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Container, Row, Stack } from '@/components/ui/layout';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEntityBuffs } from '@/hooks/useEntityBuffs';
import { useEntityBullets } from '@/hooks/useEntityBullets';
import { useEntityDamageInstances } from '@/hooks/useEntityDamageInstances';
import { useEntityModifiers } from '@/hooks/useEntityModifiers';
import { useEntityMontages } from '@/hooks/useEntityMontages';
import { useGameDataEntities } from '@/hooks/useGameDataEntities';
import { EntityType, Target } from '@/services/game-data/types';
import type { Buff } from '@/services/game-data-v2/buffs';
import type { Bullet } from '@/services/game-data-v2/bullets';
import { transformBulletsToTimedHits } from '@/services/game-data-v2/bullets/transform-bullet-to-timed-hits';
import type { DamageInstance } from '@/services/game-data-v2/damage-instances/types';
import type { Modifier } from '@/services/game-data-v2/modifiers';
import type { CharacterMontage } from '@/services/game-data-v2/montages';
import { Attribute } from '@/types/attribute';

const ENTITY_GAME_DATA_TABS = [
  'buffs',
  'modifiers',
  'damage-instances',
  'bullets',
  'montages',
] as const;

type EntityGameDataTab = (typeof ENTITY_GAME_DATA_TABS)[number];
type NumberNode = Buff['value'];
type StackInfo = { valueAt1: number; valueAtMax: number; maxStacks: number };
type ClampInfo = { min: number; max: number; stat: string | undefined };
type MontageHitRow = CharacterMontage['montage']['bullets'][number];
type MontageTagRow = CharacterMontage['montage']['tags'][number];
type MontageViewMode = 'bullet' | 'damage';
type MontageDamageRow = {
  bulletId: string;
  time: number;
  damageId: number;
  damageInstance?: DamageInstance;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function findStatParameter(node: NumberNode): string | undefined {
  if (typeof node === 'number') return undefined;
  if (!isObject(node) || !('type' in node)) return undefined;
  if (node.type === 'statParameterizedNumber') return node.stat;
  if (node.type === 'clamp') return findStatParameter(node.operand);
  if (node.type === 'product' || node.type === 'sum') {
    for (const op of node.operands) {
      const found = findStatParameter(op);
      if (found) return found;
    }
  }
  if (node.type === 'conditional') {
    return (
      findStatParameter(node.operand) ??
      findStatParameter(node.valueIfTrue) ??
      findStatParameter(node.valueIfFalse)
    );
  }
  return undefined;
}

function extractClampInfo(value: NumberNode): ClampInfo | undefined {
  if (
    !isObject(value) ||
    !('type' in value) ||
    value.type !== 'clamp' ||
    typeof value.minimum !== 'number' ||
    typeof value.maximum !== 'number'
  )
    return undefined;
  return {
    min: value.minimum,
    max: value.maximum,
    stat: findStatParameter(value.operand),
  };
}

function extractStackInfo(value: NumberNode): StackInfo | undefined {
  if (!isObject(value) || !('type' in value)) return undefined;

  if (
    value.type === 'userParameterizedNumber' &&
    value.scale !== undefined &&
    typeof value.maximum === 'number'
  ) {
    return {
      valueAt1: value.scale,
      valueAtMax: value.scale * value.maximum,
      maxStacks: value.maximum,
    };
  }

  if (value.type === 'product' && Array.isArray(value.operands)) {
    const stacker = value.operands.find(
      (op): op is Extract<NumberNode, { type: 'userParameterizedNumber' }> =>
        isObject(op) && 'type' in op && op.type === 'userParameterizedNumber',
    );
    const scalar = value.operands.find((op): op is number => typeof op === 'number');
    if (stacker && scalar !== undefined && typeof stacker.maximum === 'number') {
      return {
        valueAt1: scalar,
        valueAtMax: scalar * stacker.maximum,
        maxStacks: stacker.maximum,
      };
    }
  }

  return undefined;
}

function fmt(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

const HoverJson = ({
  value,
  children,
}: {
  value: unknown;
  children: React.ReactNode;
}) => (
  <HoverCard openDelay={150} closeDelay={100}>
    <HoverCardTrigger className="cursor-help underline decoration-dashed underline-offset-4">
      {children}
    </HoverCardTrigger>
    <HoverCardContent className="w-fit max-w-3xl overflow-hidden p-0">
      <div className="max-h-96 max-w-3xl overflow-auto">
        <pre className="w-fit min-w-full p-4 text-xs">
          {JSON.stringify(value, undefined, 4)}
        </pre>
      </div>
    </HoverCardContent>
  </HoverCard>
);

function BuffValue({ value }: { value: NumberNode }) {
  if (typeof value === 'number') {
    return <span>{fmt(value)}</span>;
  }

  const stackInfo = extractStackInfo(value);
  if (stackInfo) {
    return (
      <HoverJson value={value}>
        {fmt(stackInfo.valueAt1)} – {fmt(stackInfo.valueAtMax)}
        <span className="text-muted-foreground ml-1 text-sm font-normal">
          ({stackInfo.maxStacks} stacks)
        </span>
      </HoverJson>
    );
  }

  const clampInfo = extractClampInfo(value);
  if (clampInfo) {
    return (
      <HoverJson value={value}>
        {fmt(clampInfo.min)} – {fmt(clampInfo.max)}
        {clampInfo.stat && (
          <span className="text-muted-foreground ml-1 text-sm font-normal">
            ({startCase(clampInfo.stat)})
          </span>
        )}
      </HoverJson>
    );
  }

  return <HoverJson value={value}>Dynamic</HoverJson>;
}

const TARGET_ICON: Record<string, React.ReactNode> = {
  [Target.TEAM]: <Users className="h-3 w-3" />,
  [Target.SELF]: <User className="h-3 w-3" />,
  [Target.ACTIVE_CHARACTER]: <User className="h-3 w-3" />,
  [Target.ENEMY]: <Cat className="h-3 w-3" />,
};

function TargetBadge({ target }: { target: string }) {
  return (
    <span className="flex items-center gap-1 text-sm">
      {TARGET_ICON[target]}
      {startCase(target)}
    </span>
  );
}

function RawTagList({ tags }: { tags: Array<string> }) {
  return (
    <div className="flex flex-col gap-0.5">
      {tags.map((tag) => (
        <span key={tag} className="font-mono text-xs">
          {tag}
        </span>
      ))}
    </div>
  );
}

function BuffTags({ tags }: { tags: Array<string> }) {
  if (tags.length === 0) {
    return <span className="text-muted-foreground text-sm">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1">
      {tags.map((tag) => {
        const isAttribute = (Object.values(Attribute) as Array<string>).includes(tag);
        const isNonPhysicalAttribute = isAttribute && tag !== Attribute.PHYSICAL;
        return (
          <span key={tag} className="flex items-center gap-1 text-sm">
            {isNonPhysicalAttribute && (
              <AttributeIcon
                attribute={
                  tag as Exclude<(typeof Attribute)[keyof typeof Attribute], 'physical'>
                }
                size={12}
              />
            )}
            {startCase(tag)}
          </span>
        );
      })}
    </div>
  );
}

function EntityBuffsList({ id, entityType }: { id: number; entityType: EntityType }) {
  const { data } = useEntityBuffs(id, entityType);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No buffs found.</p>;
  }

  const columns: Array<ColumnDef<Buff>> = [
    {
      id: 'raw',
      header: '',
      cell: ({ row }) => (
        <HoverJson value={row.original.rawData}>
          <span className="text-xs">raw</span>
        </HoverJson>
      ),
      meta: {
        headerClassName: 'w-10',
        cellClassName: 'w-10',
      },
    },
    {
      id: 'value',
      header: 'Value',
      cell: ({ row }) => <BuffValue value={row.original.value} />,
      meta: {
        headerClassName: 'min-w-28',
        cellClassName: 'min-w-28 font-mono text-sm',
      },
    },
    {
      accessorKey: 'stat',
      header: 'Stat',
      cell: ({ row }) => startCase(row.original.stat),
      meta: {
        headerClassName: 'min-w-28',
        cellClassName: 'min-w-28',
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) =>
        row.original.type ? (
          <span className="text-sm">{startCase(row.original.type)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">None</span>
        ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'target',
      header: 'Target',
      cell: ({ row }) =>
        row.original.target ? (
          <TargetBadge target={row.original.target} />
        ) : (
          <span className="text-muted-foreground text-sm">None</span>
        ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) =>
        row.original.duration === undefined ? (
          <span className="text-muted-foreground text-sm">Permanent</span>
        ) : (
          `${row.original.duration}s`
        ),
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20',
      },
    },
    {
      accessorKey: 'unlockedAt',
      header: 'Unlocked At',
      cell: ({ row }) =>
        row.original.unlockedAt ? (
          <span className="text-sm">{row.original.unlockedAt.toUpperCase()}</span>
        ) : (
          <span className="text-muted-foreground text-sm">Base</span>
        ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'disabledAt',
      header: 'Disabled At',
      cell: ({ row }) =>
        row.original.disabledAt ? (
          <span className="text-sm">{row.original.disabledAt.toUpperCase()}</span>
        ) : (
          <span className="text-muted-foreground text-sm">Never</span>
        ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'tags',
      header: 'Applies To',
      cell: ({ row }) => <BuffTags tags={row.original.tags} />,
      meta: {
        headerClassName: 'min-w-40',
        cellClassName: 'min-w-40',
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      classNames={{
        wrapper: 'bg-muted/30 rounded-md border',
      }}
    />
  );
}

function EntityModifiersList({
  id,
  entityType,
}: {
  id: number;
  entityType: EntityType;
}) {
  const { data } = useEntityModifiers(id, entityType);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No modifiers found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((modifier, index) => (
        <ModifierCard
          key={
            modifier.buffs.map((buff) => buff.buffId).join('-') || `modifier-${index}`
          }
          modifier={modifier}
          index={index}
        />
      ))}
    </div>
  );
}

function ModifierCard({ modifier, index }: { modifier: Modifier; index: number }) {
  const modifierTargets = [
    ...new Set(modifier.buffs.flatMap((buff) => (buff.target ? [buff.target] : []))),
  ];
  const modifierDurations = [...new Set(modifier.buffs.map((buff) => buff.duration))];

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 py-4">
        <div className="space-y-2">
          <CardTitle className="text-base">Modifier {index + 1}</CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">{modifier.buffs.length} buffs</Badge>
            {modifierTargets.map((target) => (
              <Badge key={target} variant="secondary" className="gap-1">
                {TARGET_ICON[target]}
                {startCase(target)}
              </Badge>
            ))}
            {modifierDurations.map((duration) => (
              <Badge key={String(duration)} variant="secondary">
                {duration === undefined ? 'Permanent' : `${duration}s`}
              </Badge>
            ))}
          </div>
        </div>
        <HoverJson value={modifier}>
          <span className="text-muted-foreground text-xs">raw</span>
        </HoverJson>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0 pb-4">
        {modifier.buffs.map((buff) => (
          <div
            key={buff.buffId}
            className="bg-muted/30 flex flex-col gap-3 rounded-md border p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {buff.buffId}
              </Badge>
              <Badge variant="secondary">{startCase(buff.stat)}</Badge>
              {buff.type && <Badge variant="secondary">{startCase(buff.type)}</Badge>}
              {buff.target && (
                <Badge variant="secondary" className="gap-1">
                  {TARGET_ICON[buff.target]}
                  {startCase(buff.target)}
                </Badge>
              )}
              <Badge variant="secondary">
                {buff.duration === undefined ? 'Permanent' : `${buff.duration}s`}
              </Badge>
              {buff.unlockedAt && (
                <Badge variant="secondary">{buff.unlockedAt.toUpperCase()}</Badge>
              )}
              {buff.disabledAt && (
                <Badge variant="secondary">{buff.disabledAt.toUpperCase()}</Badge>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Value
                </p>
                <div className="font-mono text-sm">
                  <BuffValue value={buff.value} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Applies To
                </p>
                <BuffTags tags={buff.tags} />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function fmtMv(motionValue: number) {
  return fmt(motionValue / 10_000);
}

function renderMotionValue(
  motionValue: number,
  scalingAttribute: DamageInstance['scalingAttribute'],
  motionValuePerStack?: number,
) {
  const scalingLabel = startCase(scalingAttribute);

  if (motionValuePerStack === undefined) {
    return `${fmtMv(motionValue)} ${scalingLabel}`;
  }

  return `${fmtMv(motionValue)}+${fmtMv(motionValuePerStack)} per Stack ${scalingLabel}`;
}

type DamageInstanceTableRow = DamageInstance;

function EntityDamageInstancesList({
  id,
  entityType,
}: {
  id: number;
  entityType: EntityType;
}) {
  const { data } = useEntityDamageInstances(id, entityType);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No damage instances found.</p>;
  }

  const columns: Array<ColumnDef<DamageInstanceTableRow>> = [
    {
      id: 'info',
      header: '',
      cell: ({ row }) => (
        <InfoTooltip contentClassName="font-mono text-xs">
          {row.original.id}
        </InfoTooltip>
      ),
      meta: {
        headerClassName: 'w-8',
        cellClassName: 'w-8',
      },
    },
    {
      accessorKey: 'id',
      header: 'ID',
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20 font-mono text-xs',
      },
    },
    {
      id: 'motionValue',
      header: 'Motion Value',
      cell: ({ row }) =>
        renderMotionValue(
          row.original.motionValue,
          row.original.scalingAttribute,
          row.original.motionValuePerStack,
        ),
      meta: {
        headerClassName: 'min-w-56',
        cellClassName: 'min-w-56 font-mono text-sm',
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => startCase(row.original.type),
      meta: {
        headerClassName: 'min-w-28',
        cellClassName: 'min-w-28',
      },
    },
    {
      id: 'subtypes',
      header: 'Subtypes',
      cell: ({ row }) => <BuffTags tags={row.original.subtypes} />,
      meta: {
        headerClassName: 'min-w-40',
        cellClassName: 'min-w-40',
      },
    },
    {
      accessorKey: 'attribute',
      header: 'Attribute',
      cell: ({ row }) => startCase(row.original.attribute),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'scalingAttribute',
      header: 'Scaling',
      cell: ({ row }) => startCase(row.original.scalingAttribute),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'concertoRegen',
      header: 'Concerto Regen',
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'offTuneBuildup',
      header: 'Off-Tune Buildup',
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'energy',
      header: 'Energy',
      meta: {
        headerClassName: 'min-w-16',
        cellClassName: 'min-w-16',
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      classNames={{
        wrapper: 'bg-muted/30 rounded-md border',
      }}
    />
  );
}

function EntityBulletsList({ id, entityType }: { id: number; entityType: EntityType }) {
  const { data } = useEntityBullets(id, entityType);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No bullets found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((bullet) => (
        <BulletItem key={bullet.id} bullet={bullet} />
      ))}
    </div>
  );
}

function MontageFieldList({
  items,
  emptyLabel,
}: {
  items: Array<string>;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <span className="text-muted-foreground text-sm">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-col gap-1 font-mono text-sm">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function NullTableValue() {
  return <span className="text-muted-foreground font-mono text-sm">null</span>;
}

function EntityMontagesList({
  id,
  entityType,
}: {
  id: number;
  entityType: EntityType;
}) {
  const { data } = useEntityMontages(id, entityType);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No montages found.</p>;
  }

  const [otherMontages, primaryMontages] = partition(
    data,
    (item) =>
      item.montage.bullets.length === 0 ||
      item.montage.name.toLowerCase().includes('rogue') ||
      item.montage.name.toLowerCase().includes('photo'),
  );

  return (
    <div className="flex flex-col gap-4">
      {primaryMontages.map((item) => (
        <MontageCard
          key={`${item.characterName}:${item.montageName}`}
          id={id}
          entityType={entityType}
          item={item}
        />
      ))}
      {otherMontages.length > 0 && (
        <Collapsible className="rounded-md border">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-between rounded-md px-4 py-3"
            >
              <span className="font-medium">Other Montages</span>
              <Badge variant="secondary">{otherMontages.length}</Badge>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t p-4">
            <div className="flex flex-col gap-4">
              {otherMontages.map((item) => (
                <MontageCard
                  key={`${item.characterName}:${item.montageName}`}
                  id={id}
                  entityType={entityType}
                  item={item}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function MontageCard({
  id,
  entityType,
  item,
}: {
  id: number;
  entityType: EntityType;
  item: CharacterMontage;
}) {
  const { data: bullets } = useEntityBullets(id, entityType);
  const { data: damageInstances } = useEntityDamageInstances(id, entityType);
  const [viewMode, setViewMode] = React.useState<MontageViewMode>('damage');
  const hitRows: Array<MontageHitRow> = item.montage.bullets;
  const tagRows: Array<MontageTagRow> = item.montage.tags;
  const eventLines = item.montage.events.map(
    (event) => `${event.time.toFixed(3)}s -> ${event.name}`,
  );
  const bulletById = new Map(bullets.map((bullet) => [bullet.id, bullet]));
  const damageInstancesById = new Map(
    damageInstances.map((damageInstance) => [damageInstance.id, damageInstance]),
  );
  const damageRows: Array<MontageDamageRow> = hitRows
    .flatMap((hitRow) => {
      const bullet = bulletById.get(hitRow.bulletId);
      if (!bullet) {
        return [];
      }

      return transformBulletsToTimedHits(
        bullet,
        (bulletId) => {
          return bulletById.get(bulletId);
        },
        hitRow.time,
      ).map(({ damageId, time }) => ({
        bulletId: hitRow.bulletId,
        time,
        damageId,
        damageInstance: damageInstancesById.get(damageId),
      }));
    })
    .toSorted(
      (left, right) => left.time - right.time || left.damageId - right.damageId,
    );

  const tagColumns: Array<ColumnDef<MontageTagRow>> = [
    {
      accessorKey: 'time',
      header: 'Time',
      cell: ({ row }) => `${row.original.time.toFixed(3)}s`,
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20 font-mono text-sm',
      },
    },
    {
      accessorKey: 'name',
      header: 'Tag',
      meta: {
        headerClassName: 'min-w-80',
        cellClassName: 'min-w-80 font-mono text-sm break-all',
      },
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) =>
        row.original.duration === undefined
          ? 'n/a'
          : `${row.original.duration.toFixed(3)}s`,
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24 font-mono text-sm',
      },
    },
  ];

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 py-4">
        <div className="space-y-2">
          <CardTitle className="text-base">{item.montage.name}</CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            {item.skills.length > 0 ? (
              item.skills.map((skill) => (
                <Badge key={skill.gameId} variant="outline">
                  {skill.name}
                </Badge>
              ))
            ) : (
              <Badge variant="outline">Unmapped</Badge>
            )}
            <Badge variant="secondary">
              cancel:{' '}
              {item.montage.cancelTime === undefined
                ? 'n/a'
                : `${item.montage.cancelTime.toFixed(3)}s`}
            </Badge>
            <Badge variant="secondary">
              end:{' '}
              {item.montage.endTime === undefined
                ? 'n/a'
                : `${item.montage.endTime.toFixed(3)}s`}
            </Badge>
          </div>
        </div>
        <HoverJson value={item}>
          <span className="text-muted-foreground text-xs">raw</span>
        </HoverJson>
      </CardHeader>
      <CardContent className="grid gap-4 pt-0 pb-4 md:grid-cols-2">
        <div className="space-y-1 md:col-span-2">
          <Row justify="between" align="center" className="gap-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {viewMode === 'damage' ? 'Damage View' : 'Bullet View'}
            </p>
            <Row align="center" className="gap-2">
              <span className="text-sm">Bullet</span>
              <Switch
                checked={viewMode === 'damage'}
                onCheckedChange={(checked) =>
                  setViewMode(checked ? 'damage' : 'bullet')
                }
                aria-label={`Montage view for ${item.montage.name}`}
              />
              <span className="text-sm">Damage</span>
            </Row>
          </Row>
          {viewMode === 'damage' ? (
            <DamageView
              id={id}
              entityType={entityType}
              rows={damageRows}
              bulletById={bulletById}
            />
          ) : (
            <BulletView
              id={id}
              entityType={entityType}
              rows={hitRows}
              bulletById={bulletById}
            />
          )}
        </div>
        <div className="space-y-1 md:col-span-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Tags
          </p>
          <DataTable
            columns={tagColumns}
            data={tagRows}
            emptyMessage="No tags."
            classNames={{
              wrapper: 'bg-muted/30 rounded-md border',
            }}
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Events
          </p>
          <MontageFieldList items={eventLines} emptyLabel="None" />
        </div>
      </CardContent>
    </Card>
  );
}

function BulletView({
  id,
  entityType,
  rows,
  bulletById,
}: {
  id: number;
  entityType: EntityType;
  rows: Array<MontageHitRow>;
  bulletById: Map<string, Bullet>;
}) {
  const navigate = useNavigate();

  const columns: Array<ColumnDef<MontageHitRow>> = [
    {
      accessorKey: 'time',
      header: 'Time',
      cell: ({ row }) => `${row.original.time.toFixed(3)}s`,
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20 font-mono text-sm',
      },
    },
    {
      accessorKey: 'bulletId',
      header: 'Bullet ID',
      cell: ({ row }) => (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-auto px-0 font-mono"
          onClick={() =>
            navigate({
              to: '/game-data/$id',
              params: { id: String(id) },
              search: (previous) => ({
                ...previous,
                entityType,
                tab: 'bullets',
              }),
            })
          }
        >
          {row.original.bulletId}
        </Button>
      ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      id: 'requiredTags',
      header: 'Required Tags',
      cell: ({ row }) => {
        const tags = bulletById.get(row.original.bulletId)?.requiredTags ?? [];
        return tags.length === 0 ? <NullTableValue /> : <RawTagList tags={tags} />;
      },
      meta: {
        headerClassName: 'min-w-48',
        cellClassName: 'min-w-48',
      },
    },
    {
      id: 'forbiddenTags',
      header: 'Forbidden Tags',
      cell: ({ row }) => {
        const tags = bulletById.get(row.original.bulletId)?.forbiddenTags ?? [];
        return tags.length === 0 ? <NullTableValue /> : <RawTagList tags={tags} />;
      },
      meta: {
        headerClassName: 'min-w-48',
        cellClassName: 'min-w-48',
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="No hits."
      classNames={{
        wrapper: 'bg-muted/30 rounded-md border',
      }}
    />
  );
}

function DamageView({
  id,
  entityType,
  rows,
  bulletById,
}: {
  id: number;
  entityType: EntityType;
  rows: Array<MontageDamageRow>;
  bulletById: Map<string, Bullet>;
}) {
  const navigate = useNavigate();

  const columns: Array<ColumnDef<MontageDamageRow>> = [
    {
      accessorKey: 'time',
      header: 'Time',
      cell: ({ row }) => `${row.original.time.toFixed(3)}s`,
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20 font-mono text-sm',
      },
    },
    {
      accessorKey: 'damageId',
      header: 'Damage ID',
      cell: ({ row }) => (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-auto px-0 font-mono"
          onClick={() =>
            navigate({
              to: '/game-data/$id',
              params: { id: String(id) },
              search: (previous) => ({
                ...previous,
                entityType,
                tab: 'damage-instances',
              }),
            })
          }
        >
          {row.original.damageId}
        </Button>
      ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      accessorKey: 'bulletId',
      header: 'Source Bullet',
      cell: ({ row }) => (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-auto px-0 font-mono"
          onClick={() =>
            navigate({
              to: '/game-data/$id',
              params: { id: String(id) },
              search: (previous) => ({
                ...previous,
                entityType,
                tab: 'bullets',
              }),
            })
          }
        >
          {row.original.bulletId}
        </Button>
      ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      id: 'motionValue',
      header: 'Motion Value',
      cell: ({ row }) =>
        row.original.damageInstance ? (
          renderMotionValue(
            row.original.damageInstance.motionValue,
            row.original.damageInstance.scalingAttribute,
            row.original.damageInstance.motionValuePerStack,
          )
        ) : (
          <NullTableValue />
        ),
      meta: {
        headerClassName: 'min-w-56',
        cellClassName: 'min-w-56 font-mono text-sm',
      },
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) =>
        row.original.damageInstance ? (
          startCase(row.original.damageInstance.type)
        ) : (
          <NullTableValue />
        ),
      meta: {
        headerClassName: 'min-w-28',
        cellClassName: 'min-w-28',
      },
    },
    {
      id: 'attribute',
      header: 'Attribute',
      cell: ({ row }) =>
        row.original.damageInstance ? (
          startCase(row.original.damageInstance.attribute)
        ) : (
          <NullTableValue />
        ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24',
      },
    },
    {
      id: 'requiredTags',
      header: 'Required Tags',
      cell: ({ row }) => {
        const tags = bulletById.get(row.original.bulletId)?.requiredTags ?? [];
        return tags.length === 0 ? <NullTableValue /> : <RawTagList tags={tags} />;
      },
      meta: {
        headerClassName: 'min-w-48',
        cellClassName: 'min-w-48',
      },
    },
    {
      id: 'forbiddenTags',
      header: 'Forbidden Tags',
      cell: ({ row }) => {
        const tags = bulletById.get(row.original.bulletId)?.forbiddenTags ?? [];
        return tags.length === 0 ? <NullTableValue /> : <RawTagList tags={tags} />;
      },
      meta: {
        headerClassName: 'min-w-48',
        cellClassName: 'min-w-48',
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="No timed damage hits."
      classNames={{
        wrapper: 'bg-muted/30 rounded-md border',
      }}
    />
  );
}

function EntityHeader({ id, entityType }: { id: number; entityType: string }) {
  const { data } = useGameDataEntities({});
  const entity = data.find((gameDataEntity) => gameDataEntity.id === id);

  return (
    <div>
      <h2 className="text-2xl font-bold">{entity?.name ?? `ID ${id}`}</h2>
      <p className="text-muted-foreground text-sm">
        {startCase(entityType)}
        {entity?.description ? ` · ${entity.description}` : ''}
      </p>
    </div>
  );
}

function EntityBuffsPage() {
  const { id } = Route.useParams();
  const { entityType, tab } = Route.useSearch();
  const numericId = Number.parseInt(id);
  const navigate = useNavigate();
  const isCharacter = entityType === EntityType.CHARACTER;
  const activeTab = isCharacter || tab !== 'montages' ? (tab ?? 'buffs') : 'buffs';

  return (
    <Container padding="page" className="h-full min-h-0 max-w-6xl">
      <Stack gap="component" className="h-full min-h-0">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 self-start"
          onClick={() => navigate({ to: '/game-data' })}
        >
          ← Game Data
        </Button>
        <Suspense fallback={<div className="h-10" />}>
          <EntityHeader id={numericId} entityType={entityType} />
        </Suspense>
        <Tabs
          value={activeTab}
          onValueChange={(nextTab) =>
            navigate({
              to: '/game-data/$id',
              params: { id },
              search: {
                entityType,
                tab: nextTab as EntityGameDataTab,
              },
            })
          }
          className="min-h-0 flex-1 gap-4"
        >
          <TabsList className="w-fit">
            <TabsTrigger value="buffs">Buffs</TabsTrigger>
            <TabsTrigger value="modifiers">Modifiers</TabsTrigger>
            <TabsTrigger value="damage-instances">Damage Instances</TabsTrigger>
            <TabsTrigger value="bullets">Bullets</TabsTrigger>
            {isCharacter && <TabsTrigger value="montages">Montages</TabsTrigger>}
          </TabsList>
          <TabsContent value="buffs" className="min-h-0 flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <Card className="h-32">
                  <LoadingSpinnerContainer
                    message="Loading buffs..."
                    spinnerSize={40}
                  />
                </Card>
              }
            >
              <EntityBuffsList id={numericId} entityType={entityType as EntityType} />
            </Suspense>
          </TabsContent>
          <TabsContent value="modifiers" className="min-h-0 flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <Card className="h-32">
                  <LoadingSpinnerContainer
                    message="Loading modifiers..."
                    spinnerSize={40}
                  />
                </Card>
              }
            >
              <EntityModifiersList
                id={numericId}
                entityType={entityType as EntityType}
              />
            </Suspense>
          </TabsContent>
          <TabsContent
            value="damage-instances"
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <Suspense
              fallback={
                <Card className="h-32">
                  <LoadingSpinnerContainer
                    message="Loading damage instances..."
                    spinnerSize={40}
                  />
                </Card>
              }
            >
              <EntityDamageInstancesList
                id={numericId}
                entityType={entityType as EntityType}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="bullets" className="min-h-0 flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <Card className="h-32">
                  <LoadingSpinnerContainer
                    message="Loading bullets..."
                    spinnerSize={40}
                  />
                </Card>
              }
            >
              <EntityBulletsList id={numericId} entityType={entityType as EntityType} />
            </Suspense>
          </TabsContent>
          {isCharacter && (
            <TabsContent value="montages" className="min-h-0 flex-1 overflow-y-auto">
              <Suspense
                fallback={
                  <Card className="h-32">
                    <LoadingSpinnerContainer
                      message="Loading montages..."
                      spinnerSize={40}
                    />
                  </Card>
                }
              >
                <EntityMontagesList
                  id={numericId}
                  entityType={entityType as EntityType}
                />
              </Suspense>
            </TabsContent>
          )}
        </Tabs>
      </Stack>
    </Container>
  );
}

export const Route = createFileRoute('/game-data_/$id')({
  validateSearch: z.object({
    entityType: z.string(),
    tab: z.enum(ENTITY_GAME_DATA_TABS).optional(),
  }),
  component: EntityBuffsPage,
});
