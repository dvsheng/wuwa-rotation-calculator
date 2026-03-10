import { Info } from 'lucide-react';
import { useState } from 'react';

import { CapabilityIcon } from '@/components/common/CapabilityIcon';
import { CapabilityTooltip } from '@/components/common/CapabilityTooltip';
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

const ATTACK_COLORS: Record<CapabilityOriginType, string> = {
  'Normal Attack': 'border-slate-400 bg-slate-100 text-foreground',
  'Resonance Skill': 'border-sky-400 bg-sky-100 text-foreground',
  'Resonance Liberation': 'border-violet-400 bg-violet-100 text-foreground',
  'Forte Circuit': 'border-amber-400 bg-amber-100 text-foreground',
  'Intro Skill': 'border-lime-400 bg-lime-100 text-foreground',
  'Outro Skill': 'border-emerald-400 bg-emerald-100 text-foreground',
  'Tune Break': 'border-cyan-400 bg-cyan-100 text-foreground',
  Echo: 'border-orange-400 bg-orange-100 text-foreground',
  Weapon: 'border-indigo-400 bg-indigo-100 text-foreground',
  'Echo Set': 'border-fuchsia-400 bg-fuchsia-100 text-foreground',
  s1: 'border-yellow-400 bg-yellow-100 text-foreground',
  s2: 'border-yellow-400 bg-yellow-100 text-foreground',
  s3: 'border-yellow-400 bg-yellow-100 text-foreground',
  s4: 'border-yellow-400 bg-yellow-100 text-foreground',
  s5: 'border-yellow-400 bg-yellow-100 text-foreground',
  s6: 'border-yellow-400 bg-yellow-100 text-foreground',
  'Inherent Skill': 'border-yellow-400 bg-yellow-100 text-foreground',
  'Base Stats': 'border-yellow-400 bg-yellow-100 text-foreground',
};

const TARGET_COLORS: Record<Target, string> = {
  [Target.SELF]: 'border-blue-400 bg-blue-100 text-foreground',
  [Target.TEAM]: 'border-green-400 bg-green-100 text-foreground',
  [Target.ACTIVE_CHARACTER]: 'border-amber-400 bg-amber-100 text-foreground',
  [Target.ENEMY]: 'border-red-400 bg-red-100 text-foreground',
};

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
  onDragAttack?: (attack: Capability, event: React.DragEvent<HTMLElement>) => void;
  onClickBuff?: (buff: Capability) => void;
  onDragBuff?: (buff: Capability, event: React.DragEvent<HTMLElement>) => void;
}

interface CapabilitySectionProperties {
  title: string;
  emptyMessage: string;
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
  onDragStart?: (event: React.DragEvent<HTMLElement>) => void;
}

const toLeftBorderAccent = (className?: string) => {
  if (!className) return '';

  const borderClass = className
    .split(' ')
    .find((token) => token.startsWith('border-') && !token.startsWith('border-l'));

  if (!borderClass) return '';

  return borderClass.replace(/^border-/, 'border-l-');
};

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
  children,
}: CapabilitySectionProperties) => {
  const itemCount = Array.isArray(children)
    ? children.filter(Boolean).length
    : children
      ? 1
      : 0;

  return (
    <section className="flex flex-col">
      <div className="border-border px-panel py-compact border-t">
        <Text as="h3" variant="overline" className="text-foreground">
          {title}
        </Text>
      </div>
      <div className="border-border border-t">
        {itemCount > 0 ? (
          <div className="flex flex-col">{children}</div>
        ) : (
          <Text
            as="div"
            variant="small"
            className="py-page flex items-center justify-center italic"
          >
            {emptyMessage}
          </Text>
        )}
      </div>
    </section>
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
  onDragStart,
}: CapabilityCardProperties) => {
  const isDraggable = onDragStart !== undefined;
  const accentClass = toLeftBorderAccent(colorClassName);
  return (
    <CapabilityTooltip capability={capability}>
      <Item
        draggable={isDraggable}
        onDragStart={onDragStart}
        onClick={onClick}
        variant="outline"
        className={cn(
          'hover:bg-accent/30 gap-tight p-compact relative flex aspect-square size-28 flex-col rounded-lg border shadow-sm transition-colors',
          isDraggable
            ? 'cursor-grab active:cursor-grabbing'
            : onClick
              ? 'cursor-pointer'
              : 'cursor-default',
          colorClassName,
          'border-l-4',
          accentClass,
        )}
      >
        <CapabilityIcon iconUrl={capability.iconUrl} size="medium" />

        <Text
          as="div"
          variant="caption"
          className="text-foreground line-clamp-3 text-center"
        >
          {capability.name}
        </Text>
      </Item>
    </CapabilityTooltip>
  );
};

export const CapabilitySidebar = ({
  onClickAttack,
  onDragAttack,
  onClickBuff,
  onDragBuff,
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
        <Row
          align="center"
          justify="start"
          className="canvas-header border-border gap-compact px-panel border-b"
        >
          <Text as="span" variant="heading">
            Palette
          </Text>
          <Tooltip>
            <TooltipContent side="right">
              Click or drag capabilities onto the canvas to add them to your rotation
            </TooltipContent>
            <TooltipTrigger asChild>
              <Info className="text-muted-foreground size-3.5 shrink-0" />
            </TooltipTrigger>
          </Tooltip>
        </Row>
        <Stack gap="tight" className="px-panel pb-panel">
          <Text as="label" variant="overline">
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
        <CapabilitySection title="Attacks" emptyMessage="No attacks available">
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
                      onDragStart={
                        onDragAttack
                          ? (event) => onDragAttack(attack, event)
                          : undefined
                      }
                      onClick={onClickAttack ? () => onClickAttack(attack) : undefined}
                    />
                  ))}
                </CapabilityGroup>
              );
            },
          )}
        </CapabilitySection>

        <CapabilitySection title="Buffs" emptyMessage="No buffs available">
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
                      onDragStart={
                        onDragBuff ? (event) => onDragBuff(buff, event) : undefined
                      }
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
