/**
 * Registry of bundled icons that live in `public/icons/`.
 *
 * Maps a stable key → public path. A key may be the file's `Gi*` name, a
 * friendlier alias, or a supported emoji alias; all resolve to the same asset.
 * Anything *not* listed here is treated as a plain value and rendered as-is by
 * `<Icon />`.
 *
 * To add an icon: drop the asset into `public/icons/`, then add an entry below.
 */
const ICON_FILES = [
  'ArrowLeft',
  'ArrowRight',
  'CardChevron',
  'GiBookshelf',
  'GiCalendar',
  'GiCutDiamond',
  'GiEclipseFlare',
  'GiEightBall',
  'GiFastBackwardButton',
  'GiFastForwardButton',
  'GiHighShot',
  'GiLion',
  'GiNotebook',
  'GiPirateFlag',
  'GiPowerButton',
  'GiRingingBell',
  'GiSmallFire',
  'GiSpellBook',
  'GiTicTacToe',
  'GiTwoCoins',
  'GiWireframeGlobe',
  'GiZeusSword',
] as const;

type IconFile = (typeof ICON_FILES)[number];
type IconExtension = 'png' | 'svg';

/** Human-friendly aliases → file name. Lets callers use semantic keys. */
const ICON_ALIASES: Record<string, IconFile> = {
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  chevron: 'CardChevron',
  book: 'GiBookshelf',
  diamond: 'GiCutDiamond',
  flare: 'GiEclipseFlare',
  eightball: 'GiEightBall',
  rewind: 'GiFastBackwardButton',
  forward: 'GiFastForwardButton',
  shot: 'GiHighShot',
  lion: 'GiLion',
  notebook: 'GiNotebook',
  pirateflag: 'GiPirateFlag',
  power: 'GiPowerButton',
  bell: 'GiRingingBell',
  fire: 'GiSmallFire',
  spellbook: 'GiSpellBook',
  tictactoe: 'GiTicTacToe',
  coins: 'GiTwoCoins',
  globe: 'GiWireframeGlobe',
  calendar: 'GiCalendar',
  zeussword: 'GiZeusSword',
  close: 'GiZeusSword',
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
  '📅': 'GiCalendar',
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

/**
 * An icon value that is an uploaded image rather than an emoji or a registry
 * key. Stored in the same string field, so callers tell them apart by shape.
 */
const UPLOADED_ICON_REGEX = /^https?:\/\//i;

export function isUploadedIcon(name: string | null | undefined): boolean {
  return Boolean(name && UPLOADED_ICON_REGEX.test(name.trim()));
}

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

/**
 * `name` with what makes it look right but match nothing taken out: full-width and
 * compatibility letters are folded to plain ones (NFKC), and invisible format and control
 * characters (zero-width space, joiners, direction marks…) are dropped.
 */
export function cleanIconText(name: string): string {
  return name
    .normalize('NFKC')
    .replace(/[\p{Cf}\p{Cc}]/gu, '')
    .trim();
}

function lookupIconFile(name: string): IconFile | null {
  if (!name) return null;
  if (isIconFile(name)) return name;
  return resolveAliasedIcon(name);
}

function resolveIconFile(name: string | null | undefined): IconFile | null {
  if (!name) return null;

  // As stored first, so emoji sequences are looked up untouched; the cleaned form is the
  // second chance for a name that arrived with stray characters.
  return lookupIconFile(normalizeIconName(name)) ?? lookupIconFile(cleanIconText(name));
}

/**
 * Resolve an icon identifier to its public SVG path.
 *
 * @returns the `/icons/*.svg` path when `name` is a known icon, otherwise
 *   `null` (caller should fall back to a default icon).
 */
export function resolveIconSrc(name: string | null | undefined): string | null {
  const iconFile = resolveIconFile(name);
  if (iconFile) return toIconSrc(iconFile);
  // Uploaded images are already a usable src — pass them straight through.
  return isUploadedIcon(name) ? (name as string).trim() : null;
}

/**
 * A bare word such as `globe` that matched nothing. Printed as text it reads as a bug, so
 * callers swap it for a neutral glyph or drop it; emoji and symbols are not word-like.
 */
const NAME_LIKE = /^\p{L}[\p{L}\p{N}_-]{2,}$/u;

export function isNameLike(name: string): boolean {
  return NAME_LIKE.test(cleanIconText(name));
}

/**
 * The icon as plain text, for places that only take a string (a `title` attribute, a select
 * label). Only an emoji or symbol survives; bundled artwork and uploaded images have no text
 * form, so they come back empty rather than as the word `fire` or a URL.
 */
export function iconAsText(name: string | null | undefined): string {
  if (!name || resolveIconSrc(name) || isNameLike(name)) return '';
  return cleanIconText(name);
}

/**
 * The bundled artwork offered in the icon picker, by alias. Same set and order as the mobile
 * app's picker, so an icon chosen on either renders the same on both.
 */
export const QUEST_ICONS = [
  'fire',
  'coins',
  'diamond',
  'globe',
  'bell',
  'lion',
  'book',
  'notebook',
  'spellbook',
  'shot',
  'calendar',
  'flare',
  'power',
  'eightball',
  'pirateflag',
  'tictactoe',
] as const;

/** Resolve an icon identifier to its default color token, when one is defined. */
export function resolveIconColor(name: string | null | undefined): string | null {
  const iconFile = resolveIconFile(name);
  return iconFile ? (ICON_COLORS[iconFile] ?? null) : null;
}

export type { IconFile };
