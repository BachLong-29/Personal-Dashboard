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
export function FigmaCharacterCard({
  name,
  rank,
  avatarUrl,
  fallbackGlyph = '🧝‍♀️',
  onClick,
}: CharacterCardProps) {
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
          fontFamily: "'Sora', var(--font-body, sans-serif)",
          color: '#F8D886',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: '4.2cqw',
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
            fontSize: '5cqw',
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
      </span>

      {/* Chevron */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '10%',
          bottom: '0',
          width: '5.5%',
          opacity: 0.8,
        }}
      >
        <Icon icon="chevron" className="w-[24px] h-[24px] text-[#F8D886]" />
      </span>
    </button>
  );
}
