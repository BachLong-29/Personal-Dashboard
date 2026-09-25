'use client';

import type { ReactNode } from 'react';

/**
 * One labelled preference row. Lives here rather than inside PrefsSection
 * because the cash-log section needs the same shape and two copies of a
 * layout drift apart.
 */
export function PrefRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="flex justify-between items-center gap-8 py-4 border-b border-border-lo last:border-b-0">
      <div>
        <div className="[font-family:var(--f-title)] italic text-[15px] text-text-hi">{label}</div>
        <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.14em] uppercase text-text-lo mt-[3px]">
          {hint}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
