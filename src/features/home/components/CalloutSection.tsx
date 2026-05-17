import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function CalloutSection() {
  const t = useTranslations('landing.callout');

  return (
    <div className="lp-callout" id="begin">
      <span className="corn tl" />
      <span className="corn tr" />
      <span className="corn bl" />
      <span className="corn br" />
      <div className="sigil-bg" />

      <div className="lp-chapter">{t('chapter')}</div>
      <h2 className="relative mx-auto my-[var(--s-4)] max-w-[880px] [font-family:var(--f-title)] text-[clamp(48px,6vw,84px)] font-black leading-[1.02] tracking-[0.04em] bg-[linear-gradient(135deg,var(--text-hi)_0%,var(--gold)_50%,oklch(0.92_0.08_82)_100%)] bg-clip-text text-transparent text-balance">
        {t('headline1')}
        <br />
        {t('headline2')}
      </h2>
      <p className="sub">{t('sub')}</p>
      <div className="cta-row">
        <Link className="lp-btn-epic" href="/login">
          {t('ctaAwaken')}
        </Link>
        <a className="lp-btn-ghost" href="#metrics">
          {t('ctaProof')}
        </a>
      </div>
      <div className="fineprint">{t('fineprint')}</div>
    </div>
  );
}
