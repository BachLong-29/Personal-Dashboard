import Link from 'next/link';

import './globals.css';

/**
 * The last resort: a path that never reached the `[locale]` segment at all.
 *
 * The root layout is a pass-through, so this page has to bring its own
 * document and its own stylesheet — and it cannot use translations, since the
 * provider lives inside the locale layout. Anything that lands here has no
 * locale to be translated into anyway.
 */
export default function RootNotFound() {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[64px] leading-none font-bold text-[var(--gold)] [font-family:var(--f-title)] [text-shadow:0_0_30px_var(--gold-glow)]">
            404
          </p>
          <p className="text-[9px] tracking-[6px] text-[var(--gold-dim)] opacity-60">◆ ◆ ◆</p>
          <p className="text-[13px] text-[var(--text-mid)]">This path leads nowhere.</p>
          <Link
            href="/"
            className="mt-2 rounded-[var(--r-sm)] border border-[var(--gold)] px-5 py-2.5 text-[11px] font-bold tracking-[0.12em] text-[var(--gold)] uppercase no-underline transition-colors hover:bg-[oklch(0.74_0.17_85_/_0.1)] [font-family:var(--f-title)]"
          >
            Return to base
          </Link>
        </div>
      </body>
    </html>
  );
}
