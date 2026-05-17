import { useTranslations } from 'next-intl';

export function SystemSection() {
  const t = useTranslations('landing.system');

  return (
    <section className="lp-scene" id="system">
      <div className="lp-chapter reveal">{t('chapter')}</div>
      <h2 className="lp-title reveal">{t('headline')}</h2>
      <p className="lp-lead reveal">{t('lead')}</p>

      <div className="lp-system-grid">
        {/* Step 1 — Quest */}
        <div className="lp-system-step reveal">
          <div className="[font-family:var(--f-title)] text-[80px] font-black leading-none tracking-[-0.01em] bg-[linear-gradient(135deg,var(--text-hi),var(--gold))] bg-clip-text text-transparent">
            <span className="small">01.</span> {t('questLabel')}
          </div>
          <h3>{t('questTitle')}</h3>
          <p>{t('questDesc')}</p>
          <div className="mock">
            <div className="lp-mini-quest">
              <span className="check" />
              <span className="nm">Deep Work · Chapter Draft</span>
              <span className="rk diff-A">A</span>
              <span className="xp">+220 XP</span>
            </div>
            <div className="lp-mini-quest done">
              <span className="check" />
              <span className="nm">Morning Run · 3km</span>
              <span className="rk diff-C">C</span>
              <span className="xp">+80 XP</span>
            </div>
            <div className="lp-mini-quest">
              <span className="check" />
              <span className="nm">Study · 30 cards</span>
              <span className="rk diff-B">B</span>
              <span className="xp">+140 XP</span>
            </div>
          </div>
        </div>

        {/* Step 2 — Level */}
        <div className="lp-system-step reveal delay-1">
          <div className="[font-family:var(--f-title)] text-[80px] font-black leading-none tracking-[-0.01em] bg-[linear-gradient(135deg,var(--text-hi),var(--gold))] bg-clip-text text-transparent">
            <span className="small">02.</span> {t('levelLabel')}
          </div>
          <h3>{t('levelTitle')}</h3>
          <p>
            {t.rich('levelDesc', { em: (chunks) => <em>{chunks}</em> })}
          </p>
          <div className="mock">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontFamily: 'var(--f-mono)',
                fontSize: 9,
                letterSpacing: '0.18em',
                color: 'var(--text-lo)',
                textTransform: 'uppercase',
              }}
            >
              <span>Lv. 24 → 25</span>
              <span style={{ color: 'var(--violet)' }}>4,210 / 5,000 XP</span>
            </div>
            <div className="xp-bar">
              <div className="fill" style={{ width: '84%' }} />
              <span className="label">84% TO LV.25</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              <div style={{ background: 'var(--bg-3)', borderRadius: 6, padding: '6px 10px' }}>
                <div
                  style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: 9,
                    letterSpacing: '0.15em',
                    color: 'var(--text-lo)',
                  }}
                >
                  STREAK
                </div>
                <div
                  style={{
                    fontFamily: 'var(--f-title)',
                    fontSize: 18,
                    color: 'var(--gold)',
                    fontWeight: 700,
                  }}
                >
                  🔥 27
                </div>
              </div>
              <div style={{ background: 'var(--bg-3)', borderRadius: 6, padding: '6px 10px' }}>
                <div
                  style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: 9,
                    letterSpacing: '0.15em',
                    color: 'var(--text-lo)',
                  }}
                >
                  RANK
                </div>
                <div
                  style={{
                    fontFamily: 'var(--f-title)',
                    fontSize: 18,
                    color: 'var(--violet)',
                    fontWeight: 700,
                  }}
                >
                  A · Sovereign
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 — Reward */}
        <div className="lp-system-step reveal delay-2">
          <div className="[font-family:var(--f-title)] text-[80px] font-black leading-none tracking-[-0.01em] bg-[linear-gradient(135deg,var(--text-hi),var(--gold))] bg-clip-text text-transparent">
            <span className="small">03.</span> {t('rewardLabel')}
          </div>
          <h3>{t('rewardTitle')}</h3>
          <p>
            {t.rich('rewardDesc', { em: (chunks) => <em>{chunks}</em> })}
          </p>
          <div className="mock">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bg-3)',
                border: '1px solid oklch(0.78 0.16 82 / 0.3)',
                borderRadius: 6,
                marginBottom: 6,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--f-title)',
                    fontSize: 12,
                    letterSpacing: '0.04em',
                    color: 'var(--text-hi)',
                  }}
                >
                  {t('reward1Name')}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: 'var(--text-lo)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginTop: 2,
                  }}
                >
                  {t('reward1Sub')}
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--f-title)',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  fontSize: 13,
                }}
              >
                🪙 800
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bg-3)',
                border: '1px solid oklch(0.68 0.22 295 / 0.4)',
                borderRadius: 6,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--f-title)',
                    fontSize: 12,
                    letterSpacing: '0.04em',
                    color: 'var(--text-hi)',
                  }}
                >
                  {t('reward2Name')}{' '}
                  <span style={{ color: 'var(--violet)', fontSize: 9, letterSpacing: '0.2em' }}>
                    ◆ MYTHIC
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: 'var(--text-lo)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginTop: 2,
                  }}
                >
                  {t('reward2Sub')}
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--f-title)',
                  fontWeight: 700,
                  color: 'var(--violet)',
                  fontSize: 13,
                }}
              >
                🪙 2.4k
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
