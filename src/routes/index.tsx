import { createFileRoute } from '@tanstack/react-router';

function IndexPage() {}

export const Route = createFileRoute('/')({ component: IndexPage });
