import { useTranslations } from 'next-intl';

export function ArsenalSection() {
  const t = useTranslations('landing.arsenal');

  return (
    <section className="lp-scene" id="arsenal">
      <div className="lp-chapter reveal">{t('chapter')}</div>
      <h2 className="lp-title reveal">{t('headline')}</h2>
      <p className="lp-lead reveal">
        {t.rich('lead', { em: (chunks) => <em>{chunks}</em> })}
      </p>

      <div className="lp-arsenal-grid">
        {/* Quest System */}
        <div className="lp-feat span-3 reveal">
          <div className="ftag">{t('qsTag')}</div>
          <h3>{t('qsTitle')}</h3>
          <p>{t('qsDesc')}</p>
          <div>
            {[
              { done: true,  nm: t('qsQ1'), rk: 'diff-D', xp: '+40 XP' },
              { done: true,  nm: t('qsQ2'), rk: 'diff-C', xp: '+90 XP' },
              { done: false, nm: t('qsQ3'), rk: 'diff-B', xp: '+160 XP' },
              { done: false, nm: t('qsQ4'), rk: 'diff-A', xp: '+240 XP' },
              { done: false, nm: t('qsQ5'), rk: 'diff-S', xp: '+780 XP' },
            ].map((q) => (
              <div key={q.nm} className={`lp-mini-quest${q.done ? ' done' : ''}`}>
                <span className="check" />
                <span className="nm">{q.nm}</span>
                <span className={`rk ${q.rk}`}>{q.rk.replace('diff-', '')}</span>
                <span className="xp">{q.xp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Schedule */}
        <div className="lp-feat span-3 reveal delay-1">
          <div className="ftag">{t('schedTag')}</div>
          <h3>{t('schedTitle')}</h3>
          <p>{t('schedDesc')}</p>
          <div>
            {[
              { t: '07:00', lb: t('schedR1'), dur: '45m',  color: 'var(--mint)',   glow: 'var(--mint)',   now: false },
              { t: '09:30', lb: t('schedR2'), dur: '2h',   color: 'var(--gold)',   glow: 'var(--gold)',   now: true  },
              { t: '12:00', lb: t('schedR3'), dur: '1h',   color: 'var(--cyan)',   glow: 'var(--cyan)',   now: false },
              { t: '14:00', lb: t('schedR4'), dur: '30m',  color: 'var(--violet)', glow: 'var(--violet)', now: false },
              { t: '17:30', lb: t('schedR5'), dur: '50m',  color: 'var(--rose)',   glow: 'var(--rose)',   now: false },
            ].map((row) => (
              <div key={row.t} className={`lp-sched-row${row.now ? ' now' : ''}`}>
                <span className="t">{row.t}</span>
                <span className="sched-dot" style={{ background: row.color, boxShadow: `0 0 ${row.now ? '8' : '6'}px ${row.glow}` }} />
                <span className="lb">{row.lb}</span>
                <span className="dur">{row.dur}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="lp-feat span-2 reveal">
          <div className="ftag">{t('achTag')}</div>
          <h3>{t('achTitle')}</h3>
          <p>{t('achDesc')}</p>
          <div className="lp-ach-row">
            {[
              { ic: '🔥', nm: t('achA1'),    cls: 'earned' },
              { ic: '⚔',  nm: t('achA2'),    cls: 'earned' },
              { ic: '👑', nm: t('achA3'),     cls: 'legendary' },
              { ic: '🌌', nm: t('achLocked'), cls: '' },
              { ic: '📚', nm: t('achA4'),     cls: 'earned' },
              { ic: '🛡', nm: t('achA5'),     cls: 'earned' },
              { ic: '⚡', nm: t('achLocked'), cls: '' },
              { ic: '🐉', nm: t('achLocked'), cls: '' },
            ].map((a, i) => (
              <div key={i} className={`lp-ach-tile${a.cls ? ` ${a.cls}` : ''}`}>
                <div className="ic">{a.ic}</div>
                <div className="nm">{a.nm}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Missions */}
        <div className="lp-feat span-2 reveal delay-1">
          <div className="ftag">{t('missionsTag')}</div>
          <h3>{t('missionsTitle')}</h3>
          <p>{t('missionsDesc')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'var(--s-3)' }}>
            {[
              { icon: '🎯', label: t('m1Label'), sub: t('m1Sub'), reward: '+300', color: 'var(--gold)',   border: 'oklch(0.78 0.16 82 / 0.3)',  bg: 'oklch(0.78 0.16 82 / 0.15)' },
              { icon: '📜', label: t('m2Label'), sub: t('m2Sub'), reward: '+180', color: 'var(--violet)', border: 'var(--border)',              bg: 'oklch(0.68 0.22 295 / 0.15)' },
              { icon: '💧', label: t('m3Label'), sub: t('m3Sub'), reward: '+120', color: 'var(--mint)',   border: 'var(--border)',              bg: 'oklch(0.76 0.14 162 / 0.15)' },
            ].map((m) => (
              <div key={m.label} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, background: 'var(--bg-2)', border: `1px solid ${m.border}`, borderRadius: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{m.icon}</div>
                <div style={{ flex: 1, fontSize: 11 }}>
                  <div style={{ fontFamily: 'var(--f-title)', color: 'var(--text-hi)', letterSpacing: '0.04em' }}>{m.label}</div>
                  <div style={{ color: 'var(--text-lo)', fontSize: 9, marginTop: 1 }}>{m.sub}</div>
                </div>
                <div style={{ fontFamily: 'var(--f-title)', fontSize: 9, color: m.color, letterSpacing: '0.15em' }}>{m.reward}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Forge */}
        <div className="lp-feat span-2 reveal delay-2">
          <div className="ftag">{t('focusTag')}</div>
          <h3>{t('focusTitle')}</h3>
          <p>{t('focusDesc')}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--s-4) 0' }}>
            <div style={{ position: 'relative', width: 110, height: 110 }}>
              <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-3)" strokeWidth="6" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#fgrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="263.9" strokeDashoffset="80" />
                <defs>
                  <linearGradient id="fgrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="oklch(0.55 0.20 295)" />
                    <stop offset="1" stopColor="oklch(0.78 0.16 82)" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'var(--f-title)', fontSize: 22, fontWeight: 700, letterSpacing: '0.04em' }}>17:42</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-lo)', textTransform: 'uppercase', marginTop: 2 }}>{t('focusDeepWork')}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <span className="badge badge--violet">×1.5 XP</span>
            <span className="badge badge--cyan">{t('focusMode')}</span>
          </div>
        </div>

        {/* Character */}
        <div className="lp-feat span-2 reveal delay-3">
          <div className="ftag">{t('charTag')}</div>
          <h3>{t('charTitle')}</h3>
          <p>
            {t.rich('charDesc', { em: (chunks) => <em>{chunks}</em> })}
          </p>
          <div style={{ display: 'flex', gap: 'var(--s-3)', marginTop: 'var(--s-3)', alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--violet), var(--gold))', padding: 2, flexShrink: 0 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-title)', fontSize: 24, fontWeight: 900, color: 'var(--gold)' }}>A</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { key: 'STR', w: '62%', bg: 'var(--rose)',   val: 62 },
                { key: 'INT', w: '84%', bg: 'var(--violet)', val: 84 },
                { key: 'WIS', w: '71%', bg: 'var(--cyan)',   val: 71 },
                { key: 'DEX', w: '55%', bg: 'var(--mint)',   val: 55 },
              ].map((s) => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-lo)' }}>
                  <span style={{ width: 18 }}>{s.key}</span>
                  <span style={{ flex: 1, height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: s.w, background: s.bg }} />
                  </span>
                  <span style={{ width: 22, textAlign: 'right', color: 'var(--text-md)' }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
