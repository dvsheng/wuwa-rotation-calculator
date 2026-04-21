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
import { Container, Row, Stack } from '@/components/ui/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';
import { useEntityActivatableSkills } from '@/hooks/useEntityActivatableSkills';
import { useEntityBuffs } from '@/hooks/useEntityBuffs';
import { useEntityBullets } from '@/hooks/useEntityBullets';
import { useEntityDamageInstances } from '@/hooks/useEntityDamageInstances';
import { useEntityModifiers } from '@/hooks/useEntityModifiers';
import { useEntityMontages } from '@/hooks/useEntityMontages';
import { useGameDataEntities } from '@/hooks/useGameDataEntities';
import { Target } from '@/services/game-data/types';
import type { ActivatableSkill } from '@/services/game-data-v2/activatable-skills/types';
import type { Buff } from '@/services/game-data-v2/buffs';
import type { Bullet } from '@/services/game-data-v2/bullets';
import { transformBulletsToTimedHits } from '@/services/game-data-v2/bullets/transform-bullet-to-timed-hits';
import type { DamageInstance } from '@/services/game-data-v2/damage-instances/types';
import type { Modifier } from '@/services/game-data-v2/modifiers';
import { NotificationType } from '@/services/game-data-v2/montages';
import type { Montage } from '@/services/game-data-v2/montages';
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
type MontageWithDamageRows = {
  montage: Montage;
  damageRows: Array<MontageDamageRow>;
};
type MontageDamageRow = {
  bulletId: string;
  time: number;
  damageId: number;
  damageInstance?: DamageInstance;
  montageRequiredTags: Array<string>;
};
type MontageBullet = {
  bulletId: string;
  time: number;
  requiredTags: Array<string>;
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

function EntityBuffsList({ id }: { id: number }) {
  const { data } = useEntityBuffs(id);
  const buffs = data as Array<Buff>;

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
      data={buffs}
      classNames={{
        wrapper: 'bg-muted/30 rounded-md border',
      }}
    />
  );
}

function EntityModifiersList({ id }: { id: number }) {
  const { data } = useEntityModifiers(id);
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
                  <BuffValue value={buff.value} /> <Text>{startCase(buff.stat)}</Text>
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

function EntityDamageInstancesList({ id }: { id: number }) {
  const { data } = useEntityDamageInstances(id);

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

function EntityActivatableSkillsList({ id }: { id: number }) {
  const { data } = useEntityActivatableSkills(id);
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
      accessorKey: 'genre',
      header: 'Genre',
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

function EntityBulletsList({ id }: { id: number }) {
  const { data } = useEntityBullets(id);
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

function EntityAttacksList({ entityId }: { entityId: number }) {
  const { data: skills } = useEntityActivatableSkills(entityId);
  const { data: montages } = useEntityMontages(entityId);
  const { data: bullets } = useEntityBullets(entityId);
  const { data: damageInstances } = useEntityDamageInstances(entityId);

  if (skills.length === 0) {
    return <p className="text-muted-foreground text-sm">No attacks found.</p>;
  }

  const montagesById = new Map(
    montages.map((montage) => [getMontageKey(montage), montage]),
  );
  const bulletById = new Map(bullets.map((bullet) => [bullet.id, bullet]));
  const damageInstancesById = new Map(
    damageInstances.map((damageInstance) => [damageInstance.id, damageInstance]),
  );
  const attacksWithDamage = skills.flatMap((skill) => {
    const montagesWithDamageRows = skill.montages.flatMap((montageId) => {
      const montage = montagesById.get(montageId);
      if (!montage) return [];

      const damageRows = createMontageDamageRows({
        montage,
        bulletById,
        damageInstancesById,
      });

      return damageRows.length === 0 ? [] : [{ montage, damageRows }];
    });

    return montagesWithDamageRows.length === 0
      ? []
      : [{ skill, montagesWithDamageRows }];
  });

  if (attacksWithDamage.length === 0) {
    return <p className="text-muted-foreground text-sm">No attacks found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {attacksWithDamage.map(({ skill, montagesWithDamageRows }) => (
        <AttackCard
          key={skill.id}
          entityId={entityId}
          skill={skill}
          montagesWithDamageRows={montagesWithDamageRows}
          bulletById={bulletById}
        />
      ))}
    </div>
  );
}

function AttackCard({
  entityId,
  skill,
  montagesWithDamageRows,
  bulletById,
}: {
  entityId: number;
  skill: Attack;
  montagesWithDamageRows: Array<MontageWithDamageRows>;
  bulletById: Map<string, Bullet>;
}) {
  return (
    <Card id={`attack-${skill.id}`} className="gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 py-4">
        <div className="space-y-2">
          <CardTitle className="text-base">{skill.name}</CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="font-mono">
              {skill.id}
            </Badge>
            <Badge variant="secondary">genre: {skill.genre || 'n/a'}</Badge>
            <Badge variant="secondary">montages: {montagesWithDamageRows.length}</Badge>
          </div>
        </div>
        <DebugHoverIcon value={skill.raw} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0 pb-4">
        {montagesWithDamageRows.map(({ montage, damageRows }) => (
          <div key={getMontageKey(montage)} className="space-y-2">
            <Row justify="between" align="center" className="gap-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {montage.name}
              </p>
              <Badge variant="secondary">
                {getMontageBullets(montage).length} bullets
              </Badge>
            </Row>
            <DamageView entityId={entityId} rows={damageRows} bulletById={bulletById} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function NullTableValue() {
  return <span className="text-muted-foreground font-mono text-sm">null</span>;
}

function EntityMontagesList({ entityId }: { entityId: number }) {
  const { data } = useEntityMontages(entityId);

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
                  {notification.type} @ {notification.time.toFixed(3)}s
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

function getMontageBullets(montage: Montage): Array<MontageBullet> {
  return montage.notifications.flatMap((notification) => {
    if (notification.type !== NotificationType.SPAWN_BULLETS) return [];

    return notification.bullets.map((bullet) => ({
      bulletId: String(bullet.id),
      time: notification.time,
      requiredTags: bullet.condition?.requiredTags ?? [],
    }));
  });
}

function createMontageDamageRows({
  montage,
  bulletById,
  damageInstancesById,
}: {
  montage: Montage;
  bulletById: Map<string, Bullet>;
  damageInstancesById: Map<number, DamageInstance>;
}): Array<MontageDamageRow> {
  return getMontageBullets(montage)
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
        montageRequiredTags: hitRow.requiredTags,
      }));
    })
    .toSorted(
      (left, right) => left.time - right.time || left.damageId - right.damageId,
    );
}

function DamageView({
  entityId,
  rows,
  bulletById,
}: {
  entityId: number;
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
              params: { id: String(entityId) },
              search: (previous) => ({ ...previous, tab: 'damage-instances' }),
              hash: String(row.original.damageId),
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
              params: { id: String(entityId) },
              search: (previous) => ({ ...previous, tab: 'bullets' }),
              hash: String(row.original.bulletId),
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
      id: 'montageRequiredTags',
      header: 'Montage Required Tags',
      cell: ({ row }) => {
        const tags = row.original.montageRequiredTags;
        return tags.length === 0 ? <NullTableValue /> : <RawTagList tags={tags} />;
      },
      meta: {
        headerClassName: 'min-w-48',
        cellClassName: 'min-w-48',
      },
    },
    {
      id: 'requiredTags',
      header: 'Bullet Required Tags',
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
        <Tabs
          value={tab ?? 'montages'}
          onValueChange={(nextTab) =>
            navigate({
              to: '/game-data/$id',
              params: { id },
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
            <Suspense
              fallback={
                <Card className="h-32">
                  <LoadingSpinnerContainer
                    message="Loading attacks..."
                    spinnerSize={40}
                  />
                </Card>
              }
            >
              <EntityAttacksList entityId={numericId} />
            </Suspense>
          </TabsContent>
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
              <EntityBuffsList id={numericId} />
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
              <EntityModifiersList id={numericId} />
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
              <EntityDamageInstancesList id={numericId} />
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
              <EntityBulletsList id={numericId} />
            </Suspense>
          </TabsContent>
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
              <EntityMontagesList entityId={numericId} />
            </Suspense>
          </TabsContent>
          <TabsContent value="skill-info" className="min-h-0 flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <Card className="h-32">
                  <LoadingSpinnerContainer
                    message="Loading skill info..."
                    spinnerSize={40}
                  />
                </Card>
              }
            >
              <EntityActivatableSkillsList id={numericId} />
            </Suspense>
          </TabsContent>
        </Tabs>
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
