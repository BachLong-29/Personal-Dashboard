import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const embers = [
  { left: '8%', drift: '30px', duration: '14s', delay: '0s', color: '' },
  {
    left: '22%',
    drift: '-20px',
    duration: '17s',
    delay: '2s',
    color: 'var(--violet)',
    shadow: 'var(--violet), 0 0 12px var(--violet-glow)',
  },
  { left: '35%', drift: '40px', duration: '12s', delay: '5s', color: '' },
  { left: '48%', drift: '-30px', duration: '18s', delay: '1s', color: '' },
  {
    left: '62%',
    drift: '25px',
    duration: '15s',
    delay: '3s',
    color: 'var(--cyan)',
    shadow: 'var(--cyan), 0 0 12px var(--cyan-glow)',
  },
  { left: '75%', drift: '-40px', duration: '20s', delay: '4s', color: '' },
  { left: '90%', drift: '30px', duration: '16s', delay: '0.5s', color: '' },
] as const;

const ticks = [0, 45, 90, 135, 180, 225, 270, 315];

export function LandingHero() {
  const t = useTranslations('landing.hero');

  return (
    <section className="lp-hero">
      <div className="lp-embers">
        {embers.map((e, i) => (
          <div
            key={i}
            className="lp-ember"
            style={
              {
                left: e.left,
                '--drift': e.drift,
                animationDuration: e.duration,
                animationDelay: e.delay,
                ...(e.color ? { background: e.color, boxShadow: `0 0 6px ${e.shadow}` } : {}),
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="hero-left">
        <div className="lp-hero-tag reveal in">
          <span className="pulse" />
          <span>{t('tag')}</span>
        </div>

        <h1 className="reveal in">
          {t('headline1')}{' '}
          <span className="bg-[linear-gradient(135deg,oklch(0.92_0.08_82),var(--gold)_50%,oklch(0.55_0.18_82))] bg-clip-text text-transparent [filter:drop-shadow(0_0_24px_oklch(0.78_0.16_82_/_0.35))]">
            {t('headline2')}
          </span>
          <br />
          {t('headline3')}
          <br />
          {t('headline4')}{' '}
          <span className="bg-[linear-gradient(135deg,var(--violet),oklch(0.85_0.12_295))] bg-clip-text text-transparent">
            {t('headline5')}
          </span>
        </h1>

        <p className="lp-hero-sub reveal in">
          {t.rich('sub', { em: (chunks) => <em>{chunks}</em> })}
        </p>

        <div className="lp-hero-cta reveal in">
          <Link className="lp-btn-epic" href="/login">
            {t('ctaBegin')}
          </Link>
          <a className="lp-btn-ghost" href="#system">
            {t('ctaSeeHow')}
          </a>
        </div>

        <div className="lp-hero-trust reveal in">
          <div className="lp-trust-item">
            <div className="num">142k</div>
            <div className="label">{t('trustHeroes')}</div>
          </div>
          <div className="lp-trust-item">
            <div className="num">3.4M</div>
            <div className="label">{t('trustQuests')}</div>
          </div>
          <div className="lp-trust-item">
            <div className="num">94%</div>
            <div className="label">{t('trustRetention')}</div>
          </div>
        </div>
      </div>

      <div className="lp-hero-art">
        <div className="lp-hero-disc" />
        <div className="lp-hero-sigil">
          <div className="lp-sigil-ring r1">
            {ticks.map((deg) => (
              <div key={deg} className="lp-sigil-tick" style={{ transform: `rotate(${deg}deg)` }} />
            ))}
          </div>
          <div className="lp-sigil-ring r2" />
          <div className="lp-sigil-ring r3" />
          <div className="lp-sigil-ring r4" />
          <div className="lp-sigil-core">A</div>
        </div>

        <div className="lp-float-card fc1">
          <div className="lp-fc-label">
            <span className="dot" />
            {t('cardLevelUp')}
          </div>
          <div className="lp-fc-row">
            <div
              className="lp-fc-icon"
              style={{
                background: 'linear-gradient(135deg, var(--gold-2), var(--gold))',
                color: '#0a0400',
              }}
            >
              ★
            </div>
            <div>
              <div className="lp-fc-main">Lv. 24 → 25</div>
              <div className="lp-fc-sub">{t('cardLevelSub')}</div>
            </div>
          </div>
          <div className="lp-fc-bar">
            <div style={{ width: '84%' }} />
          </div>
        </div>

        <div className="lp-float-card fc2">
          <div className="lp-fc-label" style={{ color: 'var(--violet)' }}>
            <span className="dot" style={{ background: 'var(--violet)' }} />
            {t('cardQuestComplete')}
          </div>
          <div className="lp-fc-row">
            <div
              className="lp-fc-icon"
              style={{
                background: 'oklch(0.68 0.22 295 / 0.18)',
                borderColor: 'oklch(0.68 0.22 295 / 0.4)',
                color: 'var(--violet)',
              }}
            >
              ✓
            </div>
            <div>
              <div className="lp-fc-main">{t('cardQuestName')}</div>
              <div className="lp-fc-sub">{t('cardStreakPreserved')}</div>
            </div>
          </div>
          <div className="lp-fc-stats">
            <div className="lp-fc-stat">
              XP <strong>+120</strong>
            </div>
            <div className="lp-fc-stat">
              🪙 <strong>+24</strong>
            </div>
          </div>
        </div>

        <div className="lp-float-card fc3">
          <div className="lp-fc-label" style={{ color: 'var(--mint)' }}>
            <span className="dot" style={{ background: 'var(--mint)' }} />
            {t('cardStreakActive')}
          </div>
          <div className="lp-fc-row">
            <div
              className="lp-fc-icon"
              style={{
                background: 'oklch(0.76 0.14 162 / 0.18)',
                borderColor: 'oklch(0.76 0.14 162 / 0.4)',
                color: 'var(--mint)',
              }}
            >
              🔥
            </div>
            <div>
              <div className="lp-fc-main">{t('cardStreakDays')}</div>
              <div className="lp-fc-sub">{t('cardStreakMultiplier')}</div>
            </div>
          </div>
        </div>

        <div className="lp-float-card fc4">
          <div className="lp-fc-label" style={{ color: 'var(--cyan)' }}>
            <span className="dot" style={{ background: 'var(--cyan)' }} />
            {t('cardAchievement')}
          </div>
          <div className="lp-fc-row">
            <div
              className="lp-fc-icon"
              style={{
                background: 'oklch(0.78 0.16 205 / 0.18)',
                borderColor: 'oklch(0.78 0.16 205 / 0.4)',
                color: 'var(--cyan)',
              }}
            >
              🏆
            </div>
            <div>
              <div className="lp-fc-main">{t('cardAchievementName')}</div>
              <div className="lp-fc-sub">{t('cardAchievementSub')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
