'use client';

import Image from 'next/image';
import { Icon } from '@/components/common/Icon';

// Imported rather than referenced by path: Next fingerprints each file, so
// redrawing a frame changes its URL and no cached copy is served in its place.
import frameDark from '../../../public/BG_Avatart.png';
import frameLight from '../../../public/BG_Avatart_light.png';

interface CharacterCardProps {
  /** Hero display name (profile.heroName ?? char.name). */
  name: string;
  /** Rank label shown in the badge slot (e.g. "Adept"). */
  rank: string;
  /** User avatar URL; falls back to `fallbackGlyph` when absent. */
  avatarUrl?: string | null;
  /** Emoji shown when there is no avatar image. */
  fallbackGlyph?: string;
  onClick?: () => void;
}

/**
 * Character card rendered on top of the pre-baked frame image (BG_Avatart.png,
 * 620×220 — border + wave notch + texture already included).
 *
 * The frame is the flow element that sets the box; everything else is overlaid
 * with percentage positions and `cqw` (container-width) font sizes, so the whole
 * card scales as one unit at any width without drifting out of alignment.
 */
/** Split a name so line 1 holds ≤6 chars (broken at a space when possible)
 *  and line 2 holds the rest. */
function splitName(name: string): [string, string] {
  const MAX_FIRST = 6;
  if (name.length <= MAX_FIRST) return [name, ''];
  const head = name.slice(0, MAX_FIRST);
  const lastSpace = head.lastIndexOf(' ');
  const splitAt = lastSpace > 0 ? lastSpace : MAX_FIRST;
  return [name.slice(0, splitAt).trimEnd(), name.slice(splitAt).trimStart()];
}

export function CharacterCard({
  name,
  rank,
  avatarUrl,
  fallbackGlyph = '🧝‍♀️',
  onClick,
}: CharacterCardProps) {
  const [nameHead, nameTail] = splitName(name);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Character: ${name}, ${rank}`}
      style={{
        position: 'relative',
        display: 'block',
        width: 150,
        padding: 0,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        containerType: 'inline-size',
        flexShrink: 0,
      }}
    >
      {/* Frame background — sets the aspect ratio. Each theme has its own
          frame: the night one is a dark plate, the day one parchment. */}
      <Image
        src={frameLight}
        alt=""
        priority
        className="block dark:hidden w-full h-auto select-none pointer-events-none"
      />
      <Image
        src={frameDark}
        alt=""
        priority
        className="hidden dark:block w-full h-auto select-none pointer-events-none"
      />

      {/* Avatar — rounded frame */}
      <span
        className="bg-[var(--bg-3)] border-[var(--gold)] shadow-[0_0_1.5cqw_var(--gold-glow)] dark:bg-[#1a0f2e] dark:border-[#F8D886]"
        style={{
          position: 'absolute',
          left: '3%',
          top: '55%',
          transform: 'translateY(-50%)',
          width: '27%',
          aspectRatio: '110 / 103',
          borderRadius: '22%',
          overflow: 'hidden',
          borderWidth: '0.6cqw',
          borderStyle: 'solid',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12cqw',
          lineHeight: 1,
        }}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            fill
            sizes="60px"
            className="object-cover"
            style={{ objectPosition: 'top center' }}
          />
        ) : (
          <span aria-hidden="true">{fallbackGlyph}</span>
        )}
      </span>

      {/* Identity block — rank + name, stacked */}
      <span
        // Day: the theme's deep gold, which holds on parchment. Night keeps the
        // pale gold the dark frame was drawn for.
        className="text-[var(--gold-2)] dark:text-[#F8D886]"
        style={{
          position: 'absolute',
          left: '36%',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5cqw',
          maxWidth: '42%',
          fontFamily: "var(--font-bento), 'Sora', var(--font-body, sans-serif)",
          textAlign: 'left',
        }}
      >
        <span
          className="dark:[text-shadow:0_0_2cqw_rgba(248,216,134,0.55)]"
          style={{
            fontSize: '5.5cqw',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {rank}
        </span>
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '6.8cqw',
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: '0.03em',
          }}
        >
          <span style={{ whiteSpace: 'nowrap' }}>{nameHead}</span>
          {nameTail && (
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nameTail}
            </span>
          )}
        </span>
      </span>

      {/* Chevron */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '5%',
          top: '50%',
          width: '5.5%',
          opacity: 0.8,
        }}
        className="dark:[filter:drop-shadow(0_0_0.6cqw_rgba(248,216,134,0.6))_drop-shadow(0_0_1.4cqw_rgba(248,216,134,0.35))]"
      >
        <Icon
          icon="chevron"
          className="w-[10px] h-[10px] text-[var(--gold-2)] dark:text-[#F8D886]"
        />
      </span>
    </button>
  );
}
