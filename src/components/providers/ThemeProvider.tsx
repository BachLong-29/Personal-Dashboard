'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** User preference: 'light' | 'dark' | 'system'. */
  theme: Theme;
  /** Actual theme applied to the document ('system' resolved to light/dark). */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

/** localStorage key holding the user's preference ('light' | 'dark' | 'system'). */
export const THEME_STORAGE_KEY = 'theme';
/** Cookie key holding the *resolved* theme ('light' | 'dark') for server-side rendering. */
export const THEME_COOKIE_KEY = 'theme-resolved';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  // Persist for the server so the next request renders the correct class up front.
  document.cookie = `${THEME_COOKIE_KEY}=${resolved}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  // Resolve + apply the theme, and follow system changes when in 'system' mode.
  useEffect(() => {
    const resolve = () => {
      const next = theme === 'system' ? getSystemTheme() : theme;
      setResolvedTheme(next);
      applyTheme(next);
    };
    resolve();

    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', resolve);
    return () => mql.removeEventListener('change', resolve);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
