import { forwardRef } from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/libs/utils';

export const buttonVariants = cva(
  [
    'group relative inline-flex items-center justify-center overflow-hidden',
    '[font-family:var(--f-title)] text-[13px] font-bold uppercase tracking-[0.12em]',
    'border',
    'transition-all duration-[180ms] [transition-timing-function:var(--ease-out)]',
    'hover:-translate-y-px active:translate-y-0 active:brightness-[0.92]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-[var(--surface-2)] text-[var(--text-hi)] border-[var(--border)]',
        primary: [
          'bg-gradient-to-br from-[var(--gold-2)] to-[var(--gold)]',
          'text-[#0a0400] border-[var(--gold)]',
          'btn-shadow-primary',
        ].join(' '),
        violet: [
          'bg-gradient-to-br from-[var(--violet-2)] to-[var(--violet)]',
          'text-white border-[var(--violet)]',
          'btn-shadow-violet',
        ].join(' '),
        ghost: [
          'bg-transparent text-[var(--text-hi)] border-[var(--border)]',
          'hover:bg-[var(--surface-2)] hover:border-[var(--border-hi)]',
        ].join(' '),
        danger: [
          'bg-gradient-to-br from-[oklch(0.50_0.20_22)] to-[var(--crimson)]',
          'text-white border-[var(--crimson)]',
          'btn-shadow-danger',
        ].join(' '),
        success: [
          'bg-gradient-to-br from-[oklch(0.55_0.16_162)] to-[var(--mint)]',
          'text-[#021] border-[var(--mint)]',
          'btn-shadow-success',
        ].join(' '),
      },
      size: {
        default: 'gap-2 px-4 py-[9px] rounded-[var(--r-sm)]',
        lg: 'gap-2 px-[22px] py-3 rounded-[var(--r-sm)]',
        sm: 'gap-2 px-3 py-[6px] text-[11px] tracking-[0.1em] rounded-[var(--r-sm)]',
        icon: 'w-9 h-9 p-0 rounded-[var(--r-md)] text-sm tracking-normal',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? true : undefined}
      {...props}
    >
      {/* shimmer sweep on hover */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-0 -left-full h-full w-[60%]',
          'bg-gradient-to-r from-transparent via-white/[0.18] to-transparent',
          'transition-[left] duration-[600ms] [transition-timing-function:var(--ease-out)]',
          'group-hover:left-[200%]',
          (isLoading || disabled) && 'hidden',
        )}
      />

      {/* spinner overlay */}
      {isLoading && (
        <svg
          className="absolute h-3.5 w-3.5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}

      <span className={cn('inline-flex items-center gap-2', isLoading && 'invisible')}>
        {children}
      </span>
    </button>
  ),
);

Button.displayName = 'Button';
