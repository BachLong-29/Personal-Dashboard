'use client';

import { cn } from '@/libs/utils';
import { HERO_ACCENTS } from '@/constants/hero-data';
import type { ProfileFormData } from '@/types/profile';

interface Props {
  value: ProfileFormData['accent'];
  onChange: (v: string) => void;
}

export function ThemeSection({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {HERO_ACCENTS.map((a) => {
        const active = value === a.id;

        const swatchCls = cn(
          'relative flex items-center gap-3 px-[18px] py-[14px]',
          'border rounded-xs cursor-pointer text-left',
          'transition-all duration-[200ms]',
          'hover:bg-bg-2',
          active ? 'bg-bg-2' : 'bg-bg-1',
        );

        return (
          <button
            key={a.id}
            className={swatchCls}
            style={{
              borderColor: active ? a.glow : 'var(--border)',
              boxShadow: active ? `0 0 0 1px ${a.glow}, 0 0 20px ${a.glow}26` : undefined,
            }}
            onClick={() => onChange(a.id)}
            type="button"
          >
            <span
              className="w-[26px] h-[26px] rounded-full flex-shrink-0"
              style={{
                background: a.glow,
                boxShadow: `0 0 14px ${a.glow}, inset 0 0 0 1px oklch(100% 0 0 / 0.2)`,
              }}
            />
            <span className="[font-family:var(--f-title)] italic text-[15px] text-text-hi">{a.name}</span>
            {active && (
              <div
                className="absolute top-2 right-2 w-[16px] h-[16px] rounded-full grid place-items-center text-[9px]"
                style={{ background: a.glow, color: 'oklch(15% 0.03 270)' }}
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
