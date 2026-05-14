'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/libs/utils';

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;

  const cells: { date: Date | null; muted: boolean }[] = [];

  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -startDow + i + 1);
    cells.push({ date: d, muted: true });
  }

  for (let d = 1; d <= last.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), muted: false });
  }

  const remaining = 7 - (cells.length % 7 || 7);
  for (let i = 1; i <= remaining; i++) {
    cells.push({ date: new Date(year, month + 1, i), muted: true });
  }

  return cells;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  label,
  disabled,
  className,
}: DatePickerProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const selectDate = (date: Date) => {
    onChange?.(date);
    setOpen(false);
  };

  const cells = getCalendarDays(viewYear, viewMonth);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div ref={rootRef} className={cn('relative flex flex-col gap-1.5', className)}>
      {label && (
        <label className="font-[var(--f-title)] text-[11px] tracking-[0.16em] uppercase text-[var(--text-md)]">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={cn(
          'h-[42px] w-full flex items-center justify-between gap-3 px-4',
          'bg-[var(--bg-2)] border border-[var(--border)] rounded-[var(--r-md)]',
          'text-[13px] text-left transition-all duration-[180ms] [transition-timing-function:var(--ease-out)]',
          'hover:border-[var(--border-hi)] hover:bg-[var(--bg-3)] focus:outline-none',
          open && 'border-[var(--gold)] shadow-[var(--sh-3),var(--sh-glow-gold)]',
          disabled && 'opacity-40 cursor-not-allowed',
        )}
      >
        <span className={cn(value ? 'text-[var(--text-hi)]' : 'text-[var(--text-dim)]')}>
          {value ? formatDate(value) : placeholder}
        </span>
        <span className="text-[var(--text-lo)] shrink-0">📅</span>
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 z-50 w-[280px] p-4 rounded-[var(--r-md)]"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--gold)',
            boxShadow: 'var(--sh-3), var(--sh-glow-gold)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-6 h-6 flex items-center justify-center rounded-[var(--r-sm)] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-md)] text-[10px] hover:text-[var(--gold)] hover:border-[var(--gold)]"
            >
              ◀
            </button>
            <span className="font-[var(--f-title)] text-[15px] tracking-[0.08em] text-[var(--text-hi)]">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-6 h-6 flex items-center justify-center rounded-[var(--r-sm)] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-md)] text-[10px] hover:text-[var(--gold)] hover:border-[var(--gold)]"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {DAYS.map((d, i) => (
              <span
                key={`dow-${i}`}
                className="aspect-square flex items-center justify-center font-[var(--f-title)] text-[9px] tracking-[0.1em] text-[var(--text-dim)]"
              >
                {d}
              </span>
            ))}

            {cells.map((cell, i) => {
              if (!cell.date) return <span key={i} />;
              const isToday = isSameDay(cell.date, today);
              const isSelected = value ? isSameDay(cell.date, value) : false;
              const d = cell.date;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => !cell.muted && selectDate(d)}
                  className={cn(
                    'aspect-square flex items-center justify-center rounded-[var(--r-sm)] text-[13px]',
                    'transition-all duration-150 relative',
                    cell.muted && 'text-[var(--text-dim)] opacity-50',
                    !cell.muted && !isSelected && 'text-[var(--text-md)] hover:bg-[var(--surface-3)] hover:text-[var(--text-hi)]',
                    isToday && !isSelected && 'text-[var(--gold)] font-bold',
                    isSelected && 'font-bold text-[#0a0400] shadow-[var(--sh-glow-gold)]',
                  )}
                  style={
                    isSelected
                      ? { background: 'linear-gradient(135deg, var(--gold-2), var(--gold))' }
                      : undefined
                  }
                >
                  {d.getDate()}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--gold)] shadow-[0_0_6px_var(--gold-glow)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
