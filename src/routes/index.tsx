import { createFileRoute } from '@tanstack/react-router';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RotationBuilderContainer } from '@/components/rotation-builder/RotationBuilderContainer';

const RotationBuilderRoute = () => (
  <ErrorBoundary>
    <RotationBuilderContainer />
  </ErrorBoundary>
);

export const Route = createFileRoute('/')({ component: RotationBuilderRoute });
