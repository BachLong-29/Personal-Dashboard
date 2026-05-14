'use client';

import { type ChangeEvent, type KeyboardEvent } from 'react';
import { cn } from '@/libs/utils';

export interface InputSearchProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  shortcut?: string;
  disabled?: boolean;
  className?: string;
}

export function InputSearch({
  value,
  defaultValue,
  onChange,
  onSearch,
  placeholder = 'Search…',
  shortcut,
  disabled,
  className,
}: InputSearchProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(value ?? '');
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-[var(--bg-2)] border border-[var(--border)] rounded-[var(--r-md)]',
        'px-3 py-2 w-full transition-all duration-[180ms] [transition-timing-function:var(--ease-out)]',
        'focus-within:border-[var(--gold)] focus-within:shadow-[var(--sh-glow-gold)]',
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      <span className="text-[var(--text-lo)] shrink-0">⌕</span>
      <input
        type="search"
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent border-none outline-none text-[var(--text-hi)] text-[13px] placeholder:text-[var(--text-dim)] min-w-0"
      />
      {shortcut && (
        <span
          className="shrink-0 bg-[var(--bg-4)] border border-b-2 border-[var(--border)] rounded-[3px] px-1.5 py-0.5 font-[var(--f-mono)] text-[9px] text-[var(--text-md)]"
        >
          {shortcut}
        </span>
      )}
    </div>
  );
}
