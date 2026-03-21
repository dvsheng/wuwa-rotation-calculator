import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { auth } from '@/lib/auth';
import {
  CompleteProfileRequestSchema,
  UsernameSignInRequestSchema,
} from '@/schemas/auth';

const AUTH_ROUTES = [
  {
    match: (p: string) => p.endsWith('/sign-in/username'),
    schema: UsernameSignInRequestSchema,
  },
  {
    match: (p: string) => p.endsWith('/update-user'),
    schema: CompleteProfileRequestSchema,
  },
];

const validateAuthRequest = async (request: Request) => {
  const url = new URL(request.url);
  if (request.method !== 'POST') {
    return request;
  }
  const route = AUTH_ROUTES.find((r) => r.match(url.pathname));
  if (!route) return request;
  const validationSchema = route.schema;
  const body = await request.json();
  const parsedBody = validationSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json(
      {
        code: 'VALIDATION_ERROR',
        message: z.prettifyError(parsedBody.error),
      },
      { status: 400 },
    );
  }
  const headers = new Headers(request.headers);
  headers.set('content-type', 'application/json');
  return new Request(request.url, {
    method: 'POST',
    body: JSON.stringify(parsedBody.data),
    headers,
  });
};

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return await auth.handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        const validatedRequest = await validateAuthRequest(request);
        if (validatedRequest instanceof Response) {
          return validatedRequest;
        }

        return await auth.handler(validatedRequest);
      },
    },
  },
});
