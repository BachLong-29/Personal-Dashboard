'use client';

import type { ReactNode, ChangeEvent } from 'react';
import { cn } from '@/libs/utils';

export interface CheckboxProps {
  children?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  name?: string;
  value?: string;
  className?: string;
}

export function Checkbox({
  children,
  checked,
  defaultChecked,
  onChange,
  disabled,
  indeterminate,
  name,
  value,
  className,
}: CheckboxProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 cursor-pointer select-none text-[13px] text-[var(--text-md)]',
        'transition-colors duration-150 hover:text-[var(--text-hi)]',
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      <input
        type="checkbox"
        className="hidden"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        name={name}
        value={value}
        onChange={handleChange}
      />
      <span
        className={cn(
          'w-[18px] h-[18px] shrink-0 rounded-[3px] flex items-center justify-center text-[11px]',
          'border-[1.5px] bg-[var(--bg-2)] transition-all duration-[180ms] [transition-timing-function:var(--ease-spring)]',
          'peer-focus-visible:shadow-[0_0_0_3px_oklch(0.78_0.16_82_/_0.25)]',
          indeterminate
            ? 'bg-[var(--gold)] border-[var(--gold)] text-transparent'
            : checked
              ? 'bg-gradient-to-br from-[var(--gold-2)] to-[var(--gold)] border-[var(--gold)] text-[#0a0400] shadow-[var(--sh-glow-gold)]'
              : 'border-[var(--border-hi)] text-transparent',
        )}
      >
        {indeterminate ? (
          <span className="w-2 h-0.5 bg-[#0a0400] block" />
        ) : checked ? (
          '✓'
        ) : null}
      </span>
      {children}
    </label>
  );
}
