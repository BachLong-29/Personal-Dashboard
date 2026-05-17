import { useTranslations } from 'next-intl';

const playersBase = [
  {
    initial: 'K', level: 31,
    avatarStyle: { background: 'linear-gradient(135deg, oklch(0.50 0.20 22), var(--rose))' },
    avatarShadow: '0 0 0 1px oklch(0.50 0.20 22), 0 0 12px oklch(0.50 0.20 22 / 0.4)',
    name: 'Kaede Oda', rank: '◆ S-RANK · ROGUE',
    quoteKey: 'kaedeQuote' as const,
    pills: [
      { cls: 'gold',   label: '🔥 124 DAYS' },
      { cls: 'violet', label: '8,400 XP/wk' },
      { cls: 'mint',   label: '96% HABITS' },
    ],
  },
  {
    initial: 'A', level: 24,
    avatarStyle: { background: 'linear-gradient(135deg, var(--violet-2), var(--violet))' },
    avatarShadow: '0 0 0 1px var(--violet), 0 0 12px var(--violet-glow)',
    name: 'Aria Solveig', rank: '◆ A-RANK · MAGE',
    quoteKey: 'ariaQuote' as const,
    pills: [
      { cls: 'gold',   label: '🔥 27 DAYS' },
      { cls: 'violet', label: '5,200 XP/wk' },
      { cls: 'mint',   label: '91% HABITS' },
    ],
  },
  {
    initial: 'T', level: 42,
    avatarStyle: { background: 'linear-gradient(135deg, oklch(0.55 0.16 162), var(--mint))', color: '#021' },
    avatarShadow: '0 0 0 1px var(--mint), 0 0 12px var(--mint-glow)',
    name: 'Tora Saito', rank: '◆ S-RANK · SAGE',
    quoteKey: 'toraQuote' as const,
    pills: [
      { cls: 'gold',   label: '🔥 211 DAYS' },
      { cls: 'violet', label: '12,400 XP/wk' },
      { cls: 'mint',   label: '98% HABITS' },
    ],
  },
] as const;

export function GuildSection() {
  const t = useTranslations('landing.guild');

  return (
    <section className="lp-scene" id="guild">
      <div className="lp-chapter reveal">{t('chapter')}</div>
      <h2 className="lp-title reveal">{t('headline')}</h2>
      <p className="lp-lead reveal">
        {t.rich('lead', { em: (chunks) => <em>{chunks}</em> })}
      </p>

      <div className="lp-guild-grid">
        {playersBase.map((p, i) => (
          <div key={p.name} className={`lp-player-card reveal${i > 0 ? ` delay-${i}` : ''}`}>
            <div className="lp-player-head">
              <div
                className="lp-player-avatar"
                style={{ ...p.avatarStyle, boxShadow: p.avatarShadow } as React.CSSProperties}
              >
                {p.initial}
                <span className="badge-lv">{p.level}</span>
              </div>
              <div className="lp-player-info">
                <div className="name">{p.name}</div>
                <div className="class">{p.rank}</div>
              </div>
            </div>
            <p className="lp-player-quote">{t(p.quoteKey)}</p>
            <div className="lp-player-stats">
              {p.pills.map((pill) => (
                <span key={pill.label} className={`lp-ps-pill ${pill.cls}`}>{pill.label}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
