/**
 * Registry of SVG icons that live in `public/icons/`.
 *
 * Maps a stable key → public path. A key may be the file's `Gi*` name, a
 * friendlier alias, or a supported emoji alias; all resolve to the same asset.
 * Anything *not* listed here is treated as a plain value and rendered as-is by
 * `<Icon />`.
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
type IconExtension = 'png' | 'svg';

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

/** Emoji aliases → file name. Useful when stored data uses emoji values. */
const ICON_EMOJI_ALIASES: Record<string, IconFile> = {
  '📚': 'GiBookshelf',
  '💎': 'GiCutDiamond',
  '✨': 'GiEclipseFlare',
  '🎱': 'GiEightBall',
  '⏪': 'GiFastBackwardButton',
  '⏩': 'GiFastForwardButton',
  '🎯': 'GiHighShot',
  '🦁': 'GiLion',
  '📓': 'GiNotebook',
  '⏻': 'GiPowerButton',
  '🔔': 'GiRingingBell',
  '🔥': 'GiSmallFire',
  '📖': 'GiSpellBook',
  '❎': 'GiTicTacToe',
  '🪙': 'GiTwoCoins',
  '💰': 'GiTwoCoins',
  '🌐': 'GiWireframeGlobe',
  '🌍': 'GiWireframeGlobe',
  '🌎': 'GiWireframeGlobe',
  '🌏': 'GiWireframeGlobe',
  '📜': 'GiNotebook',
  // '🚀': 'GiBookshelf',
  '📋': 'GiNotebook',
};

/** Optional default colors for bundled icons. */
const ICON_COLORS: Partial<Record<IconFile, string>> = {
  GiCutDiamond: 'var(--cyan)',
  GiEclipseFlare: 'var(--violet)',
  GiHighShot: 'var(--gold)',
  GiPowerButton: 'var(--rose)',
  GiRingingBell: 'var(--gold)',
  GiSmallFire: 'var(--warning)',
  GiTwoCoins: 'var(--gold)',
  GiWireframeGlobe: 'var(--cyan)',
  // GiNotebook: 'var(--gold-2)',
  GiBookshelf: 'var(--rose)',
};

/** File extension per icon. Unspecified entries fall back to `.svg`. */
const ICON_EXTENSIONS: Partial<Record<IconFile, IconExtension>> = {
  GiNotebook: 'png',
};

/** Fast lookup set for the canonical file names. */
const ICON_SET = new Set<IconFile>(ICON_FILES);
const EMOJI_VARIATION_SELECTOR_REGEX = /\uFE0F/g;

function toIconSrc(iconFile: IconFile): string {
  const extension = ICON_EXTENSIONS[iconFile] ?? 'svg';
  return `/icons/${iconFile}.${extension}`;
}

function normalizeIconName(name: string): string {
  return name.trim();
}

function normalizeEmojiName(name: string): string {
  return name.replace(EMOJI_VARIATION_SELECTOR_REGEX, '');
}

function isIconFile(name: string): name is IconFile {
  return ICON_SET.has(name as IconFile);
}

function resolveAliasedIcon(name: string): IconFile | null {
  const emojiAlias = ICON_EMOJI_ALIASES[normalizeEmojiName(name)];
  if (emojiAlias) return emojiAlias;

  const textAlias = ICON_ALIASES[name.toLowerCase()];
  return textAlias ?? null;
}

function resolveIconFile(name: string | null | undefined): IconFile | null {
  if (!name) return null;

  const normalizedName = normalizeIconName(name);
  if (!normalizedName) return null;

  if (isIconFile(normalizedName)) {
    return normalizedName;
  }

  return resolveAliasedIcon(normalizedName);
}

/**
 * Resolve an icon identifier to its public SVG path.
 *
 * @returns the `/icons/*.svg` path when `name` is a known icon, otherwise
 *   `null` (caller should fall back to a default icon).
 */
export function resolveIconSrc(name: string | null | undefined): string | null {
  const iconFile = resolveIconFile(name);
  return iconFile ? toIconSrc(iconFile) : null;
}

/** Resolve an icon identifier to its default color token, when one is defined. */
export function resolveIconColor(name: string | null | undefined): string | null {
  const iconFile = resolveIconFile(name);
  return iconFile ? (ICON_COLORS[iconFile] ?? null) : null;
}

export type { IconFile };
