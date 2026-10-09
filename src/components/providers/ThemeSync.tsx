'use client';

import { useEffect, useRef } from 'react';

import { useProfile } from '@/features/profile/hooks/useProfile';
import { useTheme } from './ThemeProvider';

/**
 * Applies the theme saved in the user's settings once per session, so the choice
 * follows the account across devices. Local toggles afterwards are not overridden.
 */
export function ThemeSync() {
  const { data } = useProfile();
  const { setTheme } = useTheme();
  const synced = useRef(false);

  useEffect(() => {
    if (!data || synced.current) return;
    synced.current = true;
    setTheme(data.settings.theme);
  }, [data, setTheme]);

  return null;
}
