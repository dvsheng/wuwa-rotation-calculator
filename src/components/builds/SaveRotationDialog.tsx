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
import { Textarea } from '@/components/ui/textarea';
import { useSaveRotation } from '@/hooks/useSaveRotation';

import { Stack } from '../ui/layout';

interface SaveRotationDialogProperties {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveRotationDialog({
  open,
  onOpenChange,
}: SaveRotationDialogProperties) {
  const { saveRotation, isSaving } = useSaveRotation();
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
    onSubmit: async ({ value }) => {
      await saveRotation(value);
      onOpenChange(false);
      form.reset();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(_open) => {
        onOpenChange(_open);
        if (!_open) {
          form.reset();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Rotation</DialogTitle>
          <DialogDescription>
            Save your current team, enemy, and rotation configuration to the library.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <Stack gap="component">
            <form.Field
              name="name"
              children={(field) => (
                <Stack gap="trim">
                  <Label htmlFor={field.name}>Name</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="My Awesome Rotation"
                  />
                </Stack>
              )}
            />
            <form.Field
              name="description"
              children={(field) => (
                <Stack gap="trim">
                  <Label htmlFor={field.name}>Description</Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Optional notes..."
                  />
                </Stack>
              )}
            />
          </Stack>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
