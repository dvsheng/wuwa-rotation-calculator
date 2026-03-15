import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppHeader } from './AppHeader';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  ),
  useRouterState: vi.fn(),
}));

vi.mock('@/components/auth/LoginButton', () => ({
  LoginButton: () => <button type="button">Login</button>,
}));

describe('AppHeader', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    globalThis.document.documentElement.classList.remove('dark');
    globalThis.document.documentElement.style.colorScheme = '';
  });

  it('toggles dark mode from the navigation bar', async () => {
    render(<AppHeader />);

    await userEvent.click(screen.getByRole('button', { name: 'Toggle dark mode' }));

    expect(globalThis.document.documentElement).toHaveClass('dark');
    expect(globalThis.document.documentElement.style.colorScheme).toBe('dark');
    expect(globalThis.localStorage.getItem('wuwa-theme')).toBe('dark');
    expect(
      screen.getByRole('button', { name: 'Toggle dark mode' }),
    ).toBeInTheDocument();
  });
});
