import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/libs/utils/cn';

import { resolveIconColor, resolveIconSrc } from './icon-registry';

interface IconProps {
  /** Icon identifier: a registered `Gi*` name / alias, or a raw value (emoji). */
  icon?: string | null;
  /** Rendered when `icon` is empty or unknown. Defaults to showing `icon` as-is. */
  fallback?: ReactNode;
  /** Extra classes — sizes to `1em` by default so it flows inline like an emoji. */
  className?: string;
  /** Inline styles for the wrapper element. */
  style?: CSSProperties;
  /** Apply the registry's default color token when this icon has one. */
  useMappedColor?: boolean;
}

/**
 * Renders an icon by name. If `icon` matches a bundled asset (see
 * {@link resolveIconSrc}), `.svg` files are drawn as `currentColor`-tinted masks
 * while `.png` files are rendered as regular images. Otherwise the default icon
 * is shown — either the provided `fallback`, or the raw `icon` value (e.g. an
 * emoji), or nothing.
 *
 * @example
 * <Icon icon="fire" />            // → public/icons/GiSmallFire.svg
 * <Icon icon="fire" useMappedColor /> // → same icon with mapped default color
 * <Icon icon="🎯" />              // → renders the emoji unchanged
 * <Icon icon={q.icon} fallback="📌" />
 */
export function Icon({ icon, fallback, className, style, useMappedColor = true }: IconProps) {
  const src = resolveIconSrc(icon);
  const mappedColor = useMappedColor ? resolveIconColor(icon) : null;
  const resolvedColor = style?.color ?? mappedColor;
  const resolvedStyle: CSSProperties = {
    ...style,
    ...(resolvedColor ? { color: resolvedColor } : {}),
  };

  if (src) {
    const isPngAsset = src.toLowerCase().endsWith('.png');

    if (isPngAsset) {
      return (
        <img
          aria-hidden
          alt=""
          src={src}
          className={cn(
            'inline-block w-[1em] h-[1em] shrink-0 align-[-0.125em] object-contain',
            className,
          )}
          style={style}
        />
      );
    }

    const mask = `url(${src}) center / contain no-repeat`;
    return (
      <span
        aria-hidden
        className={cn(
          'inline-block w-[1em] h-[1em] shrink-0 align-[-0.125em] bg-current',
          className,
        )}
        // Dynamic src → inline style (Tailwind JIT can't pre-generate the arbitrary mask class).
        style={{
          ...resolvedStyle,
          mask,
          WebkitMask: mask,
        }}
      />
    );
  }

  if (fallback !== undefined && fallback !== null && fallback !== '') {
    return (
      <span className={className} style={resolvedStyle}>
        {fallback}
      </span>
    );
  }

  if (icon) {
    return (
      <span className={className} style={resolvedStyle}>
        {icon}
      </span>
    );
  }

  return null;
}
