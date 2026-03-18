import { useState } from 'react';

export const THEME_STORAGE_KEY = 'wuwa-theme';

export type Theme = 'light' | 'dark';

export const getStoredTheme = (): Theme | undefined => {
  try {
    const storedTheme = globalThis.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : undefined;
  } catch {
    return undefined;
  }
};

export const getSystemTheme = (): Theme => {
  try {
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
};

export const applyTheme = (theme: Theme) => {
  try {
    const root = globalThis.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  } catch {}
};

const getAppliedTheme = (): Theme | undefined => {
  try {
    return globalThis.document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';
  } catch {
    return undefined;
  }
};

const getInitialTheme = (): Theme =>
  getAppliedTheme() ?? getStoredTheme() ?? getSystemTheme();

export const themeInitScript = `(() => {
  try {
    const storageKey = '${THEME_STORAGE_KEY}';
    const storedTheme = localStorage.getItem(storageKey);
    const theme =
      storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  } catch {}
})();`;

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = (nextTheme: Theme) => {
    applyTheme(nextTheme);
    setThemeState(nextTheme);
    try {
      globalThis.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {}
  };

  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
};
