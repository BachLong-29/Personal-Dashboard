'use client';

import { cn } from '@/libs/utils';

export interface PaginationProps {
  page: number;
  total: number;
  onChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

function getPages(page: number, total: number, siblingCount: number): (number | '…')[] {
  const delta = siblingCount;
  const range: (number | '…')[] = [];

  const left = Math.max(1, page - delta);
  const right = Math.min(total, page + delta);

  if (left > 1) {
    range.push(1);
    if (left > 2) range.push('…');
  }

  for (let i = left; i <= right; i++) range.push(i);

  if (right < total) {
    if (right < total - 1) range.push('…');
    range.push(total);
  }

  return range;
}

export function Pagination({
  page,
  total,
  onChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const pages = getPages(page, total, siblingCount);

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={cn(
          'w-8 h-8 rounded-[var(--r-sm)] flex items-center justify-center',
          'bg-[var(--surface-2)] border border-[var(--border)]',
          'font-[var(--f-mono)] text-[11px] text-[var(--text-md)]',
          'transition-all duration-150 hover:text-[var(--gold)] hover:border-[var(--gold)]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[var(--text-md)] disabled:hover:border-[var(--border)]',
        )}
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="text-[var(--text-dim)] px-1.5 text-[13px]">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p as number)}
            className={cn(
              'w-8 h-8 rounded-[var(--r-sm)] flex items-center justify-center',
              'font-[var(--f-mono)] text-[11px]',
              'transition-all duration-150',
              p === page
                ? 'bg-gradient-to-br from-[var(--gold-2)] to-[var(--gold)] text-[#0a0400] border border-[var(--gold)] shadow-[var(--sh-glow-gold)]'
                : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-md)] hover:text-[var(--gold)] hover:border-[var(--gold)]',
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={page >= total}
        onClick={() => onChange(page + 1)}
        className={cn(
          'w-8 h-8 rounded-[var(--r-sm)] flex items-center justify-center',
          'bg-[var(--surface-2)] border border-[var(--border)]',
          'font-[var(--f-mono)] text-[11px] text-[var(--text-md)]',
          'transition-all duration-150 hover:text-[var(--gold)] hover:border-[var(--gold)]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[var(--text-md)] disabled:hover:border-[var(--border)]',
        )}
      >
        ›
      </button>
    </div>
  );
}
