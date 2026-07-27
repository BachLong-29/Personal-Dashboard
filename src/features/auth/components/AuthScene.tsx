'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

interface Mote {
  id: number;
  x: number;
  bottom: number;
  size: number;
  drift: number;
  duration: number;
  delay: number;
  isGold: boolean;
}

function RunicGate() {
  const t = useTranslations('auth');
  const cx = 500;
  const cy = 500;

  const ticks = Array.from({ length: 72 }, (_, i) => {
    const angle = ((i * 360) / 72) * (Math.PI / 180);
    const isMajor = i % 6 === 0;
    const r1 = 468;
    const r2 = isMajor ? 454 : 460;
    return (
      <line
        key={i}
        className={`rg-tick${isMajor ? ' rg-tick-major' : ''}`}
        x1={cx + r2 * Math.cos(angle)}
        y1={cy + r2 * Math.sin(angle)}
        x2={cx + r1 * Math.cos(angle)}
        y2={cy + r1 * Math.sin(angle)}
      />
    );
  });

  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 30) * (Math.PI / 180);
    return `${cx + 180 * Math.cos(angle)},${cy + 180 * Math.sin(angle)}`;
  }).join(' ');

  const sigils = ['✦', '⊕', '◈', '⟡', '⊗', '◎'];

  return (
    <div className="runic-gate">
      <svg className="rg-outer" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="outerArc" d={`M ${cx - 448},${cy} A 448,448 0 1,1 ${cx + 447},${cy}`} />
          <path id="innerArc" d={`M ${cx - 318},${cy} A 318,318 0 1,1 ${cx + 317},${cy}`} />
        </defs>

        <circle className="rg-c rg-c1" cx={cx} cy={cy} r={466} />
        <circle className="rg-c rg-c2" cx={cx} cy={cy} r={440} />
        <circle className="rg-c rg-c3" cx={cx} cy={cy} r={400} />
        <circle className="rg-c rg-c4" cx={cx} cy={cy} r={360} />
        <circle className="rg-c" cx={cx} cy={cy} r={200} />

        {ticks}

        <polygon className="rg-hex" points={hexPoints} />

        <text className="rg-text-outer">
          <textPath href="#outerArc" startOffset="0%">
            {t('scene.outerRingText')}
          </textPath>
        </text>
        <text className="rg-text-inner">
          <textPath href="#innerArc" startOffset="25%">
            {t('scene.innerRingText')}
          </textPath>
        </text>

        {sigils.map((sigil, i) => {
          const angle = i * 60 * (Math.PI / 180);
          const r = 380;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          return (
            <g key={i}>
              <circle className="rg-sigil-bg" cx={x} cy={y} r={22} />
              <text className="rg-sigil" x={x} y={y}>
                {sigil}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function AuthScene() {
  const t = useTranslations('auth');
  const [stars, setStars] = useState<Star[]>([]);
  const [motes, setMotes] = useState<Mote[]>([]);

  // Random decorations are generated on the client only (after mount) so the server
  // and first client render match — no hydration mismatch. Deferring to an effect is
  // required here, so these setState calls intentionally live inside one.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setStars(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 70,
        size: Math.random() * 1.5 + 0.8,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 3,
      })),
    );
    setMotes(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        bottom: Math.random() * 30,
        size: Math.random() * 2.5 + 1.5,
        drift: (Math.random() - 0.5) * 60,
        duration: 8 + Math.random() * 12,
        delay: -(Math.random() * 20),
        isGold: Math.random() > 0.5,
      })),
    );
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="auth-scene">
      <div className="aurora a1" />
      <div className="aurora a2" />
      <div className="aurora a3" />

      <div className="auth-stars">
        {stars.map((star) => (
          <div
            key={star.id}
            className="auth-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="auth-particles">
        {motes.map((mote) => (
          <div
            key={mote.id}
            className={`auth-mote ${mote.isGold ? 'auth-mote--gold' : 'auth-mote--violet'}`}
            style={
              {
                left: `${mote.x}%`,
                bottom: `${mote.bottom}%`,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                '--drift': `${mote.drift}px`,
                animationDuration: `${mote.duration}s`,
                animationDelay: `${mote.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <RunicGate />

      <div className="auth-horizon" />

      <div className="auth-char-stage">
        <div className="auth-char-glow" />
        <div className="auth-char-silhouette">
          <svg viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="110" cy="40" rx="26" ry="30" fill="oklch(0.52 0.20 295 / 0.9)" />
            <path
              d="M74 34 Q82 2 110 6 Q138 2 146 34 Q136 20 110 20 Q84 20 74 34Z"
              fill="oklch(0.42 0.18 295)"
            />
            <path
              d="M84 74 L62 242 Q82 262 110 267 Q138 262 158 242 L136 74 Q122 87 110 88 Q98 87 84 74Z"
              fill="oklch(0.38 0.16 295 / 0.95)"
            />
            <rect x="92" y="74" width="36" height="58" rx="4" fill="oklch(0.44 0.18 295)" />
            <path
              d="M92 82 Q56 122 52 162 Q57 167 64 164 Q72 132 94 102Z"
              fill="oklch(0.38 0.16 295 / 0.9)"
            />
            <path
              d="M128 82 Q164 122 168 162 Q163 167 156 164 Q148 132 126 102Z"
              fill="oklch(0.38 0.16 295 / 0.9)"
            />
            <line
              x1="170"
              y1="62"
              x2="165"
              y2="282"
              stroke="oklch(0.65 0.15 82)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="172" cy="56" r="13" fill="oklch(0.68 0.22 295 / 0.8)" />
            <circle cx="172" cy="56" r="7" fill="oklch(0.82 0.18 295)" />
            <ellipse
              cx="172"
              cy="52"
              rx="4"
              ry="3"
              fill="oklch(1 0 0 / 0.3)"
              transform="rotate(-20 172 52)"
            />
            <rect x="90" y="126" width="40" height="7" rx="2" fill="oklch(0.60 0.16 82 / 0.7)" />
          </svg>
        </div>
      </div>

      <div className="world-mark">
        <div className="wm-brand-row">
          <div className="wm-brand">AETHERIA</div>
          <div className="wm-glyph">✦</div>
        </div>
        <div className="wm-subtitle">{t('scene.subtitle')}</div>
        <div className="wm-divider">
          <span />
          <span className="wm-dia" />
          <span />
        </div>
        <div className="wm-tagline">
          {t.rich('scene.heroTagline', {
            br: () => <br />,
          })}
        </div>
      </div>

      <div className="float-card fc-realm">
        <div className="fc-corner tl" />
        <div className="fc-corner tr" />
        <div className="fc-corner bl" />
        <div className="fc-corner br" />
        <div className="fc-tag">{t('scene.realmStatus')}</div>
        <div className="fc-row">
          <span className="fc-k">{t('scene.activeQuesters')}</span>
          <span className="fc-v fc-gold">1,247</span>
        </div>
        <div className="fc-row">
          <span className="fc-k">{t('scene.questsToday')}</span>
          <span className="fc-v">3,891</span>
        </div>
        <div className="fc-row">
          <span className="fc-k">{t('scene.server')}</span>
          <span className="fc-v fc-gold">{t('scene.online')}</span>
        </div>
      </div>

      <div className="float-card fc-creed">
        <div className="fc-corner tl" />
        <div className="fc-corner tr" />
        <div className="fc-corner bl" />
        <div className="fc-corner br" />
        <div className="fc-tag fc-violet">{t('scene.creedTitle')}</div>
        <div className="fc-creed-text">
          {t.rich('scene.creedText', {
            br: () => <br />,
          })}
        </div>
      </div>

      <div className="auth-companion">
        <div className="comp-bubble">
          <div className="comp-bubble-inner">{t('scene.companionPrompt')}</div>
        </div>
        <div className="comp-body">
          <div className="comp-aura" />
          <svg className="comp-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="44" r="28" fill="oklch(0.42 0.22 295 / 0.95)" />
            <circle cx="40" cy="44" r="24" fill="oklch(0.54 0.24 295)" />
            <ellipse cx="30" cy="34" rx="8" ry="5" fill="oklch(1 0 0 / 0.22)" />
            <circle cx="32" cy="43" r="5" fill="white" />
            <circle cx="48" cy="43" r="5" fill="white" />
            <circle cx="33" cy="44" r="3" fill="#08001a" />
            <circle cx="49" cy="44" r="3" fill="#08001a" />
            <circle cx="34" cy="43" r="1" fill="white" />
            <circle cx="50" cy="43" r="1" fill="white" />
            <path
              d="M34 52 Q40 57 46 52"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M12 44 Q6 36 12 30 Q18 36 14 44Z" fill="oklch(0.62 0.20 295 / 0.7)" />
            <path d="M68 44 Q74 36 68 30 Q62 36 66 44Z" fill="oklch(0.62 0.20 295 / 0.7)" />
          </svg>
        </div>
        <div className="comp-name">LUMIS</div>
      </div>
    </div>
  );
}
