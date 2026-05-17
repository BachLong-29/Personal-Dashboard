import { useTranslations } from 'next-intl';
import { cn } from '@/libs/utils';

const struggleMeta = [
  { code: 'ERR_0x01', icon: '⌛', titleKey: 's1Title', bodyKey: 's1Body' },
  { code: 'ERR_0x02', icon: '🌫', titleKey: 's2Title', bodyKey: 's2Body' },
  { code: 'ERR_0x03', icon: '💤', titleKey: 's3Title', bodyKey: 's3Body' },
  { code: 'ERR_0x04', icon: '🥀', titleKey: 's4Title', bodyKey: 's4Body' },
  { code: 'ERR_0x05', icon: '⚡', titleKey: 's5Title', bodyKey: 's5Body' },
  { code: 'ERR_0x06', icon: '🌀', titleKey: 's6Title', bodyKey: 's6Body' },
] as const;

const brokenRowKeys = [
  { nameKey: 'r1Name', daysKey: 'r1Days' },
  { nameKey: 'r2Name', daysKey: 'r2Days' },
  { nameKey: 'r3Name', daysKey: 'r3Days' },
] as const;

export function DarknessSection() {
  const t = useTranslations('landing.darkness');

  return (
    <section className="lp-scene lp-darkness" id="darkness">
      <div className="lp-chapter reveal">{t('chapter')}</div>
      <h2
        className={cn(
          '[font-family:var(--f-title)] text-[clamp(36px,5vw,64px)] font-black leading-[1.04] tracking-[0.04em] max-w-[880px] mb-[var(--s-4)] bg-[linear-gradient(135deg,var(--text-hi)_0%,var(--gold)_65%,var(--violet)_100%)] bg-clip-text text-transparent text-balance reveal',
        )}
      >
        {t('headline')}
      </h2>
      <p className="lp-lead reveal">
        {t.rich('lead', { em: (chunks) => <em>{chunks}</em> })}
      </p>

      <div className="lp-dark-grid">
        {struggleMeta.map((s, i) => (
          <div key={s.code} className={`lp-struggle reveal${i % 3 > 0 ? ` delay-${i % 3}` : ''}`}>
            <div className="glitch">{s.code}</div>
            <div className="icon-bx">{s.icon}</div>
            <h3>{t(s.titleKey)}</h3>
            <p>{t(s.bodyKey)}</p>
          </div>
        ))}
      </div>

      <div className="lp-broken-mockup reveal">
        <div className="lp-broken-header">
          <div className="ttl">◇ {t('yesterdayQuests')}</div>
          <div className="stream">
            <span />
            <span />
            <span />
            <span className="miss" />
            <span className="miss" />
            <span className="miss" />
            <span className="miss" />
          </div>
        </div>
        {brokenRowKeys.map((r) => (
          <div key={r.nameKey} className="lp-broken-row">
            <div className="check-empty" />
            <div className="name">{t(r.nameKey)}</div>
            <div className="days">{t(r.daysKey)}</div>
            <div className="tag">{t('abandoned')}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
