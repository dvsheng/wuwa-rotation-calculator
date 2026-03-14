import { useDraggable } from '@dnd-kit/react';
import { Info, SwatchBook } from 'lucide-react';
import { useId, useState } from 'react';

import { CapabilityHoverCard } from '@/components/common/CapabilityHoverCard';
import { CapabilityIcon } from '@/components/common/CapabilityIcon';
import { DashboardSectionHeader } from '@/components/common/DashboardSectionHeader';
import { sortAttackOrigins } from '@/components/rotation-builder/constants';
import { Input } from '@/components/ui/input';
import { Item } from '@/components/ui/item';
import { Row, Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import type { DetailedAttack, DetailedModifier } from '@/hooks/useTeamDetails';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import { cn } from '@/lib/utils';
import type { Capability } from '@/schemas/rotation';
import { Target } from '@/services/game-data';
import type { OriginType as CapabilityOriginType } from '@/services/game-data';
import type { SidebarCapabilityDragData } from '@/types/dnd';

const ATTACK_COLORS: Record<CapabilityOriginType, string> = {
  'Normal Attack': 'border-l-slate-400',
  'Resonance Skill': 'border-l-sky-400',
  'Resonance Liberation': 'border-l-violet-400',
  'Forte Circuit': 'border-l-amber-400',
  'Intro Skill': 'border-l-lime-400',
  'Outro Skill': 'border-l-emerald-400',
  'Tune Break': 'border-l-cyan-400',
  Echo: 'border-l-orange-400',
  Weapon: 'border-l-indigo-400',
  'Echo Set': 'border-l-fuchsia-400',
  s1: 'border-l-yellow-400',
  s2: 'border-l-yellow-400',
  s3: 'border-l-yellow-400',
  s4: 'border-l-yellow-400',
  s5: 'border-l-yellow-400',
  s6: 'border-l-yellow-400',
  'Inherent Skill': 'border-l-yellow-400',
  'Base Stats': 'border-l-yellow-400',
};

const TARGET_COLORS: Record<Target, string> = {
  [Target.SELF]: 'border-l-blue-400',
  [Target.TEAM]: 'border-l-green-400',
  [Target.ACTIVE_CHARACTER]: 'border-l-amber-400',
  [Target.ENEMY]: 'border-l-red-400',
};

interface LegendItem {
  label: string;
  colorClassName: string;
}

const ATTACK_COLOR_LEGEND: Array<LegendItem> = [
  { label: 'Normal Attack', colorClassName: 'bg-slate-400' },
  { label: 'Resonance Skill', colorClassName: 'bg-sky-400' },
  { label: 'Resonance Liberation', colorClassName: 'bg-violet-400' },
  { label: 'Forte Circuit', colorClassName: 'bg-amber-400' },
  { label: 'Intro Skill', colorClassName: 'bg-lime-400' },
  { label: 'Outro Skill', colorClassName: 'bg-emerald-400' },
  { label: 'Tune Break', colorClassName: 'bg-cyan-400' },
  { label: 'Echo', colorClassName: 'bg-orange-400' },
  { label: 'Weapon', colorClassName: 'bg-indigo-400' },
  { label: 'Echo Set', colorClassName: 'bg-fuchsia-400' },
  { label: 'Inherent Skill', colorClassName: 'bg-yellow-400' },
  { label: 'Base Stats', colorClassName: 'bg-yellow-400' },
];

const BUFF_COLOR_LEGEND: Array<LegendItem> = [
  { label: 'Self Target', colorClassName: 'bg-blue-400' },
  { label: 'Team Target', colorClassName: 'bg-green-400' },
  { label: 'Active Character Target', colorClassName: 'bg-amber-400' },
  { label: 'Enemy Target', colorClassName: 'bg-red-400' },
];

const BUFF_SKILL_ORDER: Array<CapabilityOriginType> = [
  'Normal Attack',
  'Resonance Skill',
  'Resonance Liberation',
  'Forte Circuit',
  'Intro Skill',
  'Outro Skill',
  'Inherent Skill',
  'Tune Break',
  'Echo',
  'Weapon',
  'Echo Set',
];

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
  legend?: Array<LegendItem>;
  legendAriaLabel?: string;
  children: React.ReactNode;
}

interface CapabilityGroupProperties {
  name: string;
  children: React.ReactNode;
}

interface CapabilityCardProperties {
  capability: DetailedAttack | DetailedModifier;
  colorClassName?: string;
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
  legend,
  legendAriaLabel,
  children,
}: CapabilitySectionProperties) => {
  const itemCount = Array.isArray(children)
    ? children.filter(Boolean).length
    : children
      ? 1
      : 0;

  return (
    <Stack>
      <Row align="center" className="px-panel py-compact gap-2">
        <Text as="h3" variant="title" className="text-lg">
          {title}
        </Text>
        {legend ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={legendAriaLabel}
                className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-64 p-3">
              <div className="space-y-1">
                {legend.map((entry) => (
                  <div key={entry.label} className="flex items-center gap-2">
                    <span className={cn('size-2 rounded-sm', entry.colorClassName)} />
                    <span>{entry.label}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        ) : undefined}
      </Row>
      {itemCount > 0 ? (
        <Stack>{children}</Stack>
      ) : (
        <Text
          as="div"
          variant="bodySm"
          tone="muted"
          className="py-page flex items-center justify-center italic"
        >
          {emptyMessage}
        </Text>
      )}
    </Stack>
  );
};

const CapabilityGroup = ({ name, children }: CapabilityGroupProperties) => {
  const itemCount = Array.isArray(children)
    ? children.filter(Boolean).length
    : children
      ? 1
      : 0;

  if (itemCount === 0) return;

  return (
    <div className="p-component">
      <div className="gap-tight mb-2.5 flex items-center">
        <Text
          as="span"
          variant="overline"
          tone="muted"
          className="shrink-0 font-bold tracking-widest"
        >
          {name}
        </Text>
        <div className="bg-border h-px flex-1" />
      </div>
      <div className="grid-cols-auto-fit-28 gap-tight grid">{children}</div>
    </div>
  );
};

// TODO: move this to separate file
const CapabilityCard = ({
  capability,
  colorClassName,
  onClick,
}: CapabilityCardProperties) => {
  const id = useId();
  const { ref } = useDraggable<SidebarCapabilityDragData>({
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
        className={cn(
          'gap-tight p-compact relative flex size-28 cursor-grab flex-col border shadow-sm active:cursor-grabbing',
          onClick && 'cursor-pointer',
          colorClassName,
          'border-l-4',
        )}
      >
        <CapabilityIcon iconUrl={capability.iconUrl} size="medium" />
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
  const [selectedCharacters, setSelectedCharacters] = useState<Array<string>>([]);
  const [searchText, setSearchText] = useState('');
  const { attacks, buffs } = useTeamDetails();
  const characterNames = [
    ...new Set([
      ...attacks.map((attack) => attack.characterName),
      ...buffs.map((buff) => buff.characterName),
    ]),
  ].toSorted((left, right) => left.localeCompare(right));

  const matchesCharacterFilter = (characterName: string) =>
    selectedCharacters.length === 0 || selectedCharacters.includes(characterName);
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

  return (
    <Stack className="relative h-full min-h-0">
      <Stack className="border-border gap-y-tight h-fit border-b">
        <DashboardSectionHeader
          title="Palette"
          description="Click or drag capabilities onto the canvas to add them to your rotation."
          icon={<SwatchBook />}
        />
        <Stack gap="tight" className="px-panel pb-panel">
          <Text as="label" variant="overline" tone="muted">
            Search
          </Text>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search capabilities"
          />
          <ToggleGroup
            type="multiple"
            value={selectedCharacters}
            onValueChange={setSelectedCharacters}
            size="sm"
          >
            {characterNames.map((characterName) => (
              <ToggleGroupItem key={characterName} value={characterName} size={'sm'}>
                {characterName}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Stack>
      </Stack>
      <ScrollArea className="min-h-0 flex-1">
        <CapabilitySection
          title="Attacks"
          emptyMessage="No attacks available"
          legend={ATTACK_COLOR_LEGEND}
          legendAriaLabel="Attack color legend"
        >
          {Object.entries(attacksByCharacter).map(
            ([characterName, characterAttacks]) => {
              // Sort by origin first, then by name
              const orderedAttacks = (characterAttacks ?? []).toSorted(
                (a, b) =>
                  sortAttackOrigins(a.originType, b.originType) ||
                  a.name.localeCompare(b.name),
              );
              return (
                <CapabilityGroup key={`attack-${characterName}`} name={characterName}>
                  {orderedAttacks.map((attack) => (
                    <CapabilityCard
                      key={attack.id}
                      capability={attack}
                      colorClassName={ATTACK_COLORS[attack.originType]}
                      onClick={onClickAttack ? () => onClickAttack(attack) : undefined}
                    />
                  ))}
                </CapabilityGroup>
              );
            },
          )}
        </CapabilitySection>

        <CapabilitySection
          title="Buffs"
          emptyMessage="No buffs available"
          legend={BUFF_COLOR_LEGEND}
          legendAriaLabel="Buff color legend"
        >
          {Object.entries(filteredBuffsByCharacter).map(
            ([characterName, characterBuffs]) => {
              const buffsByOrigin = Object.groupBy(
                characterBuffs ?? [],
                (buff) => buff.originType,
              );
              const orderedBuffOrigins = BUFF_SKILL_ORDER.filter(
                (origin) => buffsByOrigin[origin]?.length,
              );
              const remainingOrigins = (
                Object.keys(buffsByOrigin) as Array<CapabilityOriginType>
              ).filter((origin) => !BUFF_SKILL_ORDER.includes(origin));
              const orderedBuffs = [...orderedBuffOrigins, ...remainingOrigins]
                .flatMap((origin) => buffsByOrigin[origin] ?? [])
                .toSorted(
                  (left, right) =>
                    TARGET_ORDER.indexOf(left.target) -
                    TARGET_ORDER.indexOf(right.target),
                );

              return (
                <CapabilityGroup key={`buff-${characterName}`} name={characterName}>
                  {orderedBuffs.map((buff) => (
                    <CapabilityCard
                      key={buff.id}
                      capability={buff}
                      colorClassName={TARGET_COLORS[buff.target]}
                      onClick={onClickBuff ? () => onClickBuff(buff) : undefined}
                    />
                  ))}
                </CapabilityGroup>
              );
            },
          )}
        </CapabilitySection>
      </ScrollArea>
    </Stack>
  );
};
