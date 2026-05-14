import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

export interface NoDataProps {
  icon?: string;
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export function NoData({
  icon = '⚔',
  title = 'Nothing Here',
  message,
  action,
  className,
}: NoDataProps) {
  return (
    <div className={cn('text-center py-[60px] px-5', className)}>
      <div
        className="relative w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl text-[var(--gold)]"
        style={{
          background: 'radial-gradient(circle, oklch(0.78 0.16 82 / 0.12), transparent 60%)',
          border: '1.5px dashed var(--border-hi)',
        }}
      >
        {icon}
        <span
          className="absolute -inset-2 rounded-full border border-dashed border-[oklch(0.78_0.16_82_/_0.25)] animate-[spin_18s_linear_infinite]"
        />
        <span
          className="absolute rounded-full border border-dashed border-[oklch(0.78_0.16_82_/_0.12)]"
          style={{ inset: '-16px', animation: 'spin 28s linear infinite reverse', opacity: 0.5 }}
        />
      </div>
      <div className="font-[var(--f-title)] text-[18px] tracking-[0.06em] text-[var(--text-hi)] mb-1.5">
        {title}
      </div>
      {message && (
        <p className="text-[var(--text-lo)] text-[13px] max-w-[360px] mx-auto mb-4 leading-relaxed">
          {message}
        </p>
      )}
      {action}
    </div>
  );
}
