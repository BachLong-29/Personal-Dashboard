import { notFound } from 'next/navigation';

/**
 * Catches every path under a locale that no other route claims.
 *
 * Without it an unknown URL falls past the `[locale]` segment entirely and
 * lands on the bare root not-found, outside the layout that carries the theme,
 * the fonts and the translations.
 */
export default function CatchAllPage() {
  notFound();
}
