'use client';

import type { ReactNode, ChangeEvent } from 'react';
import { cn } from '@/libs/utils';

export interface SwitchProps {
  children?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  className?: string;
}

export function Switch({
  children,
  checked,
  defaultChecked,
  onChange,
  disabled,
  name,
  className,
}: SwitchProps) {
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
        onChange={handleChange}
      />
      <span
        className={cn(
          'relative w-[38px] h-[22px] rounded-full shrink-0',
          'border transition-all duration-[250ms] [transition-timing-function:var(--ease-spring)]',
          checked
            ? 'border-[var(--gold)] shadow-[var(--sh-glow-gold)]'
            : 'bg-[var(--bg-3)] border-[var(--border)]',
        )}
        style={
          checked
            ? { background: 'linear-gradient(90deg, var(--gold-2), var(--gold))' }
            : undefined
        }
      >
        <span
          className={cn(
            'absolute top-[2px] w-[16px] h-[16px] rounded-full',
            'transition-all duration-[250ms] [transition-timing-function:var(--ease-spring)]',
            checked
              ? 'left-[calc(100%-18px)] bg-[#0a0400] shadow-[0_0_4px_oklch(0_0_0_/_0.4)]'
              : 'left-[2px] bg-[var(--text-md)]',
          )}
        />
      </span>
      {children}
    </label>
  );
}
