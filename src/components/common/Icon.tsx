import type { ReactNode } from 'react';

import { cn } from '@/libs/utils/cn';

import { resolveIconSrc } from './icon-registry';

interface IconProps {
  /** Icon identifier: a registered `Gi*` name / alias, or a raw value (emoji). */
  icon?: string | null;
  /** Rendered when `icon` is empty or unknown. Defaults to showing `icon` as-is. */
  fallback?: ReactNode;
  /** Extra classes — sizes to `1em` by default so it flows inline like an emoji. */
  className?: string;
}

/**
 * Renders an icon by name. If `icon` matches a bundled SVG (see
 * {@link resolveIconSrc}) it's drawn as a `currentColor`-tinted mask so it
 * inherits surrounding text color; otherwise the default icon is shown — either
 * the provided `fallback`, or the raw `icon` value (e.g. an emoji), or nothing.
 *
 * @example
 * <Icon icon="fire" />            // → public/icons/GiSmallFire.svg
 * <Icon icon="🎯" />              // → renders the emoji unchanged
 * <Icon icon={q.icon} fallback="📌" />
 */
export function Icon({ icon, fallback, className }: IconProps) {
  const src = resolveIconSrc(icon);

  if (src) {
    const mask = `url(${src}) center / contain no-repeat`;
    return (
      <span
        aria-hidden
        className={cn(
          'inline-block w-[1em] h-[1em] shrink-0 align-[-0.125em] bg-current',
          className,
        )}
        // Dynamic src → inline style (Tailwind JIT can't pre-generate the arbitrary mask class).
        style={{ mask, WebkitMask: mask }}
      />
    );
  }

  if (fallback !== undefined && fallback !== null && fallback !== '') {
    return <span className={className}>{fallback}</span>;
  }

  if (icon) {
    return <span className={className}>{icon}</span>;
  }

  return null;
}
