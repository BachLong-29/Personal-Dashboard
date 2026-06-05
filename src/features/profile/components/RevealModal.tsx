'use client';

import { useState, useEffect, startTransition } from 'react';
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
import { HeroSigil } from './HeroCard';

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400, run = true) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) {
      startTransition(() => setV(0));
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return v;
}

// ─── Floating particles ────────────────────────────────────────────────────────
interface ParticlesDef {
  x: number;
  y: number;
  d: number;
  del: number;
  s: number;
}

function Particles({ count = 60, accent }: { count?: number; accent: string }) {
  const [parts] = useState<ParticlesDef[]>(() =>
    Array.from({ length: count }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      d: 4 + Math.random() * 10,
      del: -Math.random() * 8,
      s: 2 + Math.random() * 3,
    })),
  );

  return (
    <div className="absolute inset-0 z-[2] pointer-events-none">
      {parts.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: `${p.y}%`,
            width: `${p.s}px`,
            height: `${p.s}px`,
            background: accent,
            boxShadow: `0 0 8px ${accent}`,
            opacity: 0,
            animationName: 'rev-particle-rise',
            animationDelay: `${p.del}s`,
            animationDuration: `${p.d}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        />
      ))}
    </div>
  );
}

// ─── Seal overlay ──────────────────────────────────────────────────────────────
function SealOverlay({ accent, sealed }: { accent: HeroAccent; sealed: boolean }) {
  return (
    <div
      className={cn('fixed inset-0 z-[200] grid place-items-center', sealed ? 'seal-bloomed' : '')}
      style={{ animation: 'seal-enter 240ms ease-out both' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50%, oklch(8% 0.025 270/0.7), oklch(5% 0.02 270/0.95))',
          backdropFilter: 'blur(2px)',
        }}
      />
      <svg className="relative w-[440px] h-[440px]" viewBox="-200 -200 400 400">
        <defs>
          <radialGradient id="seal-core-g" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent.glow} stopOpacity="0.9" />
            <stop offset="50%" stopColor={accent.glow} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accent.glow} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g
          style={{
            animation: 'seal-burst 1100ms cubic-bezier(.16,1,.3,1) 0.1s forwards',
            opacity: 0,
            transformOrigin: 'center',
          }}
        >
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * 360;
            return (
              <line
                key={i}
                transform={`rotate(${a})`}
                x1="0"
                y1="-30"
                x2="0"
                y2="-190"
                stroke={accent.glow}
                strokeWidth="1.5"
                opacity="0.9"
              />
            );
          })}
        </g>
        <circle
          r="170"
          fill="none"
          stroke={accent.glow}
          strokeWidth="0.8"
          style={{
            strokeDasharray: 1200,
            strokeDashoffset: 1200,
            animation: 'seal-ring-draw 1100ms cubic-bezier(.16,1,.3,1) 0.2s forwards',
            filter: `drop-shadow(0 0 8px ${accent.glow})`,
          }}
        />
        <circle
          r="140"
          fill="none"
          stroke={accent.glow}
          strokeWidth="1.2"
          strokeDasharray="3 8"
          style={{
            strokeDasharray: 1200,
            strokeDashoffset: 1200,
            animation: 'seal-ring-draw 1100ms cubic-bezier(.16,1,.3,1) 0.5s forwards',
          }}
        />
        <circle
          r="105"
          fill="none"
          stroke={accent.glow}
          strokeWidth="0.8"
          style={{
            strokeDasharray: 1200,
            strokeDashoffset: 1200,
            animation: 'seal-ring-draw 1100ms cubic-bezier(.16,1,.3,1) 0.8s forwards',
          }}
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * 360;
          return (
            <g
              key={i}
              style={{
                opacity: 0,
                animation: `seal-rune-in 800ms cubic-bezier(.16,1,.3,1) ${1 + i * 0.04}s forwards`,
                transformOrigin: 'center',
              }}
            >
              <g transform={`rotate(${a}) translate(0 -160)`}>
                <text
                  textAnchor="middle"
                  fontFamily="Cinzel, serif"
                  fontSize="18"
                  fill={accent.glow}
                >
                  {['✦', '◈', '❀', '☽', '✺', '❖'][i % 6]}
                </text>
              </g>
            </g>
          );
        })}
        <circle
          r="85"
          fill="url(#seal-core-g)"
          style={{
            opacity: 0,
            animation: 'seal-core-pulse 1400ms cubic-bezier(.16,1,.3,1) 0.6s forwards',
          }}
        />
        <circle
          r="60"
          fill="oklch(14% 0.03 270)"
          stroke={accent.glow}
          strokeWidth="1.5"
          style={{
            opacity: 0,
            animation: 'seal-core-disc-in 700ms cubic-bezier(.16,1,.3,1) 0.8s forwards',
            transformOrigin: 'center',
          }}
        />
        <g
          style={{
            opacity: 0,
            animation: 'seal-check-in 700ms cubic-bezier(.16,1,.3,1) 1.2s forwards',
            transformOrigin: 'center',
          }}
        >
          <text
            y="22"
            textAnchor="middle"
            fontFamily="Cinzel, serif"
            fontSize="64"
            fill={accent.glow}
          >
            ✦
          </text>
        </g>
      </svg>
      <div
        className="absolute bottom-[16%] text-center"
        style={{ opacity: 0, animation: 'text-enter 700ms 1.4s both' }}
      >
        <div
          className="[font-family:var(--f-mono)] text-[11px] tracking-[0.4em] uppercase"
          style={{ color: accent.glow }}
        >
          {sealed ? 'IDENTITY SEALED' : 'SEALING'}
        </div>
        <div className="[font-family:var(--f-title)] italic text-[30px] mt-2">
          {sealed ? 'Your chapter has begun.' : 'Bind the new self.'}
        </div>
      </div>
    </div>
  );
}

// ─── Reveal stat bar ───────────────────────────────────────────────────────────
function RevealStat({
  label,
  value,
  cap,
  accentColor,
}: {
  label: string;
  value: number;
  cap: number;
  accentColor: string;
}) {
  const pct = (value / cap) * 100;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between [font-family:var(--f-mono)] text-[10px] tracking-[0.12em] uppercase text-text-lo">
        <span>{label}</span>
        <span
          className="[font-family:var(--f-title)] italic text-[14px] normal-case"
          style={{ color: accentColor }}
        >
          {value}
        </span>
      </div>
      <div className="h-[4px] rounded-sm bg-bg-3 mt-[5px] overflow-hidden">
        <div
          className="h-full rounded-sm transition-[width_50ms_linear]"
          style={{
            width: `${pct}%`,
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Prog cell ─────────────────────────────────────────────────────────────────
function ProgCell({
  big,
  eyebrow,
  sub,
  accentColor,
}: {
  big: string | number;
  eyebrow: string;
  sub: string;
  accentColor: string;
}) {
  return (
    <div
      className="relative px-4 py-4 border border-border rounded-xs"
      style={{ background: 'oklch(16% 0.03 270/0.65)' }}
    >
      <div
        className="absolute -top-px left-2 right-2 h-px opacity-50"
        style={{ background: accentColor }}
      />
      <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.24em] uppercase text-text-lo">
        {eyebrow}
      </div>
      <div
        className="[font-family:var(--f-title)] italic text-[32px] leading-none my-[5px]"
        style={{ color: accentColor }}
      >
        {big}
      </div>
      <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.14em] text-text-lo">
        {sub}
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
type Phase = 'entering' | 'revealed' | 'sealing' | 'sealed';

interface RevealModalProps {
  form: ProfileFormData;
  onClose: () => void;
  onConfirm: () => void;
}

export function RevealModal({ form, onClose, onConfirm }: RevealModalProps) {
  const [phase, setPhase] = useState<Phase>('entering');
  const accent = findAccent(form.accent);
  const cls = findClass(form.classId);
  const companion = findCompanion(form.companionId);
  const rank = findRank(DEFAULT_PLAYER_STATS.level);
  const player = DEFAULT_PLAYER_STATS;

  useEffect(() => {
    const t = setTimeout(() => setPhase('revealed'), 1200);
    return () => clearTimeout(t);
  }, []);

  const running = phase === 'revealed' || phase === 'sealing' || phase === 'sealed';
  const xpAnim = useCountUp(player.xp, 1400, running);
  const streakAnim = useCountUp(player.streak, 1000, running);
  const lumenAnim = useCountUp(player.lumen, 1200, running);
  const questsAnim = useCountUp(player.completed, 1600, running);

  const statKeys: { key: keyof HeroStats; label: string }[] = [
    { key: 'discipline', label: 'Discipline' },
    { key: 'wisdom', label: 'Wisdom' },
    { key: 'endurance', label: 'Endurance' },
    { key: 'composition', label: 'Composition' },
    { key: 'serenity', label: 'Serenity' },
  ];

  const handleSeal = () => {
    setPhase('sealing');
    setTimeout(() => {
      setPhase('sealed');
      setTimeout(() => onConfirm(), 1400);
    }, 1700);
  };

  const showcase = form.badges.map(findBadge).filter(Boolean).slice(0, 4) as NonNullable<
    ReturnType<typeof findBadge>
  >[];

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-auto"
      style={{ animation: 'fade-in 600ms ease forwards' }}
    >
      {/* backdrop layers */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, oklch(15% 0.04 270/0.85), oklch(6% 0.02 270/0.98))',
        }}
      />
      <div
        className="absolute inset-[-10%] z-[1] opacity-[0.18]"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${accent.glow}, transparent 50%), radial-gradient(circle at 70% 80%, ${accent.fill}, transparent 60%)`,
          filter: 'blur(80px)',
          animation: 'aurora-drift 18s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute inset-0 z-[1] opacity-[0.04]"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${accent.glow} 5deg, transparent 30deg, transparent 90deg, ${accent.glow} 95deg, transparent 120deg, transparent 180deg, ${accent.glow} 185deg, transparent 210deg, transparent 270deg, ${accent.glow} 275deg, transparent 300deg)`,
          animation: 'rays-spin 60s linear infinite',
        }}
      />
      <Particles count={70} accent={accent.glow} />

      {(phase === 'sealing' || phase === 'sealed') && (
        <SealOverlay accent={accent} sealed={phase === 'sealed'} />
      )}

      <button
        className="fixed top-6 right-8 z-[12] w-9 h-9 grid place-items-center border border-border rounded-xs text-text-md text-[18px] cursor-pointer transition-all hover:text-text-hi hover:border-text-md disabled:opacity-40"
        style={{ background: 'oklch(15% 0.03 270/0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
        disabled={phase === 'sealing'}
        aria-label="Close"
      >
        ×
      </button>

      {/* stage */}
      <div
        className={cn(
          'relative z-[3] w-full px-4 sm:px-8 md:px-14 py-6 sm:py-8 md:py-12',
          `phase-${phase}`,
        )}
        style={{ maxWidth: 1080, animation: 'stage-enter 1000ms cubic-bezier(.16,1,.3,1) both' }}
      >
        {/* title bar */}
        <div className="flex flex-wrap justify-between gap-1 [font-family:var(--f-mono)] text-[9px] tracking-[0.32em] uppercase text-text-lo mb-6 sm:mb-8 pb-3 border-b border-border-lo">
          <span>CHAPTER OPENING · {player.season.toUpperCase()}</span>
          <span style={{ color: accent.glow }}>RANK · {rank.name.toUpperCase()}</span>
        </div>

        {/* hero entrance */}
        <div
          className="flex flex-col items-center text-center gap-6 mb-8 sm:grid sm:text-left sm:gap-9 sm:mb-10"
          style={{ gridTemplateColumns: 'auto 1fr', alignItems: 'center' }}
        >
          <div style={{ animation: 'sigil-enter 1200ms cubic-bezier(.16,1,.3,1) both' }}>
            <div className="sm:hidden">
              <HeroSigil glyph={form.sigil} accent={accent} size={120} />
            </div>
            <div className="hidden sm:block">
              <HeroSigil glyph={form.sigil} accent={accent} size={220} />
            </div>
          </div>
          <div>
            <div
              className="[font-family:var(--f-mono)] text-[10px] tracking-[0.36em] uppercase text-text-lo mb-2"
              style={{ animation: 'text-enter 1000ms cubic-bezier(.16,1,.3,1) 0.2s both' }}
            >
              YOU ARE
            </div>
            <h1
              className="[font-family:var(--f-title)] italic font-medium leading-none m-0 letter-spacing-[-0.02em]"
              style={{
                fontSize: 'clamp(40px,7vw,84px)',
                animation: 'text-enter 1000ms cubic-bezier(.16,1,.3,1) 0.2s both',
              }}
            >
              {form.heroName || 'Unnamed Hero'}
            </h1>
            <div
              className="[font-family:var(--f-title)] italic text-[20px] mt-[10px]"
              style={{
                color: accent.glow,
                animation: 'text-enter 1000ms cubic-bezier(.16,1,.3,1) 0.35s both',
              }}
            >
              {form.title}
            </div>
            <div
              className="[font-family:var(--f-title)] italic text-[16px] text-text-md mt-3 max-w-[540px] leading-relaxed"
              style={{ animation: 'text-enter 1000ms cubic-bezier(.16,1,.3,1) 0.5s both' }}
            >
              <span
                className="text-[20px] leading-none align-[-6px] mr-1"
                style={{ color: accent.glow }}
              >
                &ldquo;
              </span>
              {form.motto || 'A hero without a motto is a candle without a wick.'}
              <span
                className="text-[20px] leading-none align-[-6px] ml-1"
                style={{ color: accent.glow }}
              >
                &rdquo;
              </span>
            </div>
            <div
              className="flex flex-wrap gap-[10px] [font-family:var(--f-mono)] text-[10px] tracking-[0.18em] uppercase text-text-lo mt-4"
              style={{ animation: 'text-enter 1000ms cubic-bezier(.16,1,.3,1) 0.65s both' }}
            >
              {form.pronouns && <span>{form.pronouns}</span>}
              {form.pronouns && form.handle && <span>·</span>}
              {form.handle && <span>{form.handle}</span>}
              {form.handle && form.region && <span>·</span>}
              {form.region && <span>{form.region}</span>}
            </div>
          </div>
        </div>

        {/* middle grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr] gap-4 mb-6">
          {[
            {
              eyebrow: 'CLASS',
              name: `${cls.glyph} ${cls.name}`,
              tag: cls.tagline,
              blurb: cls.blurb,
              delay: 0.8,
            },
            {
              eyebrow: 'COMPANION',
              name: `${companion.glyph} ${companion.name}`,
              tag: companion.bonus,
              blurb: companion.blurb,
              delay: 0.9,
            },
          ].map(({ eyebrow, name, tag, blurb, delay }) => (
            <div
              key={eyebrow}
              className="relative border border-border rounded-xs p-5"
              style={{
                background: 'oklch(16% 0.03 270/0.65)',
                animation: `text-enter 800ms ease-out ${delay}s both`,
              }}
            >
              <div
                className="absolute -top-px left-4 right-4 h-px opacity-70"
                style={{ background: accent.glow }}
              />
              <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.26em] uppercase text-text-lo mb-3">
                {eyebrow}
              </div>
              <div
                className="[font-family:var(--f-title)] italic text-[22px] text-text-hi"
                style={{ color: 'inherit' }}
              >
                {name}
              </div>
              <div
                className="[font-family:var(--f-mono)] text-[9px] tracking-[0.18em] uppercase mt-[5px]"
                style={{ color: accent.glow }}
              >
                {tag}
              </div>
              <div className="[font-family:var(--f-title)] text-[13px] text-text-md leading-relaxed mt-3">
                {blurb}
              </div>
            </div>
          ))}
          <div
            className="relative border border-border rounded-xs p-5"
            style={{
              background: 'oklch(16% 0.03 270/0.65)',
              animation: 'text-enter 800ms ease-out 1.0s both',
            }}
          >
            <div
              className="absolute -top-px left-4 right-4 h-px opacity-70"
              style={{ background: accent.glow }}
            />
            <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.26em] uppercase text-text-lo mb-3">
              ATTRIBUTES
            </div>
            {statKeys.map(({ key, label }) => (
              <RevealStat
                key={key}
                label={label}
                value={form.stats[key] * 10}
                cap={100}
                accentColor={accent.glow}
              />
            ))}
          </div>
        </div>

        {/* progress row */}
        <div
          className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-7"
          style={{ animation: 'text-enter 800ms ease-out 1.1s both' }}
        >
          <ProgCell
            big={player.level}
            eyebrow="LEVEL"
            sub="current rank"
            accentColor={accent.glow}
          />
          <ProgCell
            big={xpAnim.toLocaleString()}
            eyebrow="XP"
            sub={`/ ${player.xpToNext.toLocaleString()} next`}
            accentColor={accent.glow}
          />
          <ProgCell
            big={`${streakAnim}d`}
            eyebrow="STREAK"
            sub="unbroken"
            accentColor={accent.glow}
          />
          <ProgCell big={lumenAnim} eyebrow="LUMEN" sub="✦ currency" accentColor={accent.glow} />
          <ProgCell
            big={questsAnim}
            eyebrow="QUESTS"
            sub={`${player.legendary} legendary`}
            accentColor={accent.glow}
          />
        </div>

        {/* showcase */}
        {showcase.length > 0 && (
          <div className="mb-6">
            <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.26em] uppercase text-text-lo mb-3">
              WORN BADGES
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {showcase.map((b, i) => {
                const ba = findAccent(b.color);
                return (
                  <div
                    key={b.id}
                    className="flex flex-col items-center text-center border border-border rounded-xs p-4 min-h-[130px] justify-center gap-[3px]"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${ba.glow}20, oklch(16% 0.03 270/0.65))`,
                      animation: `badge-float-in 800ms cubic-bezier(.16,1,.3,1) ${i * 0.18 + 0.6}s both`,
                    }}
                  >
                    <div
                      className="[font-family:var(--f-title)] italic text-[36px]"
                      style={{ color: ba.glow }}
                    >
                      {b.glyph}
                    </div>
                    <div className="[font-family:var(--f-title)] italic text-[14px] text-text-hi">
                      {b.name}
                    </div>
                    <div className="[font-family:var(--f-mono)] text-[7px] tracking-[0.18em] text-text-lo uppercase">
                      {b.era}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-border-lo">
          <button
            className="px-7 py-[13px] [font-family:var(--f-body)] text-[12px] tracking-[0.06em] font-medium rounded-xs bg-transparent border border-border text-text-md cursor-pointer transition-all hover:text-text-hi hover:border-text-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={phase === 'sealing'}
            type="button"
          >
            Back to forge
          </button>
          <button
            className="flex items-center gap-[10px] px-7 py-[13px] [font-family:var(--f-body)] text-[12px] tracking-[0.06em] font-bold rounded-xs cursor-pointer transition-all hover:brightness-110 hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(180deg, ${accent.glow}, ${accent.fill})`,
              border: `1px solid ${accent.glow}`,
              color: 'oklch(12% 0.03 270)',
              boxShadow: `0 0 30px ${accent.glow}66`,
            }}
            onClick={handleSeal}
            disabled={phase !== 'revealed'}
            type="button"
          >
            <span className="[font-family:var(--f-title)] italic text-[16px]">✦</span>
            Seal this identity
          </button>
        </div>
      </div>

      {/* animation keyframes */}
      <style>{`
        @keyframes fade-in          { from { opacity:0 } to { opacity:1 } }
        @keyframes aurora-drift     { to   { transform: translate(40px,-30px) scale(1.05); opacity:.25 } }
        @keyframes rays-spin        { to   { transform: rotate(360deg) } }
        @keyframes stage-enter      { from { opacity:0; transform: translateY(40px) scale(.97) } to { opacity:1; transform:none } }
        @keyframes sigil-enter      { from { transform: scale(.6) rotate(-20deg); opacity:0; filter:blur(8px) } to { transform:none; opacity:1; filter:none } }
        @keyframes text-enter       { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        @keyframes badge-float-in   { from { opacity:0; transform:translateY(28px) scale(.9); filter:blur(4px) } to { opacity:1; transform:none; filter:none } }
        @keyframes rev-particle-rise{ 0%{transform:translateY(0);opacity:0} 10%{opacity:.7} 90%{opacity:.4} 100%{transform:translateY(-50vh);opacity:0} }
        @keyframes seal-enter       { from { opacity:0 } to { opacity:1 } }
        @keyframes seal-burst       { 0%{opacity:0;transform:scale(.2)} 60%{opacity:1} 100%{opacity:.6;transform:scale(1)} }
        @keyframes seal-ring-draw   { to   { stroke-dashoffset:0 } }
        @keyframes seal-rune-in     { from { opacity:0;transform:scale(.4) translateY(-8px) } to { opacity:1;transform:none } }
        @keyframes seal-core-pulse  { 0%{opacity:0;transform:scale(.5)} 50%{opacity:1;transform:scale(1.15)} 100%{opacity:.9;transform:scale(1)} }
        @keyframes seal-core-disc-in{ from { opacity:0;transform:scale(.3) } to { opacity:1;transform:scale(1) } }
        @keyframes seal-check-in    { from { opacity:0;transform:scale(.3) rotate(-25deg) } to { opacity:1;transform:none } }
      `}</style>
    </div>
  );
}

// ─── Success toast ─────────────────────────────────────────────────────────────
interface SuccessToastProps {
  accentGlow: string;
  onDismiss: () => void;
}

export function SuccessToast({ accentGlow, onDismiss }: SuccessToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3800);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed right-4 sm:right-8 bottom-20 sm:bottom-8 left-4 sm:left-auto z-[250] grid items-center gap-4 px-5 py-[18px] border rounded-md sm:max-w-[360px]"
      style={{
        gridTemplateColumns: 'auto 1fr auto',
        background: 'oklch(16% 0.04 270/0.95)',
        border: `1px solid ${accentGlow}`,
        boxShadow: `0 24px 60px oklch(5% 0.02 270/0.7), 0 0 36px ${accentGlow}4d`,
        backdropFilter: 'blur(12px)',
        animation: 'toast-in 600ms cubic-bezier(.16,1,.3,1)',
      }}
    >
      <div
        className="absolute inset-0 rounded-md pointer-events-none"
        style={{
          background: `radial-gradient(circle at 0% 50%, ${accentGlow}14, transparent 60%)`,
        }}
      />
      <div
        className="w-14 h-14 grid place-items-center rounded-full border flex-shrink-0 [font-family:var(--f-title)] italic text-[32px]"
        style={{ borderColor: accentGlow, color: accentGlow }}
      >
        ✦
      </div>
      <div>
        <div className="[font-family:var(--f-title)] italic text-[17px] text-text-hi">
          Identity sealed
        </div>
        <div className="[font-family:var(--f-title)] text-[12px] text-text-md mt-[2px]">
          Your hero has evolved.
        </div>
      </div>
      <button
        className="bg-transparent border-none text-text-lo text-[16px] cursor-pointer w-6 h-6 hover:text-text-hi transition-colors"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
      <style>{`@keyframes toast-in { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }`}</style>
    </div>
  );
}
