import { useTranslations } from 'next-intl';

import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/libs/utils';

/**
 * Shown for any unmatched path under a locale, and wherever `notFound()` is
 * called inside one.
 *
 * Dressed as a panel from the app rather than as a browser error: the corner
 * brackets, the grid and the ◆ ◆ ◆ rule are the same ones the dashboard uses,
 * so a wrong turn still looks like part of the world it happened in.
 */
export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="lp-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="lp-stars" />
      <div className="lp-aurora" />

      <div className={panel}>
        <span className={cn(corner, 'top-[6px] left-[6px] border-t-[1.5px] border-l-[1.5px]')} />
        <span className={cn(corner, 'top-[6px] right-[6px] border-t-[1.5px] border-r-[1.5px]')} />
        <span className={cn(corner, 'bottom-[6px] left-[6px] border-b-[1.5px] border-l-[1.5px]')} />
        <span
          className={cn(corner, 'right-[6px] bottom-[6px] border-r-[1.5px] border-b-[1.5px]')}
        />

        <p className={eyebrow}>{t('eyebrow')}</p>
        <p className={code}>404</p>
        <p className={divider}>◆ ◆ ◆</p>

        <h1 className={title}>{t('title')}</h1>
        <p className={message}>{t('message')}</p>

        {/* Two ways out: one known-good destination, one step back. */}
        <div className="flex w-full flex-col justify-center gap-2.5 pt-2 sm:w-auto sm:flex-row">
          <Link href="/" className="contents">
            <Button variant="primary" size="lg" className="w-full justify-center sm:w-auto">
              {t('home')}
            </Button>
          </Link>
          <BackButton>{t('back')}</BackButton>
        </div>
      </div>
    </div>
  );
}

const panel = cn(
  'relative z-10 flex w-full max-w-[520px] flex-col items-center gap-3 text-center',
  'rounded-[var(--r)] border border-[oklch(0.74_0.17_85_/_0.35)] bg-[var(--panel)]/90',
  'px-6 py-10 backdrop-blur-sm sm:px-10',
  'shadow-[0_0_40px_oklch(0.74_0.17_85_/_0.08),inset_0_0_30px_oklch(0.74_0.17_85_/_0.03)]',
  // The same faint graph paper the dashboard panels are ruled with.
  "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:content-['']",
  'before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px),repeating-linear-gradient(90deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px)]',
);

const corner = 'pointer-events-none absolute h-3.5 w-3.5 border-[var(--gold-dim)]';

const eyebrow =
  'text-[9px] font-bold tracking-[0.35em] text-[var(--gold)] uppercase [font-family:var(--f-title)]';

const code = cn(
  'text-[76px] leading-none font-bold text-[var(--gold)] sm:text-[96px]',
  '[font-family:var(--f-title)] [text-shadow:0_0_30px_var(--gold-glow)]',
);

const divider = 'text-[9px] tracking-[6px] text-[var(--gold-dim)] opacity-60';

const title =
  'text-[18px] font-bold text-[var(--text-hi)] sm:text-[22px] [font-family:var(--f-title)]';

const message = 'max-w-[380px] text-[12px] leading-relaxed text-[var(--text-mid)]';
