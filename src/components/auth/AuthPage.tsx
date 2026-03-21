import { useForm } from '@tanstack/react-form';
import { Link, useRouter } from '@tanstack/react-router';
import { CheckCircle2, Chrome, Loader2, UserRound } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { authClient, useSession } from '@/lib/auth-client';
import { buildAbsoluteAuthViewUrl, normalizeRedirectTo } from '@/lib/auth-routing';
import type { AuthView } from '@/lib/auth-routing';
import {
  CompleteProfileRequestSchema,
  PasswordSignUpSchema,
  UsernameSignInSchema,
  buildTemporaryEmailFromUsername,
} from '@/schemas/auth';

function formatFormErrors(errors: Array<{ message?: string } | string | undefined>) {
  return errors
    .map((error) => (typeof error === 'string' ? error : error?.message))
    .filter(Boolean)
    .join(', ');
}

function extractVisibleFormErrorMessage(error: unknown): string | undefined {
  if (typeof error === 'string') {
    return error;
  }

  if (!isObject(error)) {
    return undefined;
  }

  if (typeof error.message === 'string') {
    return error.message;
  }

  return extractVisibleFormErrorMessage(error.form);
}

function getVisibleSubmitError(
  errorMapOnSubmit: unknown,
  formErrors: Array<unknown>,
): string | undefined {
  const submitError = extractVisibleFormErrorMessage(errorMapOnSubmit);
  if (submitError) {
    return submitError;
  }

  for (const error of formErrors) {
    const formError = extractVisibleFormErrorMessage(error);
    if (formError) {
      return formError;
    }
  }

  return undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractAuthErrorDetails(
  error: unknown,
): { code?: string; message?: string } | undefined {
  if (!isObject(error)) {
    return undefined;
  }

  const code = typeof error.code === 'string' ? error.code : undefined;
  const message = typeof error.message === 'string' ? error.message : undefined;

  if (code || message) {
    return { code, message };
  }

  for (const nestedKey of ['error', 'body', 'data', 'cause']) {
    const nestedValue = error[nestedKey];
    if (!nestedValue) {
      continue;
    }

    const nestedDetails = extractAuthErrorDetails(nestedValue);
    if (nestedDetails) {
      return nestedDetails;
    }
  }

  return undefined;
}

function getSignInErrorMessage(error: unknown) {
  const errorDetails = extractAuthErrorDetails(error);

  switch (errorDetails?.code) {
    case 'CREDENTIAL_ACCOUNT_NOT_FOUND':
    case 'INVALID_EMAIL_OR_PASSWORD':
    case 'INVALID_PASSWORD':
    case 'USER_NOT_FOUND': {
      return 'Invalid username or password.';
    }
    default: {
      return errorDetails?.message ?? 'Sign in failed.';
    }
  }
}

function getUsernameTakenErrorMessage(error: unknown, fallbackMessage: string) {
  const errorDetails = extractAuthErrorDetails(error);

  switch (errorDetails?.code) {
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL': {
      return 'That username is already taken.';
    }
    default: {
      return errorDetails?.message ?? fallbackMessage;
    }
  }
}

function AuthPageShell({
  title,
  description,
  children,
  footer,
}: {
  children: React.ReactNode;
  description: string;
  footer?: React.ReactNode;
  title: string;
}) {
  return (
    <div className="from-background via-primary/6 to-accent/10 flex h-full min-h-0 flex-1 overflow-auto bg-linear-to-br">
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-2">
          <Stack justify="center" gap="panel" className="max-lg:text-center">
            <Text as="h1" variant="display" className="text-4xl leading-tight">
              Sign in to save and publicize rotations.
            </Text>
          </Stack>
          <Card className="border-primary/10 bg-card/95 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
            {footer ? (
              <CardFooter className="justify-center border-t">{footer}</CardFooter>
            ) : undefined}
          </Card>
        </div>
      </div>
    </div>
  );
}

function AuthModeLinks({
  redirectTo,
  view,
}: {
  redirectTo: string;
  view: 'sign-in' | 'sign-up';
}) {
  const alternateView = view === 'sign-in' ? 'sign-up' : 'sign-in';
  const alternateLabel =
    view === 'sign-in' ? 'Create an account' : 'Already have an account? Sign in';

  return (
    <Link
      to="/auth/$authView"
      params={{ authView: alternateView }}
      search={{ redirectTo }}
      className="text-sm hover:underline"
    >
      {alternateLabel}
    </Link>
  );
}

function GoogleButton({
  disabled,
  redirectTo,
}: {
  disabled?: boolean;
  redirectTo: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className="w-full"
      onClick={() => {
        authClient.signIn.social({
          provider: 'google',
          callbackURL: buildAbsoluteAuthViewUrl('callback', redirectTo),
          newUserCallbackURL: buildAbsoluteAuthViewUrl('complete-profile', redirectTo),
          errorCallbackURL: buildAbsoluteAuthViewUrl('sign-in', redirectTo),
        });
      }}
    >
      <Chrome />
      Continue with Google
    </Button>
  );
}

function AnonymousButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className="w-full"
      onClick={onClick}
    >
      <UserRound />
      Continue on this browser anonymously
    </Button>
  );
}

function SignInView({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    validators: {
      onSubmit: UsernameSignInSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      try {
        const result = await authClient.signIn.username({
          username: value.username,
          password: value.password,
        });
        if (result.error) {
          formApi.setErrorMap({
            onSubmit: {
              form: getSignInErrorMessage(result.error),
              fields: {},
            },
          });
          return;
        }
        await router.invalidate();
        router.navigate({ to: redirectTo });
      } catch (error) {
        formApi.setErrorMap({
          onSubmit: {
            form: getSignInErrorMessage(error),
            fields: {},
          },
        });
      }
    },
  });

  const submitError = getVisibleSubmitError(
    form.state.errorMap.onSubmit,
    form.state.errors,
  );

  const handleAnonymousSignIn = async () => {
    await authClient.signIn.anonymous();
    router.invalidate();
    router.navigate({ to: redirectTo });
  };

  return (
    <AuthPageShell
      title="Sign in"
      description="An account is required to save your rotations across sessions and devices. You may use an anonymous account to save your rotations locally."
      footer={<AuthModeLinks redirectTo={redirectTo} view="sign-in" />}
    >
      <Stack gap="panel">
        <GoogleButton disabled={form.state.isSubmitting} redirectTo={redirectTo} />
        <AnonymousButton
          disabled={form.state.isSubmitting}
          onClick={handleAnonymousSignIn}
        />
        <div className="bg-border h-px w-full" />
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="username"
            children={(field) => (
              <Stack gap="inset">
                <Label htmlFor={field.name}>Username</Label>
                <Input
                  id={field.name}
                  autoComplete="username"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  required
                />
                {field.state.meta.errors.length > 0 ? (
                  <Text variant="caption" tone="destructive">
                    {formatFormErrors(field.state.meta.errors)}
                  </Text>
                ) : undefined}
              </Stack>
            )}
          />
          <form.Field
            name="password"
            children={(field) => (
              <Stack gap="inset">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  id={field.name}
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  required
                />
                {field.state.meta.errors.length > 0 ? (
                  <Text variant="caption" tone="destructive">
                    {formatFormErrors(field.state.meta.errors)}
                  </Text>
                ) : undefined}
              </Stack>
            )}
          />
          {submitError ? (
            <Text as="p" variant="bodySm" tone="destructive" role="alert">
              {submitError}
            </Text>
          ) : undefined}
          <Button type="submit" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? <Loader2 className="animate-spin" /> : undefined}
            Sign in with username
          </Button>
        </form>
      </Stack>
    </AuthPageShell>
  );
}

function SignUpView({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: PasswordSignUpSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      try {
        const parsedValue = PasswordSignUpSchema.parse(value);
        const result = await authClient.signUp.email({
          name: parsedValue.username,
          email: buildTemporaryEmailFromUsername(parsedValue.username),
          password: parsedValue.password,
          username: parsedValue.username,
          displayUsername: parsedValue.username,
          callbackURL: buildAbsoluteAuthViewUrl('callback', redirectTo),
        });
        if (result.error) {
          formApi.setErrorMap({
            onSubmit: {
              form: getUsernameTakenErrorMessage(result.error, 'Sign up failed.'),
              fields: {},
            },
          });
          return;
        }
        await router.invalidate();
        router.navigate({ to: redirectTo });
      } catch (error) {
        formApi.setErrorMap({
          onSubmit: {
            form: getUsernameTakenErrorMessage(error, 'Sign up failed.'),
            fields: {},
          },
        });
      }
    },
  });

  const submitError = getVisibleSubmitError(
    form.state.errorMap.onSubmit,
    form.state.errors,
  );

  return (
    <AuthPageShell
      title="Create an account"
      description="Create a username and password to save your rotations across sessions and devices. Password accounts use a temporary email generated from your username."
      footer={<AuthModeLinks redirectTo={redirectTo} view="sign-up" />}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="username"
          children={(field) => (
            <Stack gap="inset">
              <Label htmlFor={field.name}>Username</Label>
              <Input
                id={field.name}
                autoComplete="username"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="letters_numbers123_or_dots"
                required
              />
              <Text variant="caption" tone="muted">
                This username will be shown next to rotations that you publish.
              </Text>
              <Text variant="caption" tone="muted">
                A temporary address like `username@tempemail.com` will be assigned
                behind the scenes for account storage.
              </Text>
              {field.state.meta.errors.length > 0 ? (
                <Text variant="caption" tone="destructive">
                  {formatFormErrors(field.state.meta.errors)}
                </Text>
              ) : undefined}
            </Stack>
          )}
        />
        <form.Field
          name="password"
          children={(field) => (
            <Stack gap="inset">
              <Label htmlFor={field.name}>Password</Label>
              <Input
                id={field.name}
                type="password"
                autoComplete="new-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
              />
              {field.state.meta.errors.length > 0 ? (
                <Text variant="caption" tone="destructive">
                  {formatFormErrors(field.state.meta.errors)}
                </Text>
              ) : undefined}
            </Stack>
          )}
        />
        <form.Field
          name="confirmPassword"
          children={(field) => (
            <Stack gap="inset">
              <Label htmlFor={field.name}>Confirm password</Label>
              <Input
                id={field.name}
                type="password"
                autoComplete="new-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
              />
              {field.state.meta.errors.length > 0 ? (
                <Text variant="caption" tone="destructive">
                  {formatFormErrors(field.state.meta.errors)}
                </Text>
              ) : undefined}
            </Stack>
          )}
        />
        {submitError ? (
          <Text as="p" variant="bodySm" tone="destructive" role="alert">
            {submitError}
          </Text>
        ) : undefined}
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting ? <Loader2 className="animate-spin" /> : undefined}
          Create password account
        </Button>
      </form>
    </AuthPageShell>
  );
}

function CallbackView({ redirectTo }: { redirectTo: string }) {
  const { error, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !error) {
      router.invalidate().then(() => {
        router.navigate({ to: redirectTo });
      });
    }
  }, [isPending, error, router, redirectTo]);

  if (isPending) {
    return (
      <AuthPageShell title="Finalizing sign-in" description="Syncing your session...">
        <LoadingSpinnerContainer
          message="Finalizing your session..."
          spinnerSize={28}
        />
      </AuthPageShell>
    );
  }
  if (error) {
    return (
      <AuthPageShell title="Sign-in could not be completed" description="">
        <Stack gap="panel">
          <Text tone="destructive">'Try signing in again from the sign-in page.</Text>
          <Button asChild>
            <Link
              to="/auth/$authView"
              params={{ authView: 'sign-in' }}
              search={{ redirectTo }}
            >
              Return to sign in
            </Link>
          </Button>
        </Stack>
      </AuthPageShell>
    );
  }
  return;
}

function CompleteProfileView({ redirectTo }: { redirectTo: string }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      void router.navigate({
        to: '/auth/$authView',
        params: { authView: 'sign-in' },
        search: { redirectTo },
      });
    }
  }, [isPending, session, router, redirectTo]);

  const form = useForm({
    defaultValues: {
      username: '',
    },
    validators: {
      onSubmit: CompleteProfileRequestSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      try {
        await authClient.updateUser({
          username: value.username,
          displayUsername: value.username,
        });
        toast.success('Username saved.');
        await router.invalidate();
        router.navigate({ to: redirectTo });
      } catch {
        formApi.setErrorMap({
          onSubmit: { form: 'Unable to save username.', fields: {} },
        });
      }
    },
  });

  if (isPending || !session) {
    return (
      <AuthPageShell title="Complete your profile" description="">
        <LoadingSpinnerContainer message="Checking your account..." spinnerSize={28} />
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Choose your username"
      description="Your username is shown next to rotations that you make public. Your username is unique to you."
    >
      <Stack gap="panel">
        <div className="bg-primary/5 text-primary flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
          <CheckCircle2 className="size-4 shrink-0" />
          {session.user.isAnonymous
            ? 'Guest account on this browser'
            : `Signed in as ${session.user.email}`}
        </div>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="username"
            children={(field) => (
              <Stack gap="inset">
                <Label htmlFor={field.name}>Username</Label>
                <Input
                  id={field.name}
                  autoComplete="username"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="letters_numbers_or_dots"
                  required
                />
                <Text variant="caption" tone="muted">
                  A unique name to associate to rotations you publish.
                </Text>
                {field.state.meta.errors.length > 0 ? (
                  <Text variant="caption" tone="destructive">
                    {formatFormErrors(field.state.meta.errors)}
                  </Text>
                ) : undefined}
              </Stack>
            )}
          />
          <Button type="submit" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? <Loader2 className="animate-spin" /> : undefined}
            Save username
          </Button>
        </form>
      </Stack>
    </AuthPageShell>
  );
}

export function AuthPage({
  redirectTo,
  view,
}: {
  redirectTo?: string;
  view: AuthView;
}) {
  const safeRedirectTo = normalizeRedirectTo(redirectTo);

  switch (view) {
    case 'callback': {
      return <CallbackView redirectTo={safeRedirectTo} />;
    }
    case 'complete-profile': {
      return <CompleteProfileView redirectTo={safeRedirectTo} />;
    }
    case 'sign-in': {
      return <SignInView redirectTo={safeRedirectTo} />;
    }
    case 'sign-up': {
      return <SignUpView redirectTo={safeRedirectTo} />;
    }
    default: {
      return (
        <AuthPageShell
          title="Unknown auth view"
          description="That auth route does not exist."
        >
          <Button asChild>
            <Link
              to="/auth/$authView"
              params={{ authView: 'sign-in' }}
              search={{ redirectTo: safeRedirectTo }}
            >
              Go to sign in
            </Link>
          </Button>
        </AuthPageShell>
      );
    }
  }
}
