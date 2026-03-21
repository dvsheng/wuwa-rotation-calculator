import { useForm } from '@tanstack/react-form';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { reportCapabilityIssue } from '@/services/feedback/report-capability-issue.function';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Row, Stack } from '../ui/layout';
import { Textarea } from '../ui/textarea';
import { Text } from '../ui/typography';

interface ReportCapabilityIssueDialogProperties {
  capability: {
    id: number;
    name?: string;
    description?: string;
  };
  entityId?: number;
  alternativeDefinition?: string;
}

export const ReportCapabilityIssueDialog = ({
  capability,
  entityId,
  alternativeDefinition,
}: ReportCapabilityIssueDialogProperties) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    defaultValues: {
      reporter: '',
      details: '',
    },
    onSubmit: async ({ value }) => {
      if (isSubmitting) {
        return;
      }

      const toastId = toast.loading('Submitting issue report...');
      setIsSubmitting(true);

      try {
        await reportCapabilityIssue({
          data: {
            capabilityId: capability.id,
            capabilityName: capability.name,
            capabilityDescription: capability.description,
            entityId,
            alternativeDefinition,
            pageUrl: globalThis.location.href,
            reporter: value.reporter || undefined,
            details: value.details,
          },
        });

        toast.success('Issue report sent.', { id: toastId });
        setOpen(false);
        form.reset();
      } catch (error) {
        console.error(error);
        toast.error('Failed to send issue report.', { id: toastId });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          form.reset();
        }
      }}
    >
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <AlertTriangle />
        Report issue
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report capability issue</DialogTitle>
          <DialogDescription>
            Submit a correction or concern for this capability and we&apos;ll post it to
            the project Discord.
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
            <Stack gap="trim">
              <Text variant="label">Capability</Text>
              <Text>{capability.name || `#${capability.id}`}</Text>
            </Stack>
            <form.Field
              name="reporter"
              children={(field) => (
                <Stack gap="trim">
                  <Label htmlFor={field.name}>Name or handle</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Optional"
                  />
                </Stack>
              )}
            />
            <form.Field
              name="details"
              validators={{
                onChange: ({ value }) => {
                  return value.trim().length >= 10
                    ? undefined
                    : 'Please include at least 10 characters.';
                },
              }}
              children={(field) => (
                <Stack gap="trim">
                  <Label htmlFor={field.name}>What looks wrong?</Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Describe the issue, expected behavior, or source that should be checked."
                    rows={6}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors[0] && (
                    <Text variant="caption" tone="destructive">
                      {field.state.meta.errors[0]}
                    </Text>
                  )}
                </Stack>
              )}
            />
          </Stack>
          <DialogFooter className="mt-component">
            <Row gap="inset">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit report'}
              </Button>
            </Row>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
