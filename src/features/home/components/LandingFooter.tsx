import { useTranslations } from 'next-intl';

export function LandingFooter() {
  const t = useTranslations('landing.footer');

  return (
    <>
      <footer className="lp-foot">
        <div className="lp-foot-brand">
          <div className="name">◆ AETHERIA ◆</div>
          <p>{t('brandDesc')}</p>
        </div>
        <div className="lp-foot-col">
          <h5>{t('systemCol')}</h5>
          <a href="#system">{t('howItWorks')}</a>
          <a href="#arsenal">{t('features')}</a>
          <a href="#metrics">{t('proof')}</a>
          <a href="#vault">{t('vault')}</a>
        </div>
        <div className="lp-foot-col">
          <h5>{t('realmCol')}</h5>
          <a href="#guild">{t('guild')}</a>
          <a href="#">{t('changelog')}</a>
          <a href="#">{t('manifesto')}</a>
          <a href="#">{t('pressKit')}</a>
        </div>
        <div className="lp-foot-col">
          <h5>{t('forgeCol')}</h5>
          <a href="#">{t('ios')}</a>
          <a href="#">{t('desktop')}</a>
          <a href="#">{t('api')}</a>
          <a href="#">{t('status')}</a>
        </div>
      </footer>
      <div className="lp-foot-bottom">
        <span>{t('copyright')}</span>
        <span>{t('tagline')}</span>
      </div>
    </>
  );
}
