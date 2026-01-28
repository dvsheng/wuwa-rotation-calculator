import { Card } from '@/components/ui/card';
import { Stack } from '@/components/ui/layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Heading, Text } from '@/components/ui/typography';
import type { AttackInstance } from '@/schemas/rotation';
import { getCalculateCharacterStatsForTag } from '@/services/rotation-calculator/calculate-stat-total';
import type { RotationResult } from '@/services/rotation-calculator/types';

interface RotationResultDisplayProps {
  result: RotationResult;
  attacks: Array<AttackInstance>;
}

/**
 * Displays the result of the rotation calculation.
 */
export const RotationResultDisplay = ({
  result,
  attacks,
}: RotationResultDisplayProps) => {
  return (
    <Card className="border-primary/20 bg-primary/5 p-6">
      <Stack spacing="lg">
        <div className="border-primary/10 flex items-center justify-between border-b pb-4">
          <div>
            <Text
              variant="small"
              className="text-muted-foreground font-bold tracking-wider uppercase"
            >
              Total Rotation Damage
            </Text>
            <Heading level={1} className="text-primary text-4xl">
              {Math.round(result.totalDamage).toLocaleString()}
            </Heading>
          </div>
          <div className="text-right">
            <Text
              variant="small"
              className="text-muted-foreground font-bold tracking-wider uppercase"
            >
              DPS (approx)
            </Text>
            <Heading level={2} className="text-2xl">
              {Math.round(result.totalDamage / (attacks.length || 1)).toLocaleString()}
            </Heading>
          </div>
        </div>

        <div className="bg-card/50 overflow-hidden rounded-lg border">
          <div className="bg-muted/50 text-muted-foreground grid grid-cols-12 border-b p-3 text-[10px] font-bold tracking-wider uppercase">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-3">Character</div>
            <div className="col-span-5">Attack</div>
            <div className="col-span-3 text-right">Average Damage</div>
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="divide-border/50 divide-y">
              {result.damageInstances.map((dmg, idx) => {
                const attack = attacks[idx];
                const detail = result.damageDetails[idx];
                const charName = attack.characterName;

                return (
                  <Tooltip key={`${attack.instanceId}-${idx}`}>
                    <TooltipTrigger asChild>
                      <div className="hover:bg-muted/30 grid cursor-help grid-cols-12 items-center p-3 text-sm transition-colors">
                        <div className="text-muted-foreground col-span-1 text-center font-mono text-xs">
                          {idx + 1}
                        </div>
                        <div className="text-primary/80 col-span-3 font-semibold">
                          {charName}
                        </div>
                        <div className="col-span-5 truncate pr-2">
                          <Text variant="small" className="font-medium">
                            {attack.parentName}
                          </Text>
                          <Text
                            variant="tiny"
                            className="text-muted-foreground truncate"
                          >
                            {attack.name}
                          </Text>
                        </div>
                        <div className="col-span-3 text-right font-mono font-bold">
                          {Math.round(dmg).toLocaleString()}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="w-80 border-white/10 bg-zinc-900 p-0 text-zinc-100 shadow-xl"
                    >
                      <div className="border-b border-white/10 bg-zinc-800/50 p-2">
                        <Text
                          variant="tiny"
                          className="font-bold tracking-wider text-zinc-300 uppercase"
                        >
                          Calculation Details
                        </Text>
                      </div>
                      <div className="space-y-3 p-3">
                        <div className="rounded border border-white/5 bg-white/5 p-2">
                          <Text
                            variant="tiny"
                            className="mb-1 font-bold text-blue-400 uppercase"
                          >
                            Character Stats
                          </Text>
                          <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                            {(() => {
                              const char = detail.team.find((c) => c.id === charName);
                              if (!char) return null;

                              const calculateStats = getCalculateCharacterStatsForTag(
                                detail.instance.tags,
                              );
                              const stats = calculateStats(char.stats);

                              return (
                                <>
                                  <span className="text-zinc-400">Attack (Total):</span>
                                  <span className="text-right font-medium text-zinc-100">
                                    {Math.round(stats.atk)}
                                  </span>
                                  <span className="text-zinc-400">Crit Rate:</span>
                                  <span className="text-right font-medium text-zinc-100">
                                    {(stats.criticalRate * 100).toFixed(1)}%
                                  </span>
                                  <span className="text-zinc-400">Crit Damage:</span>
                                  <span className="text-right font-medium text-zinc-100">
                                    {(stats.criticalDamage * 100).toFixed(1)}%
                                  </span>
                                  <span className="text-zinc-400">Damage Bonus:</span>
                                  <span className="text-right font-medium text-zinc-100">
                                    {(stats.damageBonus * 100).toFixed(1)}%
                                  </span>
                                  <span className="text-zinc-400">Defense Ignore:</span>
                                  <span className="text-right font-medium text-zinc-100">
                                    {(stats.defenseIgnore * 100).toFixed(1)}%
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="rounded border border-white/5 bg-white/5 p-2">
                          <Text
                            variant="tiny"
                            className="mb-1 font-bold text-blue-400 uppercase"
                          >
                            Instance Stats
                          </Text>
                          <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                            <span className="text-zinc-400">Scaling:</span>
                            <span className="text-right font-medium text-zinc-100 uppercase">
                              {detail.instance.scalingStat}
                            </span>
                            <span className="text-zinc-400">Attribute:</span>
                            <span className="text-right font-medium text-zinc-100 uppercase">
                              {detail.instance.attribute}
                            </span>
                            <span className="text-zinc-400">MV:</span>
                            <span className="truncate text-right font-medium text-zinc-100">
                              {detail.instance.motionValues.join(', ')}
                            </span>
                            <span className="text-zinc-400">Tags:</span>
                            <span className="truncate text-right font-medium text-zinc-100">
                              {detail.instance.tags.join(', ')}
                            </span>
                          </div>
                        </div>
                        <div className="rounded border border-white/5 bg-white/5 p-2">
                          <Text
                            variant="tiny"
                            className="mb-1 font-bold text-blue-400 uppercase"
                          >
                            Enemy Stats
                          </Text>
                          <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                            <span className="text-zinc-400">Level:</span>
                            <span className="text-right font-medium text-zinc-100">
                              {detail.enemy.level}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </Stack>
    </Card>
  );
};
