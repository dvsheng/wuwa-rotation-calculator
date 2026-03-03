import { Info } from 'lucide-react';

import { CapabilityIcon } from '@/components/common/CapabilityIcon';
import { sortAttackOrigins } from '@/components/rotation-builder/constants';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Separator } from '@/components/ui/separator';
import { Sidebar, SidebarContent } from '@/components/ui/sidebar';
import { Text } from '@/components/ui/typography';
import type { DetailedAttack, DetailedModifier } from '@/hooks/useTeamDetails';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import { cn } from '@/lib/utils';
import type { Capability } from '@/schemas/rotation';
import { OriginType, Target } from '@/services/game-data';
import type {
  AttackOriginType,
  OriginType as CapabilityOriginType,
} from '@/services/game-data';
import { TUNE_BREAK_ATTACK_ID } from '@/services/game-data/tune-break';
import { TUNE_STRAIN_BUFF_ID } from '@/services/game-data/tune-strain';

const ATTACK_COLORS: Record<AttackOriginType, string> = {
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

const TUNE_BREAK_CAPABILITY: DetailedAttack = {
  id: TUNE_BREAK_ATTACK_ID,
  isTuneBreakAttack: true,
  characterId: 0,
  entityId: 0,
  characterName: 'All Characters',
  name: 'Tune Break',
  parentName: 'Other',
  originType: OriginType.TUNE_BREAK,
};

const TUNE_STRAIN_CAPABILITY: DetailedModifier = {
  id: TUNE_STRAIN_BUFF_ID,
  characterId: 0,
  entityId: 0,
  characterName: 'All Characters',
  name: 'Tune Strain',
  parentName: 'Other',
  originType: 'Tune Break',
  target: Target.ENEMY,
  parameters: [{ id: '0', minimum: 0, maximum: 4 }],
};

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
      <div className="border-border border-t px-4 py-2">
        <Text className="text-sm font-semibold tracking-wider uppercase">{title}</Text>
      </div>
      <div className="border-border border-t">
        {itemCount > 0 ? (
          <div className="flex flex-col">{children}</div>
        ) : (
          <div className="text-muted-foreground flex items-center justify-center py-8 text-sm font-medium italic">
            {emptyMessage}
          </div>
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
    <div className="px-3 py-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-muted-foreground shrink-0 text-xs font-bold tracking-widest uppercase">
          {name}
        </span>
        <div className="bg-border h-px flex-1" />
      </div>
      <div className="grid grid-cols-4 gap-2">{children}</div>
    </div>
  );
};

const CapabilityCard = ({
  capability,
  colorClassName,
  onClick,
  onDragStart,
}: CapabilityCardProperties) => {
  const isDraggable = onDragStart !== undefined;
  const accentClass = toLeftBorderAccent(colorClassName);
  const isParameterized = (capability.parameters?.length ?? 0) > 0;
  const hasDetails =
    !!capability.description || !!capability.parentName || isParameterized;

  return (
    <div className="group relative">
      <button
        draggable={isDraggable}
        onDragStart={onDragStart}
        onClick={onClick}
        className={cn(
          'bg-card hover:bg-accent/30 border-border flex aspect-square w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg border p-2 shadow-sm transition-colors',
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
        <CapabilityIcon capabilityId={capability.id} size="large" />

        <span className="text-foreground line-clamp-2 w-full text-center text-xs leading-tight">
          {capability.name}
        </span>
      </button>

      {hasDetails && (
        <HoverCard openDelay={300} closeDelay={100}>
          <HoverCardTrigger asChild>
            <button
              className="absolute top-1 right-1 z-10 flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-50 hover:opacity-100!"
              onDragStart={(event) => event.preventDefault()}
              onClick={(event) => event.stopPropagation()}
              tabIndex={-1}
              aria-label={`Info for ${capability.name}`}
            >
              <Info className="text-muted-foreground h-3 w-3" />
            </button>
          </HoverCardTrigger>
          <HoverCardContent side="right" align="start" className="w-72 p-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold">{capability.name}</span>
                {isParameterized && (
                  <Badge className="bg-background/15 shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-semibold tracking-wide uppercase">
                    Parameterized
                  </Badge>
                )}
              </div>
              {capability.parentName && (
                <span className="text-muted-foreground text-xs">
                  {capability.parentName}
                </span>
              )}
              {capability.description && (capability.parentName || isParameterized) && (
                <Separator />
              )}
              {capability.description && (
                <span className="text-xs">{capability.description}</span>
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
};

export const CapabilitySidebar = ({
  onClickAttack,
  onDragAttack,
  onClickBuff,
  onDragBuff,
}: CapabilitySidebarProperties) => {
  const { attacks, buffs, hasTuneStrain } = useTeamDetails();
  const hasTuneBreak = attacks.some((attack) => attack.isTuneBreakAttack);
  const nonTuneBreakAttacks = attacks.filter((attack) => !attack.isTuneBreakAttack);
  const attacksByCharacter = Object.groupBy(
    nonTuneBreakAttacks,
    (attack) => attack.characterName,
  );
  const buffsByCharacter = Object.groupBy(buffs, (buff) => buff.characterName);

  return (
    <Sidebar open={true} className="h-full min-h-0 w-130">
      <SidebarContent className="flex h-0 min-h-0 flex-1 flex-col">
        <div className="h-0 min-h-0 flex-1 overflow-y-auto">
          <CapabilitySection title="Attacks" emptyMessage="No attacks available">
            {Object.entries(attacksByCharacter).map(
              ([characterName, characterAttacks]) => {
                const attacksByOrigin = Object.groupBy(
                  characterAttacks ?? [],
                  (attack) => attack.originType,
                );
                const orderedOrigins = (
                  Object.keys(attacksByOrigin) as Array<AttackOriginType>
                ).toSorted(sortAttackOrigins);
                const orderedAttacks = orderedOrigins.flatMap(
                  (origin) => attacksByOrigin[origin] ?? [],
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
                        onClick={
                          onClickAttack ? () => onClickAttack(attack) : undefined
                        }
                      />
                    ))}
                  </CapabilityGroup>
                );
              },
            )}

            {hasTuneBreak && (
              <CapabilityGroup name="Other">
                <CapabilityCard
                  capability={TUNE_BREAK_CAPABILITY}
                  colorClassName={ATTACK_COLORS[OriginType.TUNE_BREAK]}
                  onDragStart={
                    onDragAttack
                      ? (event) => onDragAttack(TUNE_BREAK_CAPABILITY, event)
                      : undefined
                  }
                  onClick={
                    onClickAttack
                      ? () => onClickAttack(TUNE_BREAK_CAPABILITY)
                      : undefined
                  }
                />
              </CapabilityGroup>
            )}
          </CapabilitySection>

          <CapabilitySection title="Buffs" emptyMessage="No buffs available">
            {Object.entries(buffsByCharacter).map(([characterName, characterBuffs]) => {
              const buffsByOrigin = Object.groupBy(
                characterBuffs ?? [],
                (buff) => buff.originType,
              );
              const orderedOrigins = BUFF_SKILL_ORDER.filter(
                (origin) => buffsByOrigin[origin]?.length,
              );
              const remainingOrigins = (
                Object.keys(buffsByOrigin) as Array<CapabilityOriginType>
              ).filter((origin) => !BUFF_SKILL_ORDER.includes(origin));
              const orderedBuffs = [...orderedOrigins, ...remainingOrigins]
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
            })}

            {hasTuneStrain && (
              <CapabilityGroup name="Other">
                <CapabilityCard
                  capability={TUNE_STRAIN_CAPABILITY}
                  colorClassName={TARGET_COLORS[Target.ENEMY]}
                  onDragStart={
                    onDragBuff
                      ? (event) => onDragBuff(TUNE_STRAIN_CAPABILITY, event)
                      : undefined
                  }
                  onClick={
                    onClickBuff ? () => onClickBuff(TUNE_STRAIN_CAPABILITY) : undefined
                  }
                />
              </CapabilityGroup>
            )}
          </CapabilitySection>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
