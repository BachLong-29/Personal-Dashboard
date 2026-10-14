'use client';

import { useEffect, useRef, useState } from 'react';
import { LogoMark } from '@/components/common/LogoMark';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { localeLabels, locales, type Locale } from '@/i18n/config';
import { ThemeChip } from '@/components/common/ThemeChip';

export function LandingNav() {
  const t = useTranslations('landing.nav');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const navRef = useRef<HTMLElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    let lastY = 0;
    const nav = navRef.current;
    if (!nav) return;

    const onScroll = () => {
      const y = window.scrollY;
      if (y > 200 && y > lastY) {
        nav.style.transform = 'translateX(-50%) translateY(-120%)';
      } else {
        nav.style.transform = 'translateX(-50%) translateY(0)';
      }
      lastY = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [langOpen]);

  const switchLocale = (loc: Locale) => {
    router.replace(pathname, { locale: loc });
    setLangOpen(false);
  };

  return (
    <nav className="lp-nav" ref={navRef}>
      <div className="lp-nav-brand">
        {/* Not `lp-nav-mark`: that rule paints the gradient tile and glow the
            letter used to sit on, and overriding it from here cannot win —
            both are single classes, and globals.css is written after the
            utilities, so it takes the tie. Sizing is restated instead: 32px,
            28px under the 767px breakpoint the rule itself uses. */}
        <LogoMark className="h-8 w-8 shrink-0 max-[767px]:h-7 max-[767px]:w-7" />
        <div className="lp-nav-name">AETHERIA</div>
      </div>
      <div className="lp-nav-links">
        <a className="lp-nav-link" href="#system">
          {t('theSystem')}
        </a>
        <a className="lp-nav-link" href="#arsenal">
          {t('arsenal')}
        </a>
        <a className="lp-nav-link" href="#metrics">
          {t('proof')}
        </a>
        <a className="lp-nav-link" href="#vault">
          {t('vault')}
        </a>
        <a className="lp-nav-link" href="#guild">
          {t('guild')}
        </a>
      </div>

      <div className="flex items-center gap-2">
        <ThemeChip />

        {/* Language switcher */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setLangOpen((o) => !o)}
            aria-label="Switch language"
            className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-2)] px-2.5 py-1.5 font-mono text-[11px] tracking-widest text-[var(--text-md)] transition hover:border-[var(--border-hi)] hover:bg-[var(--bg-3)] hover:text-[var(--text-hi)]"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {locale.toUpperCase()}
          </button>

          {langOpen && (
            <div className="absolute right-0 top-full mt-1.5 min-w-[120px] overflow-hidden rounded-md border border-[var(--border)] bg-[var(--panel)] py-1 shadow-xl">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  className={[
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] tracking-widest transition',
                    loc === locale
                      ? 'bg-[var(--bg-3)] text-[var(--text-hi)]'
                      : 'text-[var(--text-lo)] hover:bg-[var(--bg-2)] hover:text-[var(--text-hi)]',
                  ].join(' ')}
                >
                  {loc === locale && <span className="text-[var(--gold)]">◆</span>}
                  {loc !== locale && <span className="w-[12px]" />}
                  {localeLabels[loc]}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link className="lp-nav-cta" href="/login">
          {t('beginSaga')} <span>›</span>
        </Link>
      </div>
    </nav>
  );
}
