import { AlertTriangle } from 'lucide-react';
import { Component } from 'react';
import type { ReactNode } from 'react';

import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

interface Properties {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | undefined;
}

export class ErrorBoundary extends Component<Properties, State> {
  state: State = { error: undefined };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }
      return (
        <Row
          gap="tight"
          align="start"
          className="border-destructive/20 bg-destructive/5 p-panel rounded-md border"
        >
          <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
          <Stack gap="tight">
            <Text variant="label" tone="destructive">
              Something went wrong
            </Text>
            <Text variant="caption" tone="muted">
              {this.state.error.message}
            </Text>
          </Stack>
        </Row>
      );
    }
    return this.props.children;
  }
}
