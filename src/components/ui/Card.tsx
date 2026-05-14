import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

export interface CardProps {
  children: ReactNode;
  glow?: boolean;
  ornamental?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface CardHeadProps {
  children: ReactNode;
  className?: string;
}

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export interface CardFootProps {
  children: ReactNode;
  className?: string;
}

export function CardHead({ children, className }: CardHeadProps) {
  return (
    <div className={cn('flex justify-between items-start mb-3', className)}>{children}</div>
  );
}

export function CardBody({ children, className }: CardBodyProps) {
  return (
    <div className={cn('text-[var(--text-md)] text-[13px] leading-relaxed', className)}>
      {children}
    </div>
  );
}

export function CardFoot({ children, className }: CardFootProps) {
  return (
    <div
      className={cn(
        'mt-4 pt-3 border-t border-[var(--border-lo)] flex justify-between items-center',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Card({ children, glow, ornamental, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-5 relative overflow-hidden',
        'transition-all duration-[220ms] [transition-timing-function:var(--ease-out)]',
        'hover:border-[var(--border-hi)] hover:-translate-y-0.5 hover:shadow-[var(--sh-2)]',
        glow && 'border-[oklch(0.78_0.16_82_/_0.4)] shadow-[var(--sh-glow-gold)]',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {ornamental && (
        <>
          <span className="absolute top-[6px] left-[6px] w-3 h-3 border border-[var(--gold)] opacity-50 border-r-0 border-b-0" />
          <span className="absolute top-[6px] right-[6px] w-3 h-3 border border-[var(--gold)] opacity-50 border-l-0 border-b-0" />
          <span className="absolute bottom-[6px] left-[6px] w-3 h-3 border border-[var(--gold)] opacity-50 border-r-0 border-t-0" />
          <span className="absolute bottom-[6px] right-[6px] w-3 h-3 border border-[var(--gold)] opacity-50 border-l-0 border-t-0" />
        </>
      )}
      {children}
    </div>
  );
}
