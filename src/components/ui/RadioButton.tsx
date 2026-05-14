'use client';

import type { ReactNode, ChangeEvent } from 'react';
import { cn } from '@/libs/utils';

export interface RadioButtonProps {
  children?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  className?: string;
}

export function RadioButton({
  children,
  checked,
  defaultChecked,
  onChange,
  disabled,
  name,
  value,
  className,
}: RadioButtonProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) onChange?.(value ?? '');
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
        type="radio"
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
          'w-[18px] h-[18px] shrink-0 rounded-full flex items-center justify-center',
          'border-[1.5px] bg-[var(--bg-2)] transition-all duration-200 [transition-timing-function:var(--ease-spring)] relative',
          checked
            ? 'border-[var(--gold)] shadow-[var(--sh-glow-gold)]'
            : 'border-[var(--border-hi)]',
        )}
      >
        {checked && (
          <span
            className="w-[9px] h-[9px] rounded-full bg-gradient-to-br from-[var(--gold-2)] to-[var(--gold)] shadow-[0_0_6px_var(--gold-glow)]"
          />
        )}
      </span>
      {children}
    </label>
  );
}

export interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: ReactNode; disabled?: boolean }[];
  className?: string;
}

export function RadioGroup({ name, value, onChange, options, className }: RadioGroupProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {options.map((opt) => (
        <RadioButton
          key={opt.value}
          name={name}
          value={opt.value}
          checked={value === opt.value}
          onChange={onChange}
          disabled={opt.disabled}
        >
          {opt.label}
        </RadioButton>
      ))}
    </div>
  );
}
