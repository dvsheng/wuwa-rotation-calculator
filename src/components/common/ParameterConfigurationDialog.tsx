import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import type { DetailedModifierInstance } from '@/hooks/useTeamModifierInstances';
import { CapabilityType } from '@/services/game-data';
import type { Parameter } from '@/services/game-data';
import { useStore } from '@/store';

interface ParameterConfigurationFormProperties {
  capability: DetailedAttackInstance | DetailedModifierInstance;
  buffedAttacks?: Array<DetailedAttackInstance>;
}

interface ParameterConfigurationDialogProperties extends ParameterConfigurationFormProperties {
  children: ReactNode;
  onOpenChange?: (isOpen: boolean) => void;
  isDialogClickable?: boolean;
}

const validateValue = (value: number | undefined, parameter: Parameter) => {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return 'Must be a valid number';
  if (numberValue < parameter.minimum)
    return `Value must be at least ${parameter.minimum}`;
  if (parameter.maximum && numberValue > parameter.maximum)
    return `Value must be at most ${parameter.maximum}`;
};

const ParameterInputHint = ({
  parameter,
  error,
  small,
}: {
  parameter: Parameter;
  error?: string;
  small?: boolean;
}) => {
  const className = small ? 'text-[10px]' : 'text-xs';
  if (error) return <p className={`text-destructive ${className}`}>{error}</p>;
  return (
    <p className={`text-muted-foreground ${className}`}>
      Min: {parameter.minimum}
      {parameter.maximum ? `, Max: ${parameter.maximum}` : ''}
    </p>
  );
};

const ParameterConfigurationForm = ({
  capability,
  buffedAttacks = [],
}: ParameterConfigurationFormProperties) => {
  const { description, name: title, parameters = [] } = capability;
  const stackCount = buffedAttacks.length;
  const canToggleView = stackCount > 1;
  const [isPerAttack, setIsPerAttack] = useState(canToggleView);
  const updateBuffParameters = useStore((state) => state.updateBuffParameters);
  const updateAttackParameters = useStore((state) => state.updateAttackParameters);

  const updateParameters =
    capability.capabilityType === CapabilityType.ATTACK
      ? updateAttackParameters
      : updateBuffParameters;
  const onSubmit = (parameters_: Array<Parameter>) => {
    updateParameters(capability.instanceId, parameters_);
  };

  const form = useForm({
    defaultValues: {
      parameters: parameters.map((p) => {
        if (!canToggleView) return p;
        const config =
          Array.isArray(p.valueConfiguration) && p.valueConfiguration.length > 0
            ? p.valueConfiguration
            : Array.from({ length: stackCount }, () => p.value ?? p.minimum);
        return { ...p, valueConfiguration: config };
      }),
    },
    onSubmit: ({ value }) => {
      if (isPerAttack) {
        onSubmit(
          value.parameters.map((parameter) => ({
            ...parameter,
            value: undefined,
            // Tanstack form stores array fields as objects with numeric keys at
            // runtime; cast to unknown to bypass TypeScript's type narrowing
            valueConfiguration: (() => {
              const raw = parameter.valueConfiguration as unknown;
              if (Array.isArray(raw)) return raw;
              if (raw)
                return Object.entries(raw as Record<number, number>)
                  .toSorted(([a], [b]) => Number(a) - Number(b))
                  .map(([, v]) => v);
              return;
            })(),
          })),
        );
        return;
      }
      onSubmit(
        value.parameters.map((parameter) => ({
          ...parameter,
          valueConfiguration: undefined,
        })),
      );
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      className="flex max-h-1/2 min-h-0 flex-1 flex-col"
    >
      <DialogHeader>
        <DialogTitle>Configure {title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {canToggleView && (
          <div className="flex items-center justify-between gap-3 border-b pb-2">
            <Label className="font-medium">Configuration mode</Label>
            <ToggleGroup
              type="single"
              value={isPerAttack ? 'per-attack' : 'single'}
              onValueChange={(value) => {
                if (!value) return;
                setIsPerAttack(value === 'per-attack');
              }}
              size="sm"
              variant="outline"
            >
              <ToggleGroupItem value="single">Single value</ToggleGroupItem>
              <ToggleGroupItem value="per-attack">Per-attack stacks</ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {parameters.map((parameter, index) => (
          <div key={index} className="space-y-4">
            {isPerAttack ? (
              <div className="space-y-3">
                {buffedAttacks.map((attack, stackIndex) => (
                  <form.Field
                    key={stackIndex}
                    name={`parameters[${index}].valueConfiguration[${stackIndex}]`}
                    validators={{
                      onChange: ({ value }) => validateValue(value, parameter),
                    }}
                  >
                    {(field) => (
                      <div className="grid grid-cols-4 items-start gap-x-4 gap-y-1">
                        <Label
                          htmlFor={field.name}
                          className="col-span-2 line-clamp-2 pt-2 text-right text-xs"
                        >
                          {attack.name}
                        </Label>
                        <div className="col-span-2 space-y-1">
                          <Input
                            id={field.name}
                            type="number"
                            value={field.state.value ?? ''}
                            onChange={(event) =>
                              field.handleChange(event.target.valueAsNumber)
                            }
                          />
                          <ParameterInputHint
                            parameter={parameter}
                            error={field.state.meta.errors[0]}
                            small={true}
                          />
                        </div>
                      </div>
                    )}
                  </form.Field>
                ))}
              </div>
            ) : (
              <form.Field
                name={`parameters[${index}].value`}
                validators={{
                  onChange: ({ value }) => validateValue(value as number, parameter),
                }}
              >
                {(field) => (
                  <div className="grid grid-cols-4 items-start gap-x-4 gap-y-1">
                    <Label htmlFor={field.name} className="pt-2 text-right">
                      {parameters.length > 1 ? `Value ${index + 1}` : 'Value'}
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id={field.name}
                        type="number"
                        value={field.state.value ?? ''}
                        onChange={(event) =>
                          field.handleChange(event.target.valueAsNumber)
                        }
                      />
                      <ParameterInputHint
                        parameter={parameter}
                        error={field.state.meta.errors[0]}
                      />
                    </div>
                  </div>
                )}
              </form.Field>
            )}
          </div>
        ))}
      </div>
      <DialogFooter className="pt-4">
        <DialogClose asChild>
          <Button type="submit">Save changes</Button>
        </DialogClose>
      </DialogFooter>
    </form>
  );
};

export const ParameterConfigurationDialog = ({
  capability,
  buffedAttacks,
  children,
  onOpenChange,
  isDialogClickable = true,
}: ParameterConfigurationDialogProperties) => {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isDialogClickable) return;
    onOpenChange?.(isOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div>{children}</div>
      </DialogTrigger>
      <DialogContent className="flex max-h-screen flex-col sm:max-w-lg">
        <ParameterConfigurationForm
          capability={capability}
          buffedAttacks={buffedAttacks}
        />
      </DialogContent>
    </Dialog>
  );
};
