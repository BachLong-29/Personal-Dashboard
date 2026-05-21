'use client';

import { cn } from '@/libs/utils';
import { HERO_CLASSES, findAccent } from '@/constants/hero-data';
import type { ProfileFormData } from '@/types/profile';

interface Props {
  value: ProfileFormData['classId'];
  onChange: (v: string) => void;
}

export function ClassSection({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {HERO_CLASSES.map((cls) => {
        const accent = findAccent(cls.color);
        const active = value === cls.id;

        const cardCls = cn(
          'relative text-left border rounded-sm p-[18px] cursor-pointer',
          'transition-all duration-[200ms] overflow-hidden',
          'hover:-translate-y-[2px]',
          active
            ? 'bg-bg-3'
            : 'bg-bg-1',
        );

        return (
          <button
            key={cls.id}
            className={cardCls}
            style={{
              borderColor: active ? accent.glow : 'var(--border)',
              boxShadow: active ? `0 0 0 1px ${accent.glow}, 0 0 24px ${accent.glow}26` : undefined,
              ['--accent' as string]: accent.glow,
            }}
            onClick={() => onChange(cls.id)}
            type="button"
          >
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-[240ms]"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${accent.glow}, transparent 60%)`,
                opacity: active ? 0.10 : 0,
              }}
            />
            <div className="[font-family:var(--f-title)] italic text-[28px] leading-none mb-[6px]" style={{ color: accent.glow }}>
              {cls.glyph}
            </div>
            <div className="[font-family:var(--f-title)] italic text-[19px] text-text-hi mb-[3px]">{cls.name}</div>
            <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.2em] uppercase text-text-lo mb-[8px]">{cls.tagline}</div>
            <div className="[font-family:var(--f-title)] text-[12px] text-text-md leading-relaxed">{cls.blurb}</div>
            <div className="mt-3 [font-family:var(--f-mono)] text-[8px] tracking-[0.18em] uppercase" style={{ color: accent.glow }}>
              PRIMARY · {cls.bias.toUpperCase()}
            </div>
            {active && (
              <div
                className="absolute top-3 right-3 w-[22px] h-[22px] rounded-full grid place-items-center text-[11px] font-bold"
                style={{ background: accent.glow, color: 'oklch(15% 0.03 270)' }}
              >
                ✓
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
