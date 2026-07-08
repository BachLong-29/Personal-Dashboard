'use client';

import Image from 'next/image';
import { Icon } from '@/components/common/Icon';

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
      {/* Frame background — sets the aspect ratio */}
      <Image
        src="/BG_Avatart.png"
        alt=""
        width={620}
        height={220}
        priority
        className="block w-full h-auto select-none pointer-events-none"
      />

      {/* Avatar — rounded frame */}
      <span
        style={{
          position: 'absolute',
          left: '3%',
          top: '55%',
          transform: 'translateY(-50%)',
          width: '27%',
          aspectRatio: '110 / 103',
          borderRadius: '22%',
          overflow: 'hidden',
          background: '#1a0f2e',
          border: '0.6cqw solid #F8D886',
          boxShadow: '0 0 1.5cqw rgba(248,216,134,0.3)',
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
          color: '#F8D886',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: '5.5cqw',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '0.06em',
            textShadow: '0 0 2cqw rgba(248,216,134,0.55)',
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
          filter:
            'drop-shadow(0 0 0.6cqw rgba(248,216,134,0.6)) drop-shadow(0 0 1.4cqw rgba(248,216,134,0.35))',
        }}
      >
        <Icon icon="chevron" className="w-[10px] h-[10px] text-[#F8D886]" />
      </span>
    </button>
  );
}
