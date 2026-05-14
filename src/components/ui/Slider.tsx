'use client';

import type { ReactNode, ChangeEvent } from 'react';
import { cn } from '@/libs/utils';

export interface SliderProps {
  label?: ReactNode;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onChange,
  formatValue,
  disabled,
  className,
}: SliderProps) {
  const displayValue = value ?? defaultValue ?? min;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(Number(e.target.value));
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="font-[var(--f-title)] text-[11px] tracking-[0.16em] uppercase text-[var(--text-md)]">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3 w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={handleChange}
          className={cn(
            'flex-1 h-1 rounded-full outline-none appearance-none bg-[var(--bg-3)]',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px]',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bg-0)]',
            '[&::-webkit-slider-thumb]:shadow-[var(--sh-glow-gold)]',
            '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-[180ms]',
            '[&::-webkit-slider-thumb]:hover:scale-125',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
          style={{
            background: `linear-gradient(to right, var(--gold) 0%, var(--gold) ${((displayValue - min) / (max - min)) * 100}%, var(--bg-3) ${((displayValue - min) / (max - min)) * 100}%)`,
          }}
        />
        <span className="font-[var(--f-mono)] text-[11px] text-[var(--gold)] min-w-[40px] text-right">
          {formatValue ? formatValue(displayValue) : displayValue}
        </span>
      </div>
    </div>
  );
}
