'use client';

import { cn } from '@/libs/utils';
import type { ThemePreference } from '@/types/profile';

interface Props {
  value: ThemePreference;
  onChange: (v: ThemePreference) => void;
}

const OPTIONS: { id: ThemePreference; name: string; hint: string; swatch: string }[] = [
  {
    id: 'light',
    name: 'Light',
    hint: 'Lavender daylight',
    swatch: 'linear-gradient(135deg, #f3f1fa 50%, #ffffff 50%)',
  },
  {
    id: 'dark',
    name: 'Dark',
    hint: 'Midnight ink',
    swatch: 'linear-gradient(135deg, #07070e 50%, #131326 50%)',
  },
  {
    id: 'system',
    name: 'System',
    hint: 'Follow your device',
    swatch: 'linear-gradient(135deg, #f3f1fa 50%, #07070e 50%)',
  },
];

export function AppearanceSection({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {OPTIONS.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              'flex items-center gap-3 px-[18px] py-[14px] border rounded-xs cursor-pointer text-left',
              'transition-all duration-[200ms] hover:bg-bg-2',
              active ? 'bg-bg-2 border-gold' : 'bg-bg-1 border-border',
            )}
            style={
              active ? { boxShadow: '0 0 0 1px var(--gold), 0 0 20px var(--gold-glow)' } : undefined
            }
          >
            <span
              className="w-[26px] h-[26px] rounded-full flex-shrink-0 border border-border-hi"
              style={{ background: o.swatch }}
            />
            <span>
              <span className="block [font-family:var(--f-title)] italic text-[15px] text-text-hi">
                {o.name}
              </span>
              <span className="block [font-family:var(--f-mono)] text-[9px] tracking-[0.14em] uppercase text-text-lo mt-[3px]">
                {o.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
