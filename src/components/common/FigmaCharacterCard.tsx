'use client';

import Image from 'next/image';
import { Icon } from '@/components/common/Icon';

interface FigmaCharacterCardProps {
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
export function FigmaCharacterCard({ onClick }: FigmaCharacterCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Character: Cha Hae In SR"
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

      {/* Avatar — gold-bordered rounded frame */}
      <span
        style={{
          position: 'absolute',
          left: '3%',
          top: '55%',
          transform: 'translateY(-50%)',
          width: '27%',
          aspectRatio: '110 / 113',
          borderRadius: '22%',
          overflow: 'hidden',
          background: '#1a0f2e',
          boxShadow: '0 0 1.5cqw rgba(248,216,134,0.3)',
        }}
      >
        <Image
          src="/figma/avatar-frame.png"
          alt="Cha Hae In"
          fill
          sizes="60px"
          className="object-cover"
          style={{ objectPosition: 'top center' }}
        />
      </span>

      {/* Identity block — SR + name, stacked */}
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
            letterSpacing: '0.08em',
            textShadow: '0 0 2cqw rgba(248,216,134,0.55)',
          }}
        >
          SR
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
          Cha Hae In
        </span>
      </span>

      {/* Chevron */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '10%',
          bottom: '0',
          // transform: 'translateY(-50%)',
          width: '5.5%',
          opacity: 0.8,
        }}
      >
        <Icon icon="chevron" className="w-[24px] h-[24px] text-[#F8D886]" />
      </span>
    </button>
  );
}
