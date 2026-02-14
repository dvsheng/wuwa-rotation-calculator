import { useForm } from '@tanstack/react-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ParameterInstance } from '@/schemas/rotation';
import type { Parameter } from '@/services/game-data';

interface ParameterConfigurationDialogProperties {
  title: string;
  description?: string;
  parameters?: Array<Parameter & ParameterInstance>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveParameters: (values: Array<Parameter & ParameterInstance>) => void;
}

const ParameterConfigurationForm = ({
  parameters,
  onSubmit,
}: {
  parameters: Array<Parameter & ParameterInstance>;
  onSubmit: (values: Array<Parameter & ParameterInstance>) => void;
}) => {
  const form = useForm({
    defaultValues: {
      parameters,
    },
    onSubmit: ({ value }) => {
      onSubmit(value.parameters);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid gap-6 py-4">
        {parameters.map((parameter, index) => (
          <form.Field
            key={index}
            name={`parameters[${index}].value`}
            validators={{
              onChange: ({ value }) => {
                const numberValue = Number(value);
                if (Number.isNaN(numberValue)) {
                  return 'Must be a valid number';
                }
                if (numberValue < parameter.minimum) {
                  return `Value must be at least ${parameter.minimum}`;
                }
                if (parameter.maximum && numberValue > parameter.maximum) {
                  return `Value must be at most ${parameter.maximum}`;
                }
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={field.name} className="text-right">
                    {parameters.length > 1 ? `Value ${index + 1}` : 'Value'}
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.valueAsNumber)
                      }
                      placeholder={`Min: ${parameter.minimum}`}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <div className="text-destructive mt-1 text-xs">
                        {field.state.meta.errors[0]}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-muted-foreground ml-[25%] pl-4 text-xs">
                  Minimum: {parameter.minimum}
                  {parameter.maximum ? `, Maximum: ${parameter.maximum}` : ''}
                </div>
              </div>
            )}
          </form.Field>
        ))}
      </div>
      <DialogFooter>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );
};

export const ParameterConfigurationDialog = ({
  title,
  description,
  parameters = [],
  open,
  onOpenChange,
  onSaveParameters,
}: ParameterConfigurationDialogProperties) => {
  const handleSubmit = (values: Array<Parameter & ParameterInstance>) => {
    onSaveParameters(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure {title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ParameterConfigurationForm
          key={open ? 'open' : 'closed'}
          parameters={parameters}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};
