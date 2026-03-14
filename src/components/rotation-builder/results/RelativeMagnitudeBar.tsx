import { cn } from '@/lib/utils';

interface RelativeMagnitudeBarProperties {
  value: number;
  maxValue: number;
  negative?: boolean;
  twoSided?: boolean;
}

export const RelativeMagnitudeBar = ({
  value,
  maxValue,
  negative = false,
  twoSided = false,
}: RelativeMagnitudeBarProperties) => {
  const hasVisibleValue = maxValue > 0 && Math.abs(value) > 0;
  const widthPercentage = hasVisibleValue
    ? Math.max((Math.abs(value) / maxValue) * 100, 6)
    : 0;

  if (twoSided) {
    const isNegative = value < 0 || negative;

    return (
      <div className="flex justify-end">
        <div className="bg-muted relative h-2 w-20 overflow-hidden rounded-full">
          <div className="bg-border absolute inset-y-0 left-1/2 w-px -translate-x-1/2 opacity-80" />
          <div className="absolute inset-y-0 left-0 flex w-1/2 justify-end">
            {isNegative && hasVisibleValue ? (
              <div
                className="bg-destructive/70 h-full rounded-l-full transition-all"
                style={{ width: `${widthPercentage}%` }}
              />
            ) : undefined}
          </div>
          <div className="absolute inset-y-0 right-0 flex w-1/2 justify-start">
            {!isNegative && hasVisibleValue ? (
              <div
                className="bg-primary/70 h-full rounded-r-full transition-all"
                style={{ width: `${widthPercentage}%` }}
              />
            ) : undefined}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="bg-muted h-2 w-20 overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            negative ? 'bg-destructive/70' : 'bg-primary/70',
          )}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>
    </div>
  );
};
