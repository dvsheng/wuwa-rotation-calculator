import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getCapabilityAnchorId } from '@/components/entities/entityView.utilities';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Row, Stack } from '@/components/ui/layout';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/typography';
import { isDetailedAttack } from '@/hooks/useTeamDetails';
import type { CharacterAttack, CharacterModifier } from '@/hooks/useTeamDetails';
import { cn } from '@/lib/utils';
import { Target } from '@/services/game-data/types';

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

const formatValue = (value: unknown): string => {
  if (typeof value === 'number') return formatNumber(value);
  return 'Dynamic';
};

const TARGET_LABELS: Record<Target, string> = {
  [Target.TEAM]: 'Team',
  [Target.ENEMY]: 'Enemy',
  [Target.ACTIVE_CHARACTER]: 'Active',
  [Target.SELF]: 'Self',
};

const HOVER_CARD_OPEN_DELAY_MS = 200;
const HOVER_CARD_CLOSE_DELAY_MS = 100;
const CURSOR_HOVER_CARD_VIEWPORT_PADDING = 16;
const CURSOR_HOVER_CARD_ANIMATION_CLASS_NAME =
  'animate-in fade-in-0 zoom-in-95 duration-200';

// ─── Content components ───────────────────────────────────────────────────────

const AttackCapabilityContent = ({ capability }: { capability: CharacterAttack }) => {
  if (capability.capabilityJson.damageInstances.length === 0) return;
  return (
    <Stack gap="trim">
      <Text as="div" variant="overline" tone="muted">
        Damage Instances
      </Text>
      <Stack gap="trim">
        {capability.capabilityJson.damageInstances.map((di, index) => (
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
              {formatValue(di.motionValue)}
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
  capability: CharacterModifier;
}) => {
  if (capability.capabilityJson.modifiedStats.length === 0) return;
  return (
    <Stack gap="trim">
      <Text as="div" variant="overline" tone="muted">
        Modified Stats
      </Text>
      <Stack gap="trim">
        {capability.capabilityJson.modifiedStats.map((stat, index) => (
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
              {formatValue(stat.value)}
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
  capability: CharacterAttack | CharacterModifier;
}) => {
  const isParameterized = capability.parameters.length > 0;
  const hasDetails = isDetailedAttack(capability)
    ? capability.capabilityJson.damageInstances.length > 0
    : capability.capabilityJson.modifiedStats.length > 0;
  const entityCapabilityHash = getCapabilityAnchorId(capability.id);

  return (
    <Stack gap="inset">
      <Row justify="between" fullWidth>
        <Text
          as="div"
          variant="bodySm"
          className="min-w-0 flex-1 leading-tight font-semibold wrap-break-word"
        >
          {capability.name}
        </Text>
        {isParameterized && <Badge className="shrink-0">Parameterized</Badge>}
      </Row>
      {capability.parentName && (
        <Text variant="caption" tone="muted" className="wrap-break-word">
          {capability.parentName}
        </Text>
      )}
      {capability.description && (
        <Text as="div" variant="caption" className="wrap-break-word">
          {capability.description}
        </Text>
      )}
      {(capability.description || capability.parentName) && hasDetails && <Separator />}
      {isDetailedAttack(capability) ? (
        <AttackCapabilityContent capability={capability} />
      ) : (
        <ModifierCapabilityContent capability={capability} />
      )}
      <Link
        to="/entities/$id"
        params={{ id: String(capability.entityId) }}
        hash={entityCapabilityHash}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium underline-offset-4 transition-colors hover:underline"
      >
        Open entity page
        <ArrowUpRight />
      </Link>
    </Stack>
  );
};

// ─── Cursor-following variant (floating-ui) ───────────────────────────────────

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
  const openTimeoutReference = useRef<
    ReturnType<typeof globalThis.setTimeout> | undefined
  >(undefined);
  const closeTimeoutReference = useRef<
    ReturnType<typeof globalThis.setTimeout> | undefined
  >(undefined);

  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    middleware: [
      offset(8),
      flip({ padding: CURSOR_HOVER_CARD_VIEWPORT_PADDING }),
      shift({ padding: CURSOR_HOVER_CARD_VIEWPORT_PADDING }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    return () => {
      if (openTimeoutReference.current !== undefined) {
        globalThis.clearTimeout(openTimeoutReference.current);
      }
      if (closeTimeoutReference.current !== undefined) {
        globalThis.clearTimeout(closeTimeoutReference.current);
      }
    };
  }, []);

  const setFloatingReference = (node: Element | null) => {
    refs.setFloating(node as HTMLElement | null);
  };

  const updateReferencePosition = (x: number, y: number) => {
    refs.setReference({
      getBoundingClientRect() {
        return {
          width: 0,
          height: 0,
          x,
          y,
          top: y,
          left: x,
          right: x,
          bottom: y,
        };
      },
    });
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    updateReferencePosition(event.clientX, event.clientY);

    if (closeTimeoutReference.current !== undefined) {
      globalThis.clearTimeout(closeTimeoutReference.current);
      closeTimeoutReference.current = undefined;
    }
    if (openTimeoutReference.current !== undefined) {
      globalThis.clearTimeout(openTimeoutReference.current);
    }

    openTimeoutReference.current = globalThis.setTimeout(() => {
      setIsOpen(true);
      openTimeoutReference.current = undefined;
    }, HOVER_CARD_OPEN_DELAY_MS);
  };

  const handleMouseLeave = () => {
    if (openTimeoutReference.current !== undefined) {
      globalThis.clearTimeout(openTimeoutReference.current);
      openTimeoutReference.current = undefined;
    }
    if (closeTimeoutReference.current !== undefined) {
      globalThis.clearTimeout(closeTimeoutReference.current);
    }

    closeTimeoutReference.current = globalThis.setTimeout(() => {
      setIsOpen(false);
      closeTimeoutReference.current = undefined;
    }, HOVER_CARD_CLOSE_DELAY_MS);
  };

  const handleFloatingMouseEnter = () => {
    if (closeTimeoutReference.current !== undefined) {
      globalThis.clearTimeout(closeTimeoutReference.current);
      closeTimeoutReference.current = undefined;
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isOpen) return;

    updateReferencePosition(event.clientX, event.clientY);
  };

  return (
    <>
      <div
        className="contents"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {children}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={setFloatingReference}
            data-testid="cursor-hover-card-content"
            style={floatingStyles}
            className={cn('z-50 max-w-80', className)}
            onMouseEnter={handleFloatingMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={cn(
                'bg-popover text-popover-foreground rounded-md border p-4 shadow-md',
                CURSOR_HOVER_CARD_ANIMATION_CLASS_NAME,
              )}
            >
              {content}
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────

interface CapabilityHoverCardProperties {
  capability: CharacterAttack | CharacterModifier;
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
    ? capability.capabilityJson.damageInstances.length > 0
    : capability.capabilityJson.modifiedStats.length > 0;

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
    <HoverCard
      openDelay={HOVER_CARD_OPEN_DELAY_MS}
      closeDelay={HOVER_CARD_CLOSE_DELAY_MS}
    >
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="top" className={cn('w-auto max-w-80', className)}>
        {content}
      </HoverCardContent>
    </HoverCard>
  );
};
