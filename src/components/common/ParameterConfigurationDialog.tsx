import { useState } from 'react';

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
import type { Parameter } from '@/schemas/rotation';

interface ParameterConfigurationDialogProperties {
  title: string;
  description?: string;
  parameters?: Array<Parameter>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveParameters: (values: Array<number | undefined>) => void;
}

export const ParameterConfigurationDialog = ({
  title,
  description,
  parameters = [],
  open,
  onOpenChange,
  onSaveParameters,
}: ParameterConfigurationDialogProperties) => {
  // Use a function to initialize state only once when needed,
  // though for controlled dialogs, re-initializing when 'open' changes
  // is often handled via keys or effects. To fix the lint error and
  // ensure fresh values when opened, we'll use the 'open' state logic inside the render
  // or a key on the component.
  const [values, setValues] = useState<Array<number | undefined>>(() =>
    parameters.map((p) => p.value),
  );

  const handleValueChange = (index: number, value: string) => {
    const newValues: Array<number | undefined> = [...values];
    newValues[index] = Number(value);
    setValues(newValues);
  };

  const handleSave = () => {
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
        <div className="grid gap-6 py-4">
          {parameters.map((parameter, index) => (
            <div key={index} className="space-y-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`parameter-${index}`} className="text-right">
                  {parameters.length > 1 ? `Value ${index + 1}` : 'Value'}
                </Label>
                <Input
                  id={`parameter-${index}`}
                  type="number"
                  value={values[index] ?? ''}
                  onChange={(event) => handleValueChange(index, event.target.value)}
                  className="col-span-3"
                  placeholder={`Min: ${parameter.minimum}`}
                />
              </div>
              <div className="text-muted-foreground ml-[25%] pl-4 text-xs">
                Minimum: {parameter.minimum}
                {parameter.maximum ? `, Maximum: ${parameter.maximum}` : ''}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
