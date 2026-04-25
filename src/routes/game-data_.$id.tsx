/* eslint-disable unicorn/filename-case */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { startCase } from 'es-toolkit';
import { Cat, User, Users } from 'lucide-react';
import React, { Suspense } from 'react';
import { z } from 'zod';

import { AttributeIcon } from '@/components/common/AssetIcon';
import { DebugHoverIcon } from '@/components/common/DebugHoverIcon';
import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
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
import { Container, Stack } from '@/components/ui/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEntityDetails } from '@/hooks/useEntityDetails';
import { useGameDataEntities } from '@/hooks/useGameDataEntities';
import { Target } from '@/services/game-data/types';
import { NotificationType } from '@/services/game-data-v2';
import type {
  ActivatableSkill,
  Buff,
  Bullet,
  DamageInstance,
  Modifier,
  Montage,
} from '@/services/game-data-v2';
import type {
  BuffEvent,
  DamageEvent,
  MontageEventGroup,
} from '@/services/game-data-v2/montages/methods';
import { transformMontageToEventGroups } from '@/services/game-data-v2/montages/methods';
import { Attribute } from '@/types/attribute';

const ENTITY_GAME_DATA_TABS = [
  'attacks',
  'buffs',
  'modifiers',
  'damage-instances',
  'bullets',
  'montages',
  'skill-info',
] as const;

type EntityGameDataTab = (typeof ENTITY_GAME_DATA_TABS)[number];
type NumberNode = Buff['value'];
type StackInfo = { valueAt1: number; valueAtMax: number; maxStacks: number };
type ClampInfo = { min: number; max: number; stat: string | undefined };
type Attack = ActivatableSkill & { raw: unknown };
type MontageWithEventGroups = {
  montage: Montage;
  eventGroups: Array<MontageEventGroup>;
};
type MontageDamageTotal = {
  scalingAttribute: DamageInstance['scalingAttribute'];
  motionValue: number;
  motionValuePerStack?: number;
};
type MontageNotification = Montage['notifications'][number];

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

function BuffEffectDisplay({ buff }: { buff: Buff }) {
  if (buff.value !== undefined) {
    return (
      <>
        <BuffValue value={buff.value} />{' '}
        {buff.stat && <span>{startCase(buff.stat)}</span>}
      </>
    );
  }
  if (buff.energy !== undefined) {
    return <span>{buff.energy} Energy</span>;
  }
  if (buff.concertoRegen !== undefined) {
    return <span>{buff.concertoRegen} Concerto</span>;
  }
  return <NullTableValue />;
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

function EntityBuffsList({ data }: { data: Array<Buff> }) {
  const buffs = data;

  if (buffs.length === 0) {
    return <p className="text-muted-foreground text-sm">No buffs found.</p>;
  }

  const columns: Array<ColumnDef<Buff>> = [
    {
      id: 'debug',
      header: '',
      cell: ({ row }) => <DebugHoverIcon value={row.original.raw} />,
      meta: {
        headerClassName: 'w-8',
        cellClassName: 'w-8',
      },
    },
    {
      accessorKey: 'buffId',
      header: 'ID',
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20 font-mono text-xs',
      },
    },
    {
      id: 'value',
      header: 'Value',
      cell: ({ row }) =>
        row.original.value === undefined ? (
          <NullTableValue />
        ) : (
          <BuffValue value={row.original.value} />
        ),
      meta: {
        headerClassName: 'min-w-28',
        cellClassName: 'min-w-28 font-mono text-sm',
      },
    },
    {
      accessorKey: 'stat',
      header: 'Stat',
      cell: ({ row }) =>
        row.original.stat === undefined ? (
          <NullTableValue />
        ) : (
          startCase(row.original.stat)
        ),
      meta: {
        headerClassName: 'min-w-28',
        cellClassName: 'min-w-28',
      },
    },
    {
      id: 'energy',
      header: 'Energy',
      cell: ({ row }) =>
        row.original.energy === undefined ? (
          <NullTableValue />
        ) : (
          <span className="font-mono text-sm">{row.original.energy}</span>
        ),
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20',
      },
    },
    {
      id: 'concertoRegen',
      header: 'Concerto',
      cell: ({ row }) =>
        row.original.concertoRegen === undefined ? (
          <NullTableValue />
        ) : (
          <span className="font-mono text-sm">{row.original.concertoRegen}</span>
        ),
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20',
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
      cell: ({ row }) => <BuffTags tags={row.original.tags ?? []} />,
      meta: {
        headerClassName: 'min-w-40',
        cellClassName: 'min-w-40',
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={buffs}
      classNames={{
        wrapper: 'bg-muted/30 rounded-md border',
      }}
    />
  );
}

function EntityModifiersList({ data }: { data: Array<Modifier> }) {
  const modifiers = data;

  if (modifiers.length === 0) {
    return <p className="text-muted-foreground text-sm">No modifiers found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {modifiers.map((modifier, index) => (
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
  const modifierDurations = [...new Set(modifier.buffs.map((buff) => buff.duration))];

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 py-4">
        <div className="space-y-2">
          <CardTitle className="text-base">Modifier {index + 1}</CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">{modifier.buffs.length} buffs</Badge>
            {modifierDurations.map((duration) => (
              <Badge key={String(duration)} variant="secondary">
                {duration === undefined ? 'No Duration' : `${duration}s`}
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
              {buff.type && <Badge variant="secondary">{startCase(buff.type)}</Badge>}
              {buff.target && (
                <Badge variant="secondary" className="gap-1">
                  {TARGET_ICON[buff.target]}
                  {startCase(buff.target)}
                </Badge>
              )}
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
                  <BuffEffectDisplay buff={buff} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Applies To
                </p>
                <BuffTags tags={buff.tags ?? []} />
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

function MontageDamageTotalView({ totals }: { totals: Array<MontageDamageTotal> }) {
  if (totals.length === 0) return <NullTableValue />;

  return (
    <div className="flex flex-col gap-1 font-mono text-sm">
      {totals.map((total) => (
        <span key={total.scalingAttribute}>
          {renderMotionValue(
            total.motionValue,
            total.scalingAttribute,
            total.motionValuePerStack,
          )}
        </span>
      ))}
    </div>
  );
}

function createDamageGroupTotals(group: MontageEventGroup): Array<MontageDamageTotal> {
  const totalsByScalingAttribute = Map.groupBy(
    group.events.filter((event): event is DamageEvent => event.eventType === 'damage'),
    (event) => event.scalingAttribute,
  );

  return [...totalsByScalingAttribute.entries()]
    .map(([scalingAttribute, events]) => {
      const motionValue = events.reduce((total, event) => total + event.motionValue, 0);
      const motionValuePerStack = events.reduce(
        (total, event) => total + (event.motionValuePerStack ?? 0),
        0,
      );
      return {
        scalingAttribute,
        motionValue,
        motionValuePerStack:
          motionValuePerStack === 0 ? undefined : motionValuePerStack,
      };
    })
    .toSorted((left, right) =>
      left.scalingAttribute.localeCompare(right.scalingAttribute),
    );
}

type DamageInstanceTableRow = DamageInstance;

function EntityDamageInstancesList({ data }: { data: Array<DamageInstance> }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No damage instances found.</p>;
  }

  const columns: Array<ColumnDef<DamageInstanceTableRow>> = [
    {
      id: 'debug',
      header: '',
      cell: ({ row }) => <DebugHoverIcon value={row.original} />,
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

function EntityActivatableSkillsList({
  id,
  data,
}: {
  id: number;
  data: Array<Attack>;
}) {
  const navigate = useNavigate();

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No skill info found.</p>;
  }

  const columns: Array<ColumnDef<(typeof data)[number]>> = [
    {
      id: 'debug',
      header: '',
      cell: ({ row }) => <DebugHoverIcon value={row.original.raw} />,
      meta: { headerClassName: 'w-8', cellClassName: 'w-8' },
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
      accessorKey: 'name',
      header: 'Name',
      meta: { headerClassName: 'min-w-48', cellClassName: 'min-w-48' },
    },
    {
      accessorKey: 'skillType',
      header: 'Skill Type',
      meta: { headerClassName: 'min-w-32', cellClassName: 'min-w-32' },
    },
    {
      id: 'montages',
      header: 'Montages',
      cell: ({ row }) =>
        row.original.montages.length === 0 ? (
          <NullTableValue />
        ) : (
          <div className="flex flex-col gap-0.5">
            {row.original.montages.map((montage) => (
              <Button
                key={montage}
                type="button"
                variant="link"
                size="xs"
                className="h-auto justify-start px-0 font-mono text-xs"
                onClick={() => {
                  const lastDash = montage.lastIndexOf('-');
                  const montageId = `${montage.slice(lastDash + 1)}:${montage.slice(0, lastDash)}`;
                  navigate({
                    to: '/game-data/$id',
                    params: { id: String(id) },
                    search: (previous) => ({ ...previous, tab: 'montages' }),
                    hash: montageId,
                  });
                }}
              >
                {montage}
              </Button>
            ))}
          </div>
        ),
      meta: { headerClassName: 'min-w-64', cellClassName: 'min-w-64' },
    },
    {
      accessorKey: 'toughRatio',
      header: 'Tough Ratio',
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24 font-mono text-sm',
      },
    },
    {
      id: 'buffsOnStart',
      header: 'On Start',
      cell: ({ row }) =>
        row.original.buffs.onStart.length === 0 ? (
          <NullTableValue />
        ) : (
          <HoverJson value={row.original.buffs.onStart}>
            <Badge variant="secondary">{row.original.buffs.onStart.length}</Badge>
          </HoverJson>
        ),
      meta: { headerClassName: 'min-w-24', cellClassName: 'min-w-24' },
    },
    {
      id: 'buffsWhileActive',
      header: 'While Active',
      cell: ({ row }) =>
        row.original.buffs.whileActive.length === 0 ? (
          <NullTableValue />
        ) : (
          <HoverJson value={row.original.buffs.whileActive}>
            <Badge variant="secondary">{row.original.buffs.whileActive.length}</Badge>
          </HoverJson>
        ),
      meta: { headerClassName: 'min-w-28', cellClassName: 'min-w-28' },
    },
    {
      id: 'buffsOnEnd',
      header: 'On End',
      cell: ({ row }) =>
        row.original.buffs.onEnd.length === 0 ? (
          <NullTableValue />
        ) : (
          <HoverJson value={row.original.buffs.onEnd}>
            <Badge variant="secondary">{row.original.buffs.onEnd.length}</Badge>
          </HoverJson>
        ),
      meta: { headerClassName: 'min-w-24', cellClassName: 'min-w-24' },
    },
    {
      id: 'tags',
      header: 'Tags',
      cell: ({ row }) =>
        row.original.tags.length === 0 ? (
          <NullTableValue />
        ) : (
          <HoverJson value={row.original.tags}>
            <Badge variant="secondary">{row.original.tags.length}</Badge>
          </HoverJson>
        ),
      meta: { headerClassName: 'min-w-20', cellClassName: 'min-w-20' },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      classNames={{ wrapper: 'bg-muted/30 rounded-md border' }}
    />
  );
}

function EntityBulletsList({ id, data }: { id: number; data: Array<Bullet> }) {
  const navigate = useNavigate();

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No bullets found.</p>;
  }

  const columns: Array<ColumnDef<(typeof data)[number]>> = [
    {
      id: 'debug',
      header: '',
      cell: ({ row }) => <DebugHoverIcon value={row.original.raw} />,
      meta: { headerClassName: 'w-8', cellClassName: 'w-8' },
    },
    {
      accessorKey: 'id',
      header: 'ID',
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24 font-mono text-xs',
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.original.name || <NullTableValue />,
      meta: { headerClassName: 'min-w-48', cellClassName: 'min-w-48' },
    },
    {
      id: 'hits',
      header: 'Damage',
      cell: ({ row }) =>
        row.original.hits.length === 0 ? (
          <NullTableValue />
        ) : (
          <div className="flex flex-col gap-0.5">
            {row.original.hits.map((damageId) => (
              <Button
                key={damageId}
                type="button"
                variant="link"
                size="xs"
                className="h-auto justify-start px-0 font-mono text-xs"
                onClick={() =>
                  navigate({
                    to: '/game-data/$id',
                    params: { id: String(id) },
                    search: (previous) => ({
                      ...previous,
                      tab: 'damage-instances',
                    }),
                    hash: String(damageId),
                  })
                }
              >
                {damageId}
              </Button>
            ))}
          </div>
        ),
      meta: { headerClassName: 'min-w-24', cellClassName: 'min-w-24' },
    },
    {
      id: 'children',
      header: 'Children',
      cell: ({ row }) =>
        row.original.children.length === 0 ? (
          <NullTableValue />
        ) : (
          <HoverJson value={row.original.children}>
            <Badge variant="secondary">{row.original.children.length}</Badge>
          </HoverJson>
        ),
      meta: { headerClassName: 'min-w-24', cellClassName: 'min-w-24' },
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) => `${row.original.duration.toFixed(3)}s`,
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24 font-mono text-sm',
      },
    },
    {
      accessorKey: 'hitInterval',
      header: 'Hit Interval',
      cell: ({ row }) => `${row.original.hitInterval.toFixed(3)}s`,
      meta: {
        headerClassName: 'min-w-28',
        cellClassName: 'min-w-28 font-mono text-sm',
      },
    },
    {
      accessorKey: 'totalHitCap',
      header: 'Hit Cap',
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20 font-mono text-sm',
      },
    },
    {
      id: 'requiredTags',
      header: 'Required Tags',
      cell: ({ row }) => {
        const tags = row.original.requiredTags;
        return tags.length === 0 ? <NullTableValue /> : <RawTagList tags={tags} />;
      },
      meta: { headerClassName: 'min-w-48', cellClassName: 'min-w-48' },
    },
    {
      id: 'forbiddenTags',
      header: 'Forbidden Tags',
      cell: ({ row }) => {
        const tags = row.original.forbiddenTags;
        return tags.length === 0 ? <NullTableValue /> : <RawTagList tags={tags} />;
      },
      meta: { headerClassName: 'min-w-48', cellClassName: 'min-w-48' },
    },
    {
      id: 'onHitBuffs',
      header: 'On Hit Buffs',
      cell: ({ row }) => {
        const buffCount = Object.values(row.original.onHitBuffs).reduce(
          (total, buffs) => total + buffs.length,
          0,
        );

        return buffCount === 0 ? (
          <NullTableValue />
        ) : (
          <HoverJson value={row.original.onHitBuffs}>
            <Badge variant="secondary">{buffCount}</Badge>
          </HoverJson>
        );
      },
      meta: { headerClassName: 'min-w-28', cellClassName: 'min-w-28' },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      classNames={{ wrapper: 'bg-muted/30 rounded-md border' }}
    />
  );
}

function EntityAttacksList({
  skills,
  montages,
  bullets,
  damageInstances,
  buffs,
}: {
  skills: Array<Attack>;
  montages: Array<Montage>;
  bullets: Array<Bullet>;
  damageInstances: Array<DamageInstance>;
  buffs: Array<Buff>;
}) {
  if (skills.length === 0) {
    return <p className="text-muted-foreground text-sm">No attacks found.</p>;
  }

  const montagesById = new Map(
    montages.map((montage) => [getMontageKey(montage), montage]),
  );
  const bulletMap = Object.fromEntries(
    bullets.map((bullet) => [Number(bullet.id), bullet]),
  ) as Partial<Record<number, Bullet>>;
  const damageMap = Object.fromEntries(
    damageInstances.map((di) => [di.id, di]),
  ) as Partial<Record<number, DamageInstance>>;
  const buffMap = Object.fromEntries(
    buffs.map((buff) => [buff.buffId, buff]),
  ) as Partial<Record<number, Buff>>;
  const attacksWithDamage = skills.flatMap((skill) => {
    const montagesWithEventGroups = skill.montages.flatMap((montageId) => {
      const montage = montagesById.get(montageId);
      if (!montage) return [];

      const eventGroups = transformMontageToEventGroups({
        montage,
        bulletMap,
        damageMap,
        buffMap,
        onStartBuffs: skill.buffs.onStart,
        onEndBuffs: skill.buffs.onEnd,
      });

      return eventGroups.length === 0 ? [] : [{ montage, eventGroups }];
    });

    return montagesWithEventGroups.length === 0
      ? []
      : [{ skill, montagesWithEventGroups }];
  });

  if (attacksWithDamage.length === 0) {
    return <p className="text-muted-foreground text-sm">No attacks found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {attacksWithDamage.map(({ skill, montagesWithEventGroups }) => (
        <AttackCard
          key={skill.id}
          skill={skill}
          montagesWithEventGroups={montagesWithEventGroups}
        />
      ))}
    </div>
  );
}

function AttackCard({
  skill,
  montagesWithEventGroups,
}: {
  skill: Attack;
  montagesWithEventGroups: Array<MontageWithEventGroups>;
}) {
  const { whileActive } = skill.buffs;
  return (
    <Card id={`attack-${skill.id}`} className="gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 py-4">
        <div className="space-y-2">
          <CardTitle className="text-base">{skill.name}</CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">{skill.skillType}</Badge>
            {whileActive.length > 0 && (
              <HoverJson value={whileActive}>
                <Badge variant="outline">
                  While Active: {whileActive.length} buffs
                </Badge>
              </HoverJson>
            )}
          </div>
        </div>
        <DebugHoverIcon value={skill.raw} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0 pb-4">
        {montagesWithEventGroups.map(({ montage, eventGroups }) => (
          <MontageAttackSection
            key={getMontageKey(montage)}
            montage={montage}
            eventGroups={eventGroups}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function MontageAttackSection({
  montage,
  eventGroups,
}: {
  montage: Montage;
  eventGroups: Array<MontageEventGroup>;
}) {
  return (
    <div className="bg-muted/20 rounded-md border p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {montage.name}
        </p>
        {montage.effectiveTime !== undefined && (
          <span className="text-muted-foreground font-mono text-xs">
            {montage.effectiveTime.toFixed(3)}s
          </span>
        )}
      </div>
      <div className="space-y-4">
        {eventGroups.map((group, index) => (
          <EventGroupSection key={index} index={index} group={group} />
        ))}
      </div>
    </div>
  );
}

function EventGroupSection({
  index,
  group,
}: {
  index: number;
  group: MontageEventGroup;
}) {
  type EventRow = DamageEvent | BuffEvent;
  const eventRows: Array<EventRow> = group.events.toSorted((a, b) => a.time - b.time);
  const columns: Array<ColumnDef<EventRow>> = [
    {
      id: 'debug',
      header: '',
      cell: ({ row }) => <DebugHoverIcon value={row.original.raw} />,
      meta: { headerClassName: 'w-8', cellClassName: 'w-8' },
    },
    {
      id: 'time',
      header: 'Time',
      cell: ({ row }) => `${row.original.time.toFixed(3)}s`,
      meta: {
        headerClassName: 'min-w-20',
        cellClassName: 'min-w-20 font-mono text-sm',
      },
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) =>
        row.original.eventType === 'damage' ? (
          <Badge variant="outline" className="text-xs">
            Hit
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Buff
          </Badge>
        ),
      meta: { headerClassName: 'min-w-16', cellClassName: 'min-w-16' },
    },
    {
      id: 'motionValue',
      header: 'Motion Value',
      cell: ({ row }) =>
        row.original.eventType === 'damage' ? (
          renderMotionValue(
            row.original.motionValue,
            row.original.scalingAttribute,
            row.original.motionValuePerStack,
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
      id: 'damageType',
      header: 'Damage Type',
      cell: ({ row }) =>
        row.original.eventType === 'damage' ? (
          startCase(row.original.damageType)
        ) : (
          <NullTableValue />
        ),
      meta: { headerClassName: 'min-w-28', cellClassName: 'min-w-28' },
    },
    {
      id: 'buffId',
      header: 'Buff ID',
      cell: ({ row }) =>
        row.original.eventType === 'buff' ? (
          <span className="font-mono text-sm">{row.original.buffId}</span>
        ) : (
          <NullTableValue />
        ),
      meta: { headerClassName: 'min-w-20', cellClassName: 'min-w-20' },
    },
    {
      id: 'energy',
      header: 'Energy',
      cell: ({ row }) =>
        row.original.eventType === 'damage' ? (
          <span className="font-mono text-sm">{row.original.energy}</span>
        ) : (
          <NullTableValue />
        ),
      meta: { headerClassName: 'min-w-20', cellClassName: 'min-w-20' },
    },
    {
      id: 'concerto',
      header: 'Concerto',
      cell: ({ row }) =>
        row.original.eventType === 'damage' ? (
          <span className="font-mono text-sm">{row.original.concertoRegen}</span>
        ) : (
          <NullTableValue />
        ),
      meta: { headerClassName: 'min-w-20', cellClassName: 'min-w-20' },
    },
  ];

  const totals = createDamageGroupTotals(group);
  const damageEvents = group.events.filter(
    (event): event is DamageEvent => event.eventType === 'damage',
  );
  const totalEnergy = damageEvents.reduce((sum, event) => sum + event.energy, 0);
  const totalConcerto = damageEvents.reduce(
    (sum, event) => sum + event.concertoRegen,
    0,
  );
  const hasAnyTags = group.requiredTags.length > 0 || group.forbiddenTags.length > 0;

  return (
    <div className="space-y-2">
      <div className="bg-muted/30 rounded-md border p-3">
        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          Event Group {index + 1}
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Total Damage
            </p>
            <MontageDamageTotalView totals={totals} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Total Energy
            </p>
            <p className="font-mono text-sm">{totalEnergy}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Total Concerto
            </p>
            <p className="font-mono text-sm">{totalConcerto}</p>
          </div>
        </div>
        {hasAnyTags && (
          <div className="mt-3 flex flex-wrap gap-4 border-t pt-3">
            {group.requiredTags.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                  Required Tags
                </p>
                <RawTagList tags={group.requiredTags} />
              </div>
            )}
            {group.forbiddenTags.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                  Forbidden Tags
                </p>
                <RawTagList tags={group.forbiddenTags} />
              </div>
            )}
          </div>
        )}
      </div>
      <DataTable
        columns={columns}
        data={eventRows}
        emptyMessage="No events."
        classNames={{ wrapper: 'bg-muted/30 rounded-md border' }}
      />
    </div>
  );
}

function NullTableValue() {
  return <span className="text-muted-foreground font-mono text-sm">null</span>;
}

function EntityMontagesList({ data }: { data: Array<Montage> }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No montages found.</p>;
  }

  const relevantMontages = data.filter((montage) => isRelevantMontage(montage));
  const otherMontages = data.filter((montage) => !isRelevantMontage(montage));

  return (
    <div className="flex flex-col gap-4">
      {relevantMontages.length === 0 ? (
        <p className="text-muted-foreground text-sm">No relevant montages found.</p>
      ) : (
        <MontageTable data={relevantMontages} allMontages={data} />
      )}
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
            <MontageTable data={otherMontages} allMontages={data} />
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function MontageTable({
  data,
  allMontages,
}: {
  data: Array<Montage>;
  allMontages: Array<Montage>;
}) {
  const showCharacterName =
    new Set(allMontages.map((montage) => montage.characterName)).size > 1;
  const columns: Array<ColumnDef<(typeof data)[number]>> = [
    {
      id: 'debug',
      header: '',
      cell: ({ row }) => <DebugHoverIcon value={row.original.raw} />,
      meta: { headerClassName: 'w-8', cellClassName: 'w-8' },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      meta: { headerClassName: 'min-w-48', cellClassName: 'min-w-48' },
    },
    ...(showCharacterName
      ? [
          {
            accessorKey: 'characterName',
            header: 'Character',
            meta: {
              headerClassName: 'min-w-32',
              cellClassName: 'min-w-32 font-mono text-xs',
            },
          } satisfies ColumnDef<(typeof data)[number]>,
        ]
      : []),
    {
      accessorKey: 'effectiveTime',
      header: 'Effective',
      cell: ({ row }) =>
        row.original.effectiveTime === undefined ? (
          <NullTableValue />
        ) : (
          `${row.original.effectiveTime.toFixed(3)}s`
        ),
      meta: {
        headerClassName: 'min-w-24',
        cellClassName: 'min-w-24 font-mono text-sm',
      },
    },
    {
      id: 'notifications',
      header: 'Notifications',
      cell: ({ row }) =>
        row.original.notifications.length === 0 ? (
          <NullTableValue />
        ) : (
          <div className="flex flex-col gap-1">
            {row.original.notifications.map((notification, index) => (
              <HoverJson
                key={`${notification.type}:${notification.time}:${index}`}
                value={notification}
              >
                <span className="text-muted-foreground font-mono text-xs">
                  {getNotificationSummary(notification)} @{' '}
                  {notification.time.toFixed(3)}s
                </span>
              </HoverJson>
            ))}
          </div>
        ),
      meta: {
        headerClassName: 'min-w-56',
        cellClassName: 'min-w-56',
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      classNames={{ wrapper: 'bg-muted/30 rounded-md border' }}
    />
  );
}

function isRelevantMontage(montage: Montage): boolean {
  return (
    montage.effectiveTime !== undefined &&
    montage.notifications.length > 0 &&
    !montage.name.toLowerCase().includes('rogue')
  );
}

function getMontageKey(montage: Montage): string {
  return `${montage.raw.name}-${montage.characterName}`;
}

function getNotificationSummary(notification: MontageNotification): string {
  switch (notification.type) {
    case NotificationType.SPAWN_BULLETS: {
      return `${notification.type}: ${notification.bullets.length} bullets`;
    }
    case NotificationType.DYNAMIC_BEHAVIOR: {
      const bulletCount = notification.options.reduce(
        (total, option) => total + option.bullets.length,
        0,
      );
      return `${notification.type}: ${bulletCount} bullets / ${notification.options.length} options`;
    }
    case NotificationType.APPLY_BUFF: {
      return `${notification.type}: ${notification.buffs.length} buffs`;
    }
    case NotificationType.ADD_TAG: {
      return `${notification.type}: ${notification.name}`;
    }
    case NotificationType.SEND_EVENT: {
      return `${notification.type}: ${notification.name}`;
    }
  }
}

function EntityHeader({ id }: { id: number }) {
  const { data } = useGameDataEntities({});
  const entity = data.find((gameDataEntity) => gameDataEntity.id === id);

  return (
    <div>
      <h2 className="text-2xl font-bold">{entity?.name ?? `ID ${id}`}</h2>
      <p className="text-muted-foreground text-sm">
        {entity?.description ? ` · ${entity.description}` : ''}
      </p>
    </div>
  );
}

function EntityGameDataTabs({
  id,
  tab,
}: {
  id: number;
  tab: EntityGameDataTab | undefined;
}) {
  const { data } = useEntityDetails(id);
  const navigate = useNavigate();

  return (
    <Tabs
      value={tab ?? 'montages'}
      onValueChange={(nextTab) =>
        navigate({
          to: '/game-data/$id',
          params: { id: String(id) },
          search: {
            tab: nextTab as EntityGameDataTab,
          },
        })
      }
      className="min-h-0 flex-1 gap-4"
    >
      <TabsList className="w-fit">
        <TabsTrigger value="attacks">Attacks</TabsTrigger>
        <TabsTrigger value="buffs">Buffs</TabsTrigger>
        <TabsTrigger value="modifiers">Modifiers</TabsTrigger>
        <TabsTrigger value="damage-instances">Damage Instances</TabsTrigger>
        <TabsTrigger value="bullets">Bullets</TabsTrigger>
        <TabsTrigger value="montages">Montages</TabsTrigger>
        <TabsTrigger value="skill-info">Skill Info</TabsTrigger>
      </TabsList>
      <TabsContent value="attacks" className="min-h-0 flex-1 overflow-y-auto">
        <EntityAttacksList
          skills={data.activatableSkills}
          montages={data.montages}
          bullets={data.bullets}
          damageInstances={data.damageInstances}
          buffs={data.buffs}
        />
      </TabsContent>
      <TabsContent value="buffs" className="min-h-0 flex-1 overflow-y-auto">
        <EntityBuffsList data={data.buffs} />
      </TabsContent>
      <TabsContent value="modifiers" className="min-h-0 flex-1 overflow-y-auto">
        <EntityModifiersList data={data.modifiers} />
      </TabsContent>
      <TabsContent value="damage-instances" className="min-h-0 flex-1 overflow-y-auto">
        <EntityDamageInstancesList data={data.damageInstances} />
      </TabsContent>
      <TabsContent value="bullets" className="min-h-0 flex-1 overflow-y-auto">
        <EntityBulletsList id={data.id} data={data.bullets} />
      </TabsContent>
      <TabsContent value="montages" className="min-h-0 flex-1 overflow-y-auto">
        <EntityMontagesList data={data.montages} />
      </TabsContent>
      <TabsContent value="skill-info" className="min-h-0 flex-1 overflow-y-auto">
        <EntityActivatableSkillsList id={data.id} data={data.activatableSkills} />
      </TabsContent>
    </Tabs>
  );
}

function EntityBuffsPage() {
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();
  const numericId = Number.parseInt(id);
  const navigate = useNavigate();

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
          <EntityHeader id={numericId} />
        </Suspense>
        <Suspense
          fallback={
            <Card className="h-32">
              <LoadingSpinnerContainer
                message="Loading game data..."
                spinnerSize={40}
              />
            </Card>
          }
        >
          <EntityGameDataTabs id={numericId} tab={tab} />
        </Suspense>
      </Stack>
    </Container>
  );
}

export const Route = createFileRoute('/game-data_/$id')({
  validateSearch: z.object({
    tab: z.enum(ENTITY_GAME_DATA_TABS).optional(),
  }),
  component: EntityBuffsPage,
});
