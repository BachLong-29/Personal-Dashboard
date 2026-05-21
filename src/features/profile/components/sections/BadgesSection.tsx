'use client';

import { cn } from '@/libs/utils';
import { HERO_BADGES, findAccent } from '@/constants/hero-data';
import type { ProfileFormData } from '@/types/profile';

interface Props {
  value: ProfileFormData['badges'];
  onChange: (v: string[]) => void;
}

export function BadgesSection({ value, onChange }: Props) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else if (value.length < 4) {
      onChange([...value, id]);
    }
  };

  const rarityColor: Record<string, string> = {
    rare: 'var(--cyan)',
    epic: 'var(--violet)',
    legendary: 'var(--gold)',
  };

  return (
    <div>
      <div className="flex justify-between items-baseline mb-4">
        <span className="[font-family:var(--f-title)] italic text-[13px] text-text-md">
          Choose up to four — the rest stay in your gallery.
        </span>
        <span className="[font-family:var(--f-mono)] text-[11px] tracking-[0.16em] text-gold">
          {value.length} / 4
        </span>
      </div>

      <div className="grid grid-cols-4 gap-[10px]">
        {HERO_BADGES.map((b) => {
          const accent = findAccent(b.color);
          const active = value.includes(b.id);
          const rColor = rarityColor[b.rarity] ?? 'var(--text-lo)';

          const tileCls = cn(
            'relative flex flex-col items-center justify-center gap-[3px] text-center',
            'border rounded-xs p-3 cursor-pointer min-h-[110px]',
            'transition-all duration-[200ms]',
            b.rarity === 'legendary' && 'border-[oklch(0.78_0.16_82/0.6)]',
            b.rarity === 'epic'      && 'border-[oklch(0.68_0.22_295/0.5)]',
            b.rarity === 'rare'      && 'border-[oklch(0.78_0.16_205/0.4)]',
            (b.rarity === 'uncommon' || b.rarity === 'common') && 'border-border',
            active && 'shadow-[0_0_0_1px_var(--a)]',
          );

          return (
            <button
              key={b.id}
              className={tileCls}
              style={{
                background: active
                  ? `radial-gradient(circle at 50% 0%, ${accent.glow}30, oklch(16% 0.03 270/0.6))`
                  : 'oklch(16% 0.03 270/0.6)',
                ['--a' as string]: accent.glow,
              }}
              onClick={() => toggle(b.id)}
              type="button"
            >
              <div className="[font-family:var(--f-title)] italic text-[26px] leading-none" style={{ color: accent.glow }}>
                {b.glyph}
              </div>
              <div className="[font-family:var(--f-title)] italic text-[12px] text-text-hi">{b.name}</div>
              <div className="[font-family:var(--f-mono)] text-[7px] tracking-[0.18em] text-text-lo uppercase">{b.era}</div>
              <div className="[font-family:var(--f-mono)] text-[7px] tracking-[0.22em] uppercase" style={{ color: rColor }}>
                {b.rarity}
              </div>
              {active && (
                <div
                  className="absolute top-[5px] right-[5px] w-[16px] h-[16px] rounded-full grid place-items-center text-[9px]"
                  style={{ background: accent.glow, color: 'oklch(15% 0.03 270)' }}
                >
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
