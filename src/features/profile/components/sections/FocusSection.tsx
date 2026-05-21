'use client';

import { cn } from '@/libs/utils';
import { HERO_FOCUSES } from '@/constants/hero-data';
import type { ProfileFormData } from '@/types/profile';

interface Props {
  value: ProfileFormData['primaryFocus'];
  onChange: (v: string[]) => void;
}

export function FocusSection({ value, onChange }: Props) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else if (value.length < 4) {
      onChange([...value, id]);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {HERO_FOCUSES.map((f) => {
        const active = value.includes(f.id);
        const idx    = value.indexOf(f.id);

        const tileCls = cn(
          'relative border rounded-xs p-4 cursor-pointer text-left',
          'transition-all duration-[200ms] hover:-translate-y-[1px]',
          active
            ? 'border-gold bg-bg-3 shadow-[0_0_0_1px_var(--gold)]'
            : 'border-border bg-bg-1 hover:border-gold',
        );

        return (
          <button
            key={f.id}
            className={tileCls}
            onClick={() => toggle(f.id)}
            type="button"
          >
            {active && (
              <div className="absolute top-[8px] right-[8px] w-[20px] h-[20px] rounded-full grid place-items-center [font-family:var(--f-mono)] text-[10px] font-bold"
                   style={{ background: 'var(--gold)', color: 'oklch(15% 0.03 270)' }}>
                {idx + 1}
              </div>
            )}
            <div className="[font-family:var(--f-title)] italic text-[24px] text-gold">{f.glyph}</div>
            <div className="[font-family:var(--f-title)] italic text-[15px] text-text-hi mt-[3px]">{f.name}</div>
            <div className="[font-family:var(--f-mono)] text-[8px] tracking-[0.16em] uppercase text-text-lo mt-[3px]">{f.blurb}</div>
          </button>
        );
      })}
    </div>
  );
}
