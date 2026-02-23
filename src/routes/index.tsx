import { createFileRoute } from '@tanstack/react-router';

import { RotationBuilderContainer } from '@/components/rotation-builder/RotationBuilderContainer';

export const Route = createFileRoute('/')({ component: RotationBuilderContainer });
