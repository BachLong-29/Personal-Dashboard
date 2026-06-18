'use client';

import { cn } from '@/libs/utils';
import {
  findAccent,
  findClass,
  findCompanion,
  findRank,
  findBadge,
  DEFAULT_PLAYER_STATS,
  type HeroAccent,
} from '@/constants/hero-data';
import type { ProfileFormData, HeroStats } from '@/types/profile';

interface HeroSigilProps {
  glyph: string;
  accent: HeroAccent;
  size?: number;
}

function HeroSigil({ glyph, accent, size = 96 }: HeroSigilProps) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="-50 -50 100 100" width={size} height={size}>
        <defs>
          <radialGradient id="hc-sigil-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent.glow} stopOpacity="0.5" />
            <stop offset="60%" stopColor={accent.glow} stopOpacity="0.05" />
            <stop offset="100%" stopColor={accent.glow} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="48" fill="url(#hc-sigil-glow)" />
        <circle r="42" fill="oklch(14% 0.03 270)" stroke={accent.glow} strokeWidth="1" />
        <circle r="36" fill="none" stroke={accent.glow} strokeWidth="0.5" opacity="0.5" />
        <g
          style={{
            transformOrigin: 'center',
            transformBox: 'fill-box',
            animation: 'spin 30s linear infinite',
          }}
        >
          <circle
            r="46"
            fill="none"
            stroke={accent.glow}
            strokeWidth="0.6"
            strokeDasharray="1 4"
            opacity="0.7"
          />
        </g>
        {[0, 90, 180, 270].map((a, i) => (
          <g key={i} transform={`rotate(${a})`}>
            <line x1="0" y1="-46" x2="0" y2="-50" stroke={accent.glow} strokeWidth="1.2" />
          </g>
        ))}
        <text
          y="11"
          textAnchor="middle"
          fontFamily="Cinzel, serif"
          fontSize="34"
          fill={accent.glow}
        >
          {glyph || '✦'}
        </text>
      </svg>
    </div>
  );
}

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color: string;
}

function StatBar({ label, value, max = 10, color }: StatBarProps) {
  const pct = (value / max) * 100;
  return (
    <div className="flex flex-col gap-[3px]">
      <div className="flex justify-between items-baseline">
        <span className="[font-family:var(--f-mono)] text-[9px] tracking-[0.14em] uppercase text-text-lo">
          {label}
        </span>
        <span className="[font-family:var(--f-title)] text-[14px] italic" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-[3px] rounded-sm bg-bg-3 overflow-hidden">
        <div
          className="h-full rounded-sm transition-[width] duration-[280ms]"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}

interface BadgeTileProps {
  badge: ReturnType<typeof findBadge>;
  mini?: boolean;
}

function BadgeTile({ badge, mini }: BadgeTileProps) {
  if (!badge) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-[2px] text-center',
          'border border-dashed border-border-lo rounded-xs',
          mini ? 'min-h-[80px] p-2' : 'min-h-[110px] p-3',
          'text-text-lo [font-family:var(--f-title)] italic text-[18px]',
        )}
      >
        <span>—</span>
      </div>
    );
  }

  const accent = findAccent(badge.color);
  const rarityColor: Record<string, string> = {
    rare: 'var(--cyan)',
    epic: 'var(--violet)',
    legendary: 'var(--gold)',
  };
  const tileColor = rarityColor[badge.rarity] ?? 'var(--text-lo)';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-[2px] text-center',
        'border rounded-xs transition-all',
        mini ? 'min-h-[80px] p-2' : 'min-h-[110px] p-3',
        badge.rarity === 'legendary' && 'border-[oklch(0.78_0.16_82/0.6)]',
        badge.rarity === 'epic' && 'border-[oklch(0.68_0.22_295/0.5)]',
        badge.rarity === 'rare' && 'border-[oklch(0.78_0.16_205/0.4)]',
        (badge.rarity === 'uncommon' || badge.rarity === 'common') && 'border-border-lo',
      )}
      style={{ background: `radial-gradient(circle at 50% 0%, ${accent.glow}18, transparent 70%)` }}
    >
      <div
        className="[font-family:var(--f-title)] text-[22px] leading-none italic"
        style={{ color: accent.glow }}
      >
        {badge.glyph}
      </div>
      {!mini && (
        <div className="[font-family:var(--f-title)] text-[11px] italic text-text-hi mt-[2px]">
          {badge.name}
        </div>
      )}
      {!mini && (
        <div className="[font-family:var(--f-mono)] text-[7px] tracking-[0.18em] text-text-lo uppercase">
          {badge.era}
        </div>
      )}
      {!mini && (
        <div
          className="[font-family:var(--f-mono)] text-[7px] tracking-[0.22em] uppercase"
          style={{ color: tileColor }}
        >
          {badge.rarity}
        </div>
      )}
    </div>
  );
}

interface HeroCardProps {
  form: ProfileFormData;
}

export function HeroCard({ form }: HeroCardProps) {
  const accent = findAccent(form.accent);
  const cls = findClass(form.classId);
  const companion = findCompanion(form.companionId);
  const rank = findRank(DEFAULT_PLAYER_STATS.level);
  const player = DEFAULT_PLAYER_STATS;

  const showcase = form.badges.map(findBadge).filter(Boolean).slice(0, 4) as NonNullable<
    ReturnType<typeof findBadge>
  >[];
  const xpPct = (player.xp / player.xpToNext) * 100;

  const statsKeys: { key: keyof HeroStats; label: string }[] = [
    { key: 'discipline', label: 'Discipline' },
    { key: 'wisdom', label: 'Wisdom' },
    { key: 'endurance', label: 'Endurance' },
    { key: 'composition', label: 'Composition' },
    { key: 'serenity', label: 'Serenity' },
  ];

  const cardCls = cn(
    'relative flex flex-col gap-4 flex-1 min-h-0',
    'border border-border rounded-md p-s5 overflow-y-auto',
    'scrollbar-thin',
  );

  return (
    <div
      className={cardCls}
      style={{
        background: 'linear-gradient(180deg, oklch(15% 0.04 270/0.95), oklch(11% 0.025 270/0.95))',
        boxShadow: `0 0 0 1px ${accent.glow}66, 0 0 30px ${accent.glow}20`,
        ['--accent' as string]: accent.glow,
      }}
    >
      {/* aura */}
      <div
        className="absolute inset-0 rounded-md pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${accent.glow}1a, transparent 50%)`,
        }}
      />

      {/* head */}
      <div className="flex justify-between items-start gap-3 relative">
        <div className="min-w-0">
          <div
            className="[font-family:var(--f-mono)] text-[9px] tracking-[0.28em] uppercase"
            style={{ color: accent.glow }}
          >
            RANK · {rank.name.toUpperCase()}
          </div>
          <h2 className="[font-family:var(--f-title)] italic font-medium text-[26px] leading-[1.1] mt-1 text-text-hi truncate">
            {form.heroName || 'Unnamed Hero'}
          </h2>
          <div className="[font-family:var(--f-title)] italic text-[13px] text-text-md truncate">
            {form.title || 'Untitled'}
          </div>
          <div className="flex flex-wrap gap-[5px] [font-family:var(--f-mono)] text-[8px] tracking-[0.14em] uppercase text-text-lo mt-1">
            {form.pronouns && <span>{form.pronouns}</span>}
            {form.pronouns && form.handle && <span>·</span>}
            {form.handle && <span>{form.handle}</span>}
            {form.handle && form.region && <span>·</span>}
            {form.region && <span>{form.region}</span>}
          </div>
        </div>
        <HeroSigil glyph={form.sigil} accent={accent} size={88} />
      </div>

      {/* motto */}
      <div
        className="[font-family:var(--f-title)] italic text-[13px] text-text-md leading-relaxed px-4 py-3 relative"
        style={{
          background: 'oklch(18% 0.03 270/0.6)',
          borderLeft: `2px solid ${accent.glow}`,
          borderRadius: '0 3px 3px 0',
        }}
      >
        <span
          className="text-[18px] leading-none align-[-6px] mr-1"
          style={{ color: accent.glow, fontFamily: 'var(--f-title)' }}
        >
          &ldquo;
        </span>
        {form.motto || 'A hero without a motto is a candle without a wick.'}
        <span
          className="text-[18px] leading-none align-[-6px] ml-1"
          style={{ color: accent.glow, fontFamily: 'var(--f-title)' }}
        >
          &rdquo;
        </span>
      </div>

      {/* grid stats */}
      <div
        className="grid grid-cols-2 border border-border-lo"
        style={{ background: 'var(--border-lo)', gap: '1px' }}
      >
        {[
          { label: 'LEVEL', value: player.level, sub: null },
          { label: 'STREAK', value: `${player.streak}d`, sub: 'unbroken' },
          { label: 'LUMEN', value: player.lumen, sub: '✦ currency' },
          { label: 'QUESTS', value: player.completed, sub: `${player.legendary} legendary` },
        ].map(({ label, value, sub }, i) => (
          <div key={i} className="bg-bg-1 p-[10px]">
            <div className="[font-family:var(--f-mono)] text-[8px] tracking-[0.2em] uppercase text-text-lo">
              {label}
            </div>
            {label === 'LEVEL' ? (
              <>
                <div
                  className="[font-family:var(--f-title)] italic text-[22px] leading-none mt-1"
                  style={{ color: accent.glow }}
                >
                  {value}
                </div>
                <div className="mt-[6px]">
                  <div className="h-[3px] bg-bg-3">
                    <div
                      className="h-full"
                      style={{ width: `${xpPct}%`, background: accent.glow }}
                    />
                  </div>
                  <div className="[font-family:var(--f-mono)] text-[8px] text-text-lo mt-1 tracking-[0.1em]">
                    {player.xp.toLocaleString()} / {player.xpToNext.toLocaleString()}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  className="[font-family:var(--f-title)] italic text-[22px] leading-none mt-1"
                  style={{ color: accent.glow }}
                >
                  {value}
                </div>
                {sub && (
                  <div className="[font-family:var(--f-mono)] text-[8px] tracking-[0.14em] text-text-lo mt-1">
                    {sub}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* class */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline [font-family:var(--f-mono)] text-[8px] tracking-[0.24em] uppercase text-text-lo pb-[5px] border-b border-border-lo">
          <span>CLASS · {cls.name.toUpperCase()}</span>
          <span style={{ color: accent.glow }}>{cls.glyph}</span>
        </div>
        <div className="[font-family:var(--f-title)] italic text-[14px] text-text-hi">
          {cls.tagline}
        </div>
        <div className="[font-family:var(--f-title)] text-[11px] text-text-lo leading-relaxed">
          {cls.blurb}
        </div>
      </div>

      {/* companion */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline [font-family:var(--f-mono)] text-[8px] tracking-[0.24em] uppercase text-text-lo pb-[5px] border-b border-border-lo">
          <span>COMPANION</span>
          <span style={{ color: accent.glow }}>{companion.glyph}</span>
        </div>
        <div className="[font-family:var(--f-title)] italic text-[14px] text-text-hi">
          {companion.name}
        </div>
        <div className="[font-family:var(--f-title)] text-[11px] text-text-lo leading-relaxed">
          {companion.blurb}
        </div>
        <div
          className="[font-family:var(--f-mono)] text-[9px] tracking-[0.1em]"
          style={{ color: accent.glow }}
        >
          ⟡ {companion.bonus}
        </div>
      </div>

      {/* attributes */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline [font-family:var(--f-mono)] text-[8px] tracking-[0.24em] uppercase text-text-lo pb-[5px] border-b border-border-lo">
          <span>ATTRIBUTES</span>
          <span style={{ color: accent.glow }}>
            {Object.values(form.stats).reduce((a, b) => a + b, 0)} / {form.statPool}
          </span>
        </div>
        <div className="flex flex-col gap-[7px]">
          {statsKeys.map(({ key, label }) => (
            <StatBar key={key} label={label} value={form.stats[key]} color={accent.glow} />
          ))}
        </div>
      </div>

      {/* showcase */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline [font-family:var(--f-mono)] text-[8px] tracking-[0.24em] uppercase text-text-lo pb-[5px] border-b border-border-lo">
          <span>SHOWCASE</span>
          <span style={{ color: accent.glow }}>{showcase.length} / 4</span>
        </div>
        <div className="grid grid-cols-4 gap-[5px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <BadgeTile key={i} badge={showcase[i]} mini />
          ))}
        </div>
      </div>

      {/* footer */}
      <div className="flex justify-between gap-3 pt-3 border-t border-border-lo mt-auto">
        {[
          { label: 'JOINED', value: new Date().getFullYear().toString() },
          { label: 'SEASON', value: player.season.split(' · ')[0] ?? player.season },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="[font-family:var(--f-mono)] text-[8px] tracking-[0.2em] uppercase text-text-lo">
              {label}
            </div>
            <div className="[font-family:var(--f-title)] italic text-[12px] text-text-md mt-[2px]">
              {value}
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export { HeroSigil };
export type { HeroSigilProps };
