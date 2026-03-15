import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'wuwa-theme';

export type Theme = 'light' | 'dark';

const getStoredTheme = (): Theme | undefined => {
  try {
    const storedTheme = globalThis.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : undefined;
  } catch {
    return undefined;
  }
};

const getSystemTheme = (): Theme => {
  try {
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
};

const applyTheme = (theme: Theme) => {
  try {
    const root = globalThis.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  } catch {}
};

const getInitialTheme = (): Theme => getStoredTheme() ?? getSystemTheme();

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (nextTheme: Theme) => {
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
