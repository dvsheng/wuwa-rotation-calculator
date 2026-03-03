import { Info } from 'lucide-react';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography';
import type { ClientRotationResult } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import { NegativeStatus } from '@/types';

type DamageDetail = ClientRotationResult['damageDetails'][number];

interface RotationResultRowHoverCardProperties {
  detail: DamageDetail;
}

const flatIntegerKeys = new Set([
  'level',
  'attackFlat',
  'attackFlatBonus',
  'hpFlat',
  'hpFlatBonus',
  'defenseFlat',
  'defenseFlatBonus',
  'tuneBreakBoost',
  ...Object.values(NegativeStatus),
]);

const CHARACTER_KEY_ORDER = [
  'level',
  'attackFlat',
  'attackScalingBonus',
  'attackFlatBonus',
  'hpFlat',
  'hpScalingBonus',
  'hpFlatBonus',
  'defenseFlat',
  'defenseScalingBonus',
  'defenseFlatBonus',
  'criticalRate',
  'criticalDamage',
  'damageBonus',
  'damageAmplification',
  'damageMultiplierBonus',
  'tuneStrainDamageBonus',
  'finalDamageBonus',
  'defenseIgnore',
  'resistancePenetration',
  'tuneBreakBoost',
];

const ENEMY_KEY_ORDER = [
  'level',
  'defenseReduction',
  'baseResistance',
  'resistanceReduction',
];

const byKeyOrder =
  (order: Array<string>) =>
  ([a]: [string, number], [b]: [string, number]) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
  };

export const RotationResultRowHoverCard = ({
  detail,
}: RotationResultRowHoverCardProperties) => {
  const characterEntries = Object.entries(detail.character)
    .filter(([key, value]) => key !== 'attackScalingPropertyValue' && value !== 0)
    .toSorted(byKeyOrder(CHARACTER_KEY_ORDER));

  const enemyEntries = Object.entries(detail.enemy)
    .filter(([, value]) => value !== 0)
    .toSorted(byKeyOrder(ENEMY_KEY_ORDER));

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="View details">
          <Info className="h-4 w-4" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        className="flex h-96 w-96 flex-col border-white/10 bg-zinc-900 p-0 text-zinc-100 shadow-xl"
      >
        <div className="shrink-0 border-b border-white/10 bg-zinc-800/50 p-3">
          <Text
            variant="tiny"
            className="font-semibold tracking-wider text-zinc-300 uppercase"
          >
            Calculation Snapshot
          </Text>
        </div>

        <ScrollArea className="min-h-0 flex-1 p-3">
          <div className="space-y-4">
            <div className="space-y-2">
              <Text variant="tiny" className="font-semibold text-amber-500 uppercase">
                Skill
              </Text>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <span className="text-zinc-400">Scaling Stat</span>
                <span className="text-right font-mono text-zinc-100">
                  {detail.scalingStat}{' '}
                  <span className="text-zinc-400">
                    (
                    {Math.round(
                      detail.character.attackScalingPropertyValue ?? 0,
                    ).toLocaleString()}
                    )
                  </span>
                </span>
                <span className="text-zinc-400">Motion Value</span>
                <span className="text-right font-mono text-zinc-100">
                  {`${(detail.motionValue * 100).toFixed(1)}%`}
                </span>
                <span className="text-zinc-400">Base Damage</span>
                <span className="text-right font-mono text-zinc-100">
                  {Math.round(detail.baseDamage).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Text variant="tiny" className="font-semibold text-blue-400 uppercase">
                Character Stats
              </Text>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                {characterEntries.map(([key, value]) => (
                  <Fragment key={key}>
                    <span className="text-zinc-400 capitalize">
                      {key.replaceAll(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-right font-mono text-zinc-100">
                      {flatIntegerKeys.has(key)
                        ? Math.round(value).toLocaleString()
                        : `${(value * 100).toFixed(1)}%`}
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Text variant="tiny" className="font-semibold text-red-400 uppercase">
                Enemy Stats
              </Text>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                {enemyEntries.map(([key, value]) => (
                  <Fragment key={key}>
                    <span className="text-zinc-400 capitalize">
                      {key.replaceAll(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-right font-mono text-zinc-100">
                      {flatIntegerKeys.has(key)
                        ? Math.round(value).toLocaleString()
                        : `${(value * 100).toFixed(1)}%`}
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </HoverCardContent>
    </HoverCard>
  );
};
