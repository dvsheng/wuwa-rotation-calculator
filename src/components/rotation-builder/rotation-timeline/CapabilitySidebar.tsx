import { useDragOperation, useDraggable } from '@dnd-kit/react';
import { SwatchBook } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { CapabilityHoverCard } from '@/components/common/CapabilityHoverCard';
import { CapabilityIconDisplay } from '@/components/common/CapabilityIcon';
import { DashboardSectionHeader } from '@/components/common/DashboardSectionHeader';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { SKILL_ORIGIN_ORDER } from '@/components/constants';
import {
  ATTACK_SKILL_ORDER,
  BUFF_ACCENT_COLORS,
  sortAttackOrigins,
} from '@/components/rotation-builder/constants';
import { Input } from '@/components/ui/input';
import { Item } from '@/components/ui/item';
import { Grid, Row, Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Text } from '@/components/ui/typography';
import type { DetailedAttack, DetailedModifier } from '@/hooks/useTeamDetails';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import { getChartColorByIndex } from '@/lib/utils';
import type { Capability } from '@/schemas/rotation';
import { Target } from '@/services/game-data';
import type { OriginType as CapabilityOriginType } from '@/services/game-data';
import type { SidebarCapabilityDragData } from '@/types/dnd';

const BUFF_COLOR_LEGEND: Array<LegendItem> = [
  { label: 'Self Buff', color: BUFF_ACCENT_COLORS[Target.SELF] },
  {
    label: 'Active Character Buff',
    color: BUFF_ACCENT_COLORS[Target.ACTIVE_CHARACTER],
  },
  { label: 'Team Buff', color: BUFF_ACCENT_COLORS[Target.TEAM] },
  { label: 'Enemy Debuff', color: BUFF_ACCENT_COLORS[Target.ENEMY] },
];

interface LegendItem {
  label: string;
  color: string;
}

const ATTACK_ACCENT_BY_ORIGIN = new Map<CapabilityOriginType, string>(
  ATTACK_SKILL_ORDER.map((originType, index) => [
    originType,
    getChartColorByIndex(index),
  ]),
);

const ATTACK_COLOR_LEGEND: Array<LegendItem> = ATTACK_SKILL_ORDER.map((originType) => ({
  label: originType,
  color: ATTACK_ACCENT_BY_ORIGIN.get(originType) ?? getChartColorByIndex(0),
}));

const TARGET_ORDER: Array<Target> = [
  Target.SELF,
  Target.TEAM,
  Target.ACTIVE_CHARACTER,
  Target.ENEMY,
];

interface CapabilitySidebarProperties {
  onClickAttack?: (attack: Capability) => void;
  onClickBuff?: (buff: Capability) => void;
}

interface CapabilitySectionProperties {
  title: string;
  emptyMessage: string;
  description?: React.ReactNode;
  legend?: Array<LegendItem>;
  children: React.ReactNode;
}

interface CapabilityGroupProperties {
  name: string;
  children: React.ReactNode;
}

interface CapabilityCardProperties {
  capability: DetailedAttack | DetailedModifier;
  accentColor?: string;
  onClick?: () => void;
}

const matchesSearchText = (
  capability: DetailedAttack | DetailedModifier,
  searchText: string,
) => {
  if (!searchText) return true;

  const normalizedSearchText = searchText.trim().toLowerCase();
  const searchableValues = [
    capability.name,
    capability.parentName,
    capability.description,
  ].filter((value): value is string => typeof value === 'string');

  return searchableValues.some((value) =>
    value.toLowerCase().includes(normalizedSearchText),
  );
};

const CapabilitySection = ({
  title,
  emptyMessage,
  description,
  legend,
  children,
}: CapabilitySectionProperties) => {
  return (
    <Stack>
      <Row align="center" className="px-panel gap-trim">
        <Text as="h3" variant="title" className="text-lg">
          {title}
        </Text>
        {legend ? (
          <InfoTooltip>
            <Stack gap="trim">
              {description}
              {legend.map((entry) => (
                <Row key={entry.label} align="center" gap="trim">
                  <span
                    className="size-2 rounded-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.label}
                </Row>
              ))}
            </Stack>
          </InfoTooltip>
        ) : description ? (
          <InfoTooltip>{description}</InfoTooltip>
        ) : undefined}
      </Row>
      {children ?? (
        <Text
          as="div"
          variant="bodySm"
          tone="muted"
          className="flex items-center justify-center italic"
        >
          {emptyMessage}
        </Text>
      )}
    </Stack>
  );
};

const CapabilityGroup = ({ name, children }: CapabilityGroupProperties) => {
  if (!children) return;

  return (
    <Stack gap="inset" className="p-component">
      <Row align="center" className="gap-trim">
        <Text
          as="span"
          variant="overline"
          tone="muted"
          className="font-bold tracking-widest"
        >
          {name}
        </Text>
        <Separator className="flex-1"></Separator>
      </Row>
      <Grid className="grid-cols-auto-fit-28 gap-trim">{children}</Grid>
    </Stack>
  );
};

// TODO: move this to separate file
const CapabilityCard = ({
  capability,
  accentColor,
  onClick,
}: CapabilityCardProperties) => {
  const id = useId();
  const { ref, isDragging } = useDraggable<SidebarCapabilityDragData>({
    id,
    type: capability.capabilityType,
    feedback: 'clone',
    data: {
      kind: 'sidebar-capability',
      capability,
    },
  });
  return (
    <CapabilityHoverCard capability={capability}>
      <Item
        onClick={onClick}
        ref={ref}
        variant="outline"
        size="xs"
        data-testid={`sidebar-capability-card-${capability.id}`}
        data-capability-type={capability.capabilityType}
        className={cn(
          'draggable bg-background size-28 flex-col border-l-4',
          onClick && 'cursor-pointer',
          isDragging && 'opacity-0',
        )}
        style={
          accentColor
            ? ({
                '--capability-accent': accentColor,
                borderLeftColor: 'var(--capability-accent)',
              } as React.CSSProperties)
            : undefined
        }
      >
        <CapabilityIconDisplay url={capability.iconUrl} />
        <Text as="div" variant="caption" className="line-clamp-3 text-center">
          {capability.name}
        </Text>
      </Item>
    </CapabilityHoverCard>
  );
};

export const CapabilitySidebar = ({
  onClickAttack,
  onClickBuff,
}: CapabilitySidebarProperties) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const paletteViewportReference = useRef<HTMLDivElement>(null);
  const dragOperation = useDragOperation();
  const { attacks, buffs } = useTeamDetails();
  const characterNames = [
    ...new Set([
      ...attacks.map((attack) => attack.characterName),
      ...buffs.map((buff) => buff.characterName),
    ]),
  ].toSorted((left, right) => left.localeCompare(right));

  const matchesCharacterFilter = (characterName: string) =>
    !selectedCharacter || characterName === selectedCharacter;
  const matchesCapabilityFilters = (capability: DetailedAttack | DetailedModifier) =>
    matchesCharacterFilter(capability.characterName) &&
    matchesSearchText(capability, searchText);

  const filteredAttacks = attacks.filter((attack) => matchesCapabilityFilters(attack));
  const filteredBuffs = buffs.filter((buff) => matchesCapabilityFilters(buff));
  const attacksByCharacter = Object.groupBy(
    filteredAttacks,
    (attack) => attack.characterName,
  );
  const filteredBuffsByCharacter = Object.groupBy(
    filteredBuffs,
    (buff) => buff.characterName,
  );
  const orderedAttackCharacterNames = characterNames.filter(
    (characterName) => (attacksByCharacter[characterName]?.length ?? 0) > 0,
  );
  const orderedBuffCharacterNames = characterNames.filter(
    (characterName) => (filteredBuffsByCharacter[characterName]?.length ?? 0) > 0,
  );

  useEffect(() => {
    if (dragOperation.source?.data.kind !== 'sidebar-capability') return;
    if (paletteViewportReference.current) {
      paletteViewportReference.current.scrollLeft = 0;
    }
  }, [dragOperation]);

  return (
    <Stack fullHeight fullWidth gap="component" className="bg-muted/30">
      <DashboardSectionHeader
        title="Palette"
        description="This is the action library for the current team. Search or filter the list, then click to add an item immediately or drag it into the matching canvas."
        icon={<SwatchBook />}
      />
      <Stack gap="trim" className="px-panel">
        <Text as="label" variant="overline" tone="muted">
          Search
        </Text>
        <Input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search capabilities"
        />
        <ToggleGroup
          type="single"
          value={selectedCharacter}
          onValueChange={setSelectedCharacter}
          size="sm"
          variant="outline"
        >
          {characterNames.map((characterName) => (
            <ToggleGroupItem key={characterName} value={characterName}>
              {characterName}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Stack>
      <Separator />
      <ScrollArea className="min-h-0 flex-1" viewportRef={paletteViewportReference}>
        <CapabilitySection
          title="Attacks"
          emptyMessage="No attacks available"
          description="Use Attacks to build the rotation order. Click a card to add it or drag it into a specific spot on the top lane, then it becomes part of the timeline and contributes damage in Results. Attack accents are derived from the shared chart palette and stay consistent for each origin type."
          legend={ATTACK_COLOR_LEGEND}
        >
          {orderedAttackCharacterNames.map((characterName) => {
            const characterAttacks = attacksByCharacter[characterName] ?? [];
            const orderedAttacks = characterAttacks.toSorted(
              (a, b) =>
                sortAttackOrigins(a.originType, b.originType) ||
                a.name.localeCompare(b.name) ||
                a.id - b.id,
            );

            return (
              <CapabilityGroup key={`attack-${characterName}`} name={characterName}>
                {orderedAttacks.map((attack) => (
                  <CapabilityCard
                    key={attack.id}
                    capability={attack}
                    accentColor={ATTACK_ACCENT_BY_ORIGIN.get(attack.originType)}
                    onClick={onClickAttack ? () => onClickAttack(attack) : undefined}
                  />
                ))}
              </CapabilityGroup>
            );
          })}
        </CapabilitySection>

        <CapabilitySection
          title="Buffs"
          emptyMessage="No buffs available"
          description="Use Buffs to place modifiers under the attacks they should influence. Click to add one with a default placement or drag it onto a specific span, then it will apply to the attacks covered by that layout."
          legend={BUFF_COLOR_LEGEND}
        >
          {orderedBuffCharacterNames.map((characterName) => {
            const characterBuffs = filteredBuffsByCharacter[characterName] ?? [];
            const buffsByOrigin = Object.groupBy(
              characterBuffs,
              (buff) => buff.originType,
            );
            const orderedBuffOrigins = SKILL_ORIGIN_ORDER.filter(
              (origin) => buffsByOrigin[origin]?.length,
            );
            const remainingOrigins = (
              Object.keys(buffsByOrigin) as Array<CapabilityOriginType>
            ).filter((origin) => !SKILL_ORIGIN_ORDER.includes(origin));
            const orderedBuffs = [...orderedBuffOrigins, ...remainingOrigins]
              .flatMap((origin) => buffsByOrigin[origin] ?? [])
              .toSorted(
                (left, right) =>
                  TARGET_ORDER.indexOf(left.target) -
                    TARGET_ORDER.indexOf(right.target) ||
                  left.name.localeCompare(right.name) ||
                  left.id - right.id,
              );

            return (
              <CapabilityGroup key={`buff-${characterName}`} name={characterName}>
                {orderedBuffs.map((buff) => (
                  <CapabilityCard
                    key={buff.id}
                    capability={buff}
                    accentColor={BUFF_ACCENT_COLORS[buff.target]}
                    onClick={onClickBuff ? () => onClickBuff(buff) : undefined}
                  />
                ))}
              </CapabilityGroup>
            );
          })}
        </CapabilitySection>
      </ScrollArea>
    </Stack>
  );
};
