import { useTranslations } from 'next-intl';

const metricKeys = [
  { k: 'streakDepth',       count: '27',  unit: 'd',   cls: '',         sbKey: 'streakDepthSb' },
  { k: 'questVelocity',     count: '41',  unit: '/wk', cls: 'v-violet', sbKey: 'questVelocitySb' },
  { k: 'habitConsistency',  count: '94',  unit: '%',   cls: 'v-mint',   sbKey: 'habitConsistencySb' },
  { k: 'recoveryTime',      count: '1.2', unit: 'd',   cls: 'v-cyan',   sbKey: 'recoveryTimeSb' },
] as const;

export function MetricsSection() {
  const t = useTranslations('landing.metrics');

  return (
    <section className="lp-scene" id="metrics">
      <div className="lp-chapter reveal">{t('chapter')}</div>
      <h2 className="lp-title reveal">{t('headline')}</h2>
      <p className="lp-lead reveal">
        {t.rich('lead', { em: (chunks) => <em>{chunks}</em> })}
      </p>

      <div className="lp-metric-hero">
        <div className="lp-giant-stat reveal">
          <div className="glow" />
          <div className="lbl">{t('focusedTimeLabel')}</div>
          <div className="num">
            <span data-count="148">148</span>
            <span className="unit">h</span>
          </div>
          <div className="delta">{t('focusedDelta')}</div>
          <p className="desc">{t('focusedDesc')}</p>
        </div>

        <div className="lp-chart-card reveal delay-1">
          <div className="lp-chart-head">
            <div>
              <div className="lbl">{t('last12Weeks')}</div>
              <h3>{t('xpCurve')}</h3>
            </div>
            <div className="lp-chart-legend">
              <span><i style={{ background: 'var(--gold)' }} />{t('xpLabel')}</span>
              <span><i style={{ background: 'var(--violet)' }} />{t('streakLabel')}</span>
            </div>
          </div>
          <svg viewBox="0 0 600 200" preserveAspectRatio="none" style={{ width: '100%', height: 200 }}>
            <defs>
              <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="oklch(0.78 0.16 82 / 0.4)" />
                <stop offset="1" stopColor="oklch(0.78 0.16 82 / 0)" />
              </linearGradient>
              <linearGradient id="stFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="oklch(0.68 0.22 295 / 0.3)" />
                <stop offset="1" stopColor="oklch(0.68 0.22 295 / 0)" />
              </linearGradient>
            </defs>
            <g stroke="oklch(1 0 0 / 0.04)" strokeDasharray="2 4">
              <line x1="0" y1="40" x2="600" y2="40" />
              <line x1="0" y1="80" x2="600" y2="80" />
              <line x1="0" y1="120" x2="600" y2="120" />
              <line x1="0" y1="160" x2="600" y2="160" />
            </g>
            <path d="M 0 180 L 50 170 L 100 160 L 150 165 L 200 145 L 250 130 L 300 120 L 350 105 L 400 90 L 450 75 L 500 60 L 550 45 L 600 35 L 600 200 L 0 200 Z" fill="url(#stFill)" />
            <path d="M 0 180 L 50 170 L 100 160 L 150 165 L 200 145 L 250 130 L 300 120 L 350 105 L 400 90 L 450 75 L 500 60 L 550 45 L 600 35" fill="none" stroke="var(--violet)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
            <path d="M 0 175 L 50 168 L 100 150 L 150 152 L 200 128 L 250 105 L 300 100 L 350 76 L 400 64 L 450 50 L 500 38 L 550 28 L 600 18 L 600 200 L 0 200 Z" fill="url(#xpFill)" />
            <path d="M 0 175 L 50 168 L 100 150 L 150 152 L 200 128 L 250 105 L 300 100 L 350 76 L 400 64 L 450 50 L 500 38 L 550 28 L 600 18" fill="none" stroke="var(--gold)" strokeWidth="2" filter="drop-shadow(0 0 6px var(--gold-glow))" />
            <g fill="var(--gold)">
              <circle cx="0" cy="175" r="2.5" /><circle cx="100" cy="150" r="2.5" />
              <circle cx="200" cy="128" r="2.5" /><circle cx="300" cy="100" r="2.5" />
              <circle cx="400" cy="64" r="2.5" /><circle cx="500" cy="38" r="2.5" />
              <circle cx="600" cy="18" r="3.5" stroke="var(--bg-1)" strokeWidth="2" />
            </g>
            <line x1="0" y1="50" x2="600" y2="50" stroke="oklch(0.76 0.14 162 / 0.5)" strokeDasharray="4 4" strokeWidth="1" />
            <text x="595" y="44" textAnchor="end" fontFamily="JetBrains Mono" fontSize="9" fill="var(--mint)" letterSpacing="0.15em">{t('goalLabel')}</text>
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'var(--text-lo)', textTransform: 'uppercase' }}>
            {['W1','W3','W5','W7','W9','W11','NOW'].map((w) => <span key={w}>{w}</span>)}
          </div>
        </div>
      </div>

      <div className="lp-metric-strip">
        {metricKeys.map((m, i) => (
          <div key={m.k} className={`lp-metric-mini reveal${i > 0 ? ` delay-${i}` : ''}`}>
            <div className="k">{t(m.k)}</div>
            <div className={`v${m.cls ? ` ${m.cls}` : ''}`}>
              <span data-count={m.count}>{m.count}</span>
              <span style={{ fontSize: 18, WebkitTextFillColor: 'var(--text-lo)', color: 'var(--text-lo)' }}>{m.unit}</span>
            </div>
            <div className="sb">{t(m.sbKey)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
