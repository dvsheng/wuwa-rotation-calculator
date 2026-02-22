import { useForm } from '@tanstack/react-form';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ParameterInstance } from '@/schemas/rotation';
import type { Parameter } from '@/services/game-data';

interface ParameterConfigurationFormProperties {
  title: string;
  description?: string;
  parameters: Array<Parameter & ParameterInstance>;
  /** Attacks covered by the buff. When length > 1, per-stack configuration is offered. */
  buffedAttacks?: Array<{ name: string }>;
  onSubmit: (values: Array<ParameterInstance>) => void;
}

const validateValue = (value: number | undefined, parameter: Parameter) => {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return 'Must be a valid number';
  if (numberValue < parameter.minimum)
    return `Value must be at least ${parameter.minimum}`;
  if (parameter.maximum && numberValue > parameter.maximum)
    return `Value must be at most ${parameter.maximum}`;
};

export const ParameterConfigurationForm = ({
  title,
  description,
  parameters = [],
  buffedAttacks = [],
  onSubmit,
}: ParameterConfigurationFormProperties) => {
  const stackCount = buffedAttacks.length;
  const canToggleView = stackCount > 1;

  const [isPerAttack, setIsPerAttack] = useState(canToggleView);

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
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogHeader>
        <DialogTitle>Configure {title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 overflow-y-auto py-4 pr-1">
        {/* Global Toggle (Moved outside the loop for a cleaner UI if multiple params exist) */}
        {canToggleView && (
          <div className="flex items-center gap-2 border-b pb-2">
            <Switch
              id="mode-toggle"
              checked={isPerAttack}
              onCheckedChange={setIsPerAttack}
            />
            <Label htmlFor="mode-toggle" className="font-medium">
              Configure per-attack stacks
            </Label>
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
                          {field.state.meta.errors[0] ? (
                            <p className="text-destructive text-[10px]">
                              {field.state.meta.errors[0]}
                            </p>
                          ) : (
                            <p className="text-muted-foreground text-[10px]">
                              Min: {parameter.minimum}
                              {parameter.maximum ? `, Max: ${parameter.maximum}` : ''}
                            </p>
                          )}
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
                      {field.state.meta.errors[0] ? (
                        <p className="text-destructive text-xs">
                          {field.state.meta.errors[0]}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          Min: {parameter.minimum}
                          {parameter.maximum ? `, Max: ${parameter.maximum}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </form.Field>
            )}
          </div>
        ))}
      </div>
      <DialogFooter className="pt-4">
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );
};
