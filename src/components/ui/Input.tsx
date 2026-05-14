import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/libs/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: ReactNode;
  success?: ReactNode;
  label?: ReactNode;
  helperText?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  containerClassName?: string;
  inputWrapperClassName?: string;
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error,
      success,
      label,
      helperText,
      leadingIcon,
      trailingIcon,
      containerClassName,
      inputWrapperClassName,
      labelClassName,
      id,
      required,
      ...props
    },
    ref,
  ) => {
    const reactId = useId();
    const inputId = id ?? reactId;
    const messageId = error
      ? `${inputId}-error`
      : success
        ? `${inputId}-success`
        : helperText
          ? `${inputId}-helper`
          : undefined;
    const state = error ? 'error' : success ? 'success' : 'default';
    const hasLeadingIcon = Boolean(leadingIcon);
    const hasTrailingIcon = Boolean(trailingIcon);

    const adornmentClasses = cn(
      'absolute inset-y-0 flex items-center text-sm transition-colors duration-[180ms]',
      state === 'error' && 'text-[var(--rose)]',
      state === 'success' && 'text-[var(--mint)]',
      state === 'default' && 'text-[var(--text-lo)] peer-hover:text-[var(--text-md)] peer-focus:text-[var(--gold)]',
    );

    return (
      <div className={cn('flex min-w-0 flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'flex items-center gap-2 font-title text-t2 uppercase tracking-[0.16em] text-[var(--text-md)]',
              labelClassName,
            )}
          >
            {label}
            {required && <span className="text-[10px] text-[var(--rose)]">*</span>}
          </label>
        )}
        <div className={cn('relative', inputWrapperClassName)}>
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'peer h-[42px] w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-2)] px-4 py-[10px]',
              '[font-family:var(--f-body)] text-[var(--t-3)] text-[var(--text-hi)]',
              'transition-all duration-[180ms] [transition-timing-function:var(--ease-out)]',
              'placeholder:text-[var(--text-dim)]',
              'hover:border-[var(--border-hi)] hover:bg-[var(--bg-3)]',
              'focus:border-[var(--gold)] focus:bg-[var(--bg-2)] focus:outline-none',
              'focus:shadow-[0_0_0_3px_oklch(0.78_0.16_82_/_0.15),0_0_24px_var(--gold-glow)]',
              'disabled:cursor-not-allowed disabled:opacity-40',
              'read-only:bg-[var(--bg-3)] read-only:text-[var(--text-md)] read-only:hover:bg-[var(--bg-3)]',
              hasLeadingIcon && 'pl-9',
              hasTrailingIcon && 'pr-9',
              state === 'error' &&
                'border-[var(--rose)] hover:border-[var(--rose)] focus:border-[var(--rose)] focus:shadow-[0_0_0_3px_oklch(0.74_0.18_5_/_0.15)]',
              state === 'success' &&
                'border-[var(--mint)] hover:border-[var(--mint)] focus:border-[var(--mint)] focus:shadow-[0_0_0_3px_oklch(0.76_0.14_162_/_0.15)]',
              className,
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={messageId}
            required={required}
            {...props}
          />

          {leadingIcon && <span className={cn(adornmentClasses, 'left-3')}>{leadingIcon}</span>}
          {trailingIcon && <span className={cn(adornmentClasses, 'right-3')}>{trailingIcon}</span>}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-t2 text-[var(--rose)]">
            {error}
          </p>
        )}
        {!error && success && (
          <p id={`${inputId}-success`} className="text-t2 text-[var(--mint)]">
            {success}
          </p>
        )}
        {!error && !success && helperText && (
          <p id={`${inputId}-helper`} className="text-t2 text-[var(--text-lo)]">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
