/**
 * Registry of SVG icons that live in `public/icons/`.
 *
 * Maps a stable key → public path. A key may be the file's `Gi*` name or a
 * friendlier alias; both resolve to the same asset. Anything *not* listed here
 * is treated as a plain value (e.g. an emoji) and rendered as-is by `<Icon />`.
 *
 * To add an icon: drop the `.svg` into `public/icons/`, then add an entry below.
 */
const ICON_FILES = [
  'GiBookshelf',
  'GiCutDiamond',
  'GiEclipseFlare',
  'GiEightBall',
  'GiFastBackwardButton',
  'GiFastForwardButton',
  'GiHighShot',
  'GiLion',
  'GiNotebook',
  'GiPowerButton',
  'GiRingingBell',
  'GiSmallFire',
  'GiSpellBook',
  'GiTicTacToe',
  'GiTwoCoins',
  'GiWireframeGlobe',
] as const;

type IconFile = (typeof ICON_FILES)[number];

/** Human-friendly aliases → file name. Lets callers use semantic keys. */
const ICON_ALIASES: Record<string, IconFile> = {
  book: 'GiBookshelf',
  diamond: 'GiCutDiamond',
  flare: 'GiEclipseFlare',
  eightball: 'GiEightBall',
  rewind: 'GiFastBackwardButton',
  forward: 'GiFastForwardButton',
  shot: 'GiHighShot',
  lion: 'GiLion',
  notebook: 'GiNotebook',
  power: 'GiPowerButton',
  bell: 'GiRingingBell',
  fire: 'GiSmallFire',
  spellbook: 'GiSpellBook',
  tictactoe: 'GiTicTacToe',
  coins: 'GiTwoCoins',
  globe: 'GiWireframeGlobe',
};

/** Fast lookup set for the canonical file names. */
const ICON_SET = new Set<string>(ICON_FILES);

/**
 * Resolve an icon identifier to its public SVG path.
 *
 * @returns the `/icons/*.svg` path when `name` is a known icon, otherwise
 *   `null` (caller should fall back to a default icon).
 */
export function resolveIconSrc(name: string | null | undefined): string | null {
  if (!name) return null;
  if (ICON_SET.has(name)) return `/icons/${name}.svg`;
  const aliased = ICON_ALIASES[name.toLowerCase()];
  return aliased ? `/icons/${aliased}.svg` : null;
}

/** True when `name` maps to a bundled SVG icon. */
export function isKnownIcon(name: string | null | undefined): boolean {
  return resolveIconSrc(name) !== null;
}

export type { IconFile };
