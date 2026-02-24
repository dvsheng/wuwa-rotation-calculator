import { createFileRoute } from '@tanstack/react-router';

import { RotationBuilderContainer } from '@/components/rotation-builder/RotationBuilderContainer';

const RotationBuilderRoute = () => <RotationBuilderContainer />;

export const Route = createFileRoute('/')({ component: RotationBuilderRoute });
