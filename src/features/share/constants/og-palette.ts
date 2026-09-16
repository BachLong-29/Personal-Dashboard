import type { TaskColor } from '@/types';

/**
 * Hex mirrors of the design tokens, for the shared agenda image only.
 *
 * Satori (what `next/og` renders with) understands neither CSS custom
 * properties nor `oklch()`, so the card cannot read the app's tokens the way
 * every other surface does. Values below are the exact sRGB conversions of
 * those tokens — change a token and change its twin here.
 */

/** `--bg-1` */
export const OG_BG = '#0a0a14';
/** `--surface` */
export const OG_SURFACE = '#131326';
/** `--border` (dark theme) */
export const OG_BORDER = '#2a2a48';
/** `--text-hi` */
export const OG_TEXT_HI = '#f0eeff';
/** `--text-mid` */
export const OG_TEXT_MID = '#9090b8';
/** `--text-lo` */
export const OG_TEXT_LO = '#7676a0';
/** `--gold` */
export const OG_GOLD = '#dba000';

/** `TaskColor` → hex, converted from the `oklch()` values in `COLOR_CSS`. */
export const OG_ITEM_COLORS: Record<TaskColor, string> = {
  gold: '#dba000',
  mint: '#49cc95',
  violet: '#a06cff',
  cyan: '#00cce1',
  rose: '#fd6c95',
  amber: '#fd923e',
  blue: '#0f92f7',
};

export function ogItemColor(color: string): string {
  return OG_ITEM_COLORS[color as TaskColor] ?? OG_GOLD;
}

/**
 * Rows past these make the card unreadably tall, so the tail is summarised.
 * A week holds several days of work, so it is allowed to run much longer than a
 * single day before being cut. The client needs the same numbers to word that
 * summary in the active locale.
 */
export const OG_MAX_ROWS_DAY = 16;
export const OG_MAX_ROWS_WEEK = 40;

export function ogMaxRows(scope: 'day' | 'week'): number {
  return scope === 'week' ? OG_MAX_ROWS_WEEK : OG_MAX_ROWS_DAY;
}
