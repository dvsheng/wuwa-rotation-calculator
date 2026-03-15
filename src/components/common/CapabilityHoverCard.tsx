import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Row, Stack } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/typography';
import type { DetailedAttack, DetailedModifier } from '@/hooks/useTeamDetails';
import { cn } from '@/lib/utils';
import type {
  GameDataNumberNode,
  GameDataUserNumber,
} from '@/services/game-data/types';
import { CapabilityType, Target } from '@/services/game-data/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatLabel = (value: string): string => {
  return value
    .replaceAll(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
};

const formatNumber = (value: number): string => {
  return Number.isInteger(value) ? `${value}` : value.toFixed(3).replace(/\.?0+$/, '');
};

const formatMotionValue = (value: GameDataUserNumber): string => {
  if (typeof value === 'number') return formatNumber(value);
  return `P${value.parameterId}`;
};

const formatNodeValue = (node: GameDataNumberNode): string => {
  if (typeof node === 'number') return formatNumber(node);
  switch (node.type) {
    case 'userParameterizedNumber': {
      return `P${node.parameterId}`;
    }
    case 'statParameterizedNumber': {
      return formatLabel(node.stat);
    }
    default: {
      return 'Variable';
    }
  }
};

const TARGET_LABELS: Record<Target, string> = {
  [Target.TEAM]: 'Team',
  [Target.ENEMY]: 'Enemy',
  [Target.ACTIVE_CHARACTER]: 'Active',
  [Target.SELF]: 'Self',
};

// ─── Type guard ───────────────────────────────────────────────────────────────

const isDetailedAttack = (
  capability: DetailedAttack | DetailedModifier,
): capability is DetailedAttack => capability.capabilityType === CapabilityType.ATTACK;

// ─── Content components ───────────────────────────────────────────────────────

const AttackCapabilityContent = ({ capability }: { capability: DetailedAttack }) => {
  if (capability.damageInstances.length === 0) return;
  return (
    <Stack gap="trim">
      <Text as="div" variant="overline" tone="muted">
        Damage Instances
      </Text>
      <Stack gap="trim">
        {capability.damageInstances.map((di, index) => (
          <Row key={index} gap="inset" className="w-full">
            <Row gap="trim" className="min-w-0 flex-1">
              <Text as="span" variant="caption" className="capitalize">
                {di.attribute}
              </Text>
              <Text as="span" variant="caption" tone="muted">
                ·
              </Text>
              <Text as="span" variant="caption" tone="muted" className="truncate">
                {formatLabel(di.damageType)}
              </Text>
            </Row>
            <Text
              as="span"
              variant="caption"
              tabular={true}
              className="shrink-0 font-mono"
            >
              {formatMotionValue(di.motionValue)}
            </Text>
            <Text
              as="span"
              variant="overline"
              tone="muted"
              className="w-8 shrink-0 text-right"
            >
              {formatLabel(di.scalingStat)}
            </Text>
          </Row>
        ))}
      </Stack>
    </Stack>
  );
};

const ModifierCapabilityContent = ({
  capability,
}: {
  capability: DetailedModifier;
}) => {
  if (capability.modifiedStats.length === 0) return;
  return (
    <Stack gap="trim">
      <Text as="div" variant="overline" tone="muted">
        Modified Stats
      </Text>
      <Stack gap="trim">
        {capability.modifiedStats.map((stat, index) => (
          <Row key={index} gap="inset" className="w-full">
            <Text as="span" variant="overline" tone="muted" className="w-12">
              {TARGET_LABELS[stat.target]}
            </Text>
            <Text as="span" variant="caption" className="min-w-0 flex-1 truncate">
              {formatLabel(stat.stat)}
            </Text>
            <Text
              as="span"
              variant="caption"
              tabular={true}
              className="shrink-0 font-mono"
            >
              {formatNodeValue(stat.value)}
            </Text>
          </Row>
        ))}
      </Stack>
    </Stack>
  );
};

const CapabilityCardContent = ({
  capability,
}: {
  capability: DetailedAttack | DetailedModifier;
}) => {
  const isParameterized = (capability.parameters?.length ?? 0) > 0;
  const hasDetails = isDetailedAttack(capability)
    ? capability.damageInstances.length > 0
    : capability.modifiedStats.length > 0;

  return (
    <Stack gap="inset">
      <Row justify="between" align="center" gap="inset">
        <Text as="div" variant="bodySm" className="leading-trim font-semibold">
          {capability.name}
        </Text>
        {isParameterized && <Badge>Parameterized</Badge>}
      </Row>
      {capability.parentName && (
        <Text variant="caption" tone="muted">
          {capability.parentName}
        </Text>
      )}
      {capability.description && (
        <Text as="div" variant="caption">
          {capability.description}
        </Text>
      )}
      {(capability.description || capability.parentName) && hasDetails && <Separator />}
      {isDetailedAttack(capability) ? (
        <AttackCapabilityContent capability={capability} />
      ) : (
        <ModifierCapabilityContent capability={capability} />
      )}
    </Stack>
  );
};

// ─── Cursor-following variant (floating-ui) ───────────────────────────────────

const HOVER_CARD_CLASSES =
  'bg-popover text-popover-foreground z-50 rounded-md border p-4 shadow-md';

const CursorHoverCard = ({
  children,
  content,
  className,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const setFloatingReference = (node: Element | null) => {
    refs.setFloating(node as HTMLElement | null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    refs.setReference({
      getBoundingClientRect() {
        return {
          width: 0,
          height: 0,
          x: event.clientX,
          y: event.clientY,
          top: event.clientY,
          left: event.clientX,
          right: event.clientX,
          bottom: event.clientY,
        };
      },
    });
  };

  return (
    <>
      <div
        style={{ display: 'contents' }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onMouseMove={handleMouseMove}
      >
        {children}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={setFloatingReference}
            style={floatingStyles}
            className={cn(HOVER_CARD_CLASSES, 'max-w-80', className)}
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────

interface CapabilityHoverCardProperties {
  capability: DetailedAttack | DetailedModifier;
  children: React.ReactNode;
  className?: string;
  followCursor?: boolean;
}

export const CapabilityHoverCard = ({
  capability,
  children,
  className,
  followCursor = false,
}: CapabilityHoverCardProperties) => {
  const hasDescription = !!capability.description;
  const hasParent = !!capability.parentName;
  const hasDetails = isDetailedAttack(capability)
    ? capability.damageInstances.length > 0
    : capability.modifiedStats.length > 0;

  if (!hasDescription && !hasParent && !hasDetails) {
    return children;
  }

  const content = <CapabilityCardContent capability={capability} />;

  if (followCursor) {
    return (
      <CursorHoverCard content={content} className={className}>
        {children}
      </CursorHoverCard>
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="top" className={cn('w-auto max-w-80', className)}>
        {content}
      </HoverCardContent>
    </HoverCard>
  );
};
