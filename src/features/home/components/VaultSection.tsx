import { useTranslations } from 'next-intl';

const lootBase = [
  { cls: 'legendary', rar: '◆ LEGENDARY', rarColor: '',                      pct: '1.2% drop', glyph: '👑', price: '🪙 8,400',  priceStyle: {},                                                                                                                      titleKey: 'item1Title', descKey: 'item1Desc' },
  { cls: 'mythic',    rar: '◆ MYTHIC',    rarColor: 'oklch(0.85 0.18 320)', pct: '0.4% drop', glyph: '🌌', price: '🪙 14,200', priceStyle: { color: 'oklch(0.85 0.18 320)', borderColor: 'oklch(0.7 0.22 320 / 0.4)', background: 'oklch(0.7 0.22 320 / 0.08)' }, titleKey: 'item2Title', descKey: 'item2Desc' },
  { cls: 'epic',      rar: '◆ EPIC',      rarColor: '',                      pct: '3.5% drop', glyph: '⚔', price: '🪙 3,800',  priceStyle: { color: 'var(--violet)', borderColor: 'oklch(0.68 0.22 295 / 0.4)', background: 'oklch(0.68 0.22 295 / 0.08)' },     titleKey: 'item3Title', descKey: 'item3Desc' },
  { cls: 'rare',      rar: '◆ RARE',      rarColor: '',                      pct: '8% drop',   glyph: '📜', price: '🪙 1,600',  priceStyle: { color: 'var(--cyan)', borderColor: 'oklch(0.78 0.16 205 / 0.4)', background: 'oklch(0.78 0.16 205 / 0.08)' },      titleKey: 'item4Title', descKey: 'item4Desc' },
] as const;

export function VaultSection() {
  const t = useTranslations('landing.vault');

  return (
    <section className="lp-scene lp-vault" id="vault">
      <div className="lp-chapter reveal">{t('chapter')}</div>
      <h2 className="lp-title reveal">{t('headline')}</h2>
      <p className="lp-lead reveal">
        {t.rich('lead', { em: (chunks) => <em>{chunks}</em> })}
      </p>

      <div className="lp-vault-grid">
        {lootBase.map((l, i) => (
          <div key={l.titleKey} className={`lp-loot ${l.cls} reveal${i > 0 ? ` delay-${i}` : ''}`}>
            <span className="rar" style={l.rarColor ? { color: l.rarColor } : {}}>{l.rar}</span>
            <span className="pct">{l.pct}</span>
            <div className="glyph">{l.glyph}</div>
            <h4>{t(l.titleKey)}</h4>
            <p>{t(l.descKey)}</p>
            <span className="price" style={l.priceStyle as React.CSSProperties}>{l.price}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
