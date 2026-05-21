'use client';

import { cn } from '@/libs/utils';
import { HERO_COMPANIONS, findAccent } from '@/constants/hero-data';
import type { ProfileFormData } from '@/types/profile';

interface Props {
  value: ProfileFormData['companionId'];
  onChange: (v: string) => void;
}

export function CompanionSection({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {HERO_COMPANIONS.map((c) => {
        const accent = findAccent(c.tone);
        const active = value === c.id;

        const rowCls = cn(
          'relative grid gap-4 items-center border rounded-sm px-5 py-4 cursor-pointer',
          'transition-all duration-[200ms] text-left font-inherit',
          'hover:-translate-y-[1px]',
          active ? 'bg-bg-3' : 'bg-bg-1',
        );

        return (
          <button
            key={c.id}
            className={rowCls}
            style={{
              gridTemplateColumns: '52px 1fr auto',
              borderColor: active ? accent.glow : 'var(--border)',
              boxShadow: active ? `0 0 0 1px ${accent.glow}` : undefined,
            }}
            onClick={() => onChange(c.id)}
            type="button"
          >
            <div className="[font-family:var(--f-title)] italic text-[32px] text-center" style={{ color: accent.glow }}>
              {c.glyph}
            </div>
            <div>
              <div className="[font-family:var(--f-title)] italic text-[17px] text-text-hi">{c.name}</div>
              <div className="[font-family:var(--f-title)] text-[12px] text-text-md mt-[3px] leading-relaxed">{c.blurb}</div>
            </div>
            <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.14em] text-right max-w-[180px] leading-relaxed" style={{ color: accent.glow }}>
              {c.bonus}
            </div>
            {active && (
              <div
                className="absolute top-3 right-3 w-[20px] h-[20px] rounded-full grid place-items-center text-[10px]"
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
