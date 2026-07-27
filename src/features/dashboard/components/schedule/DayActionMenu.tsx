'use client';

import { useRef, useState } from 'react';

import { useOnClickOutside } from '@/hooks';
import { cn } from '@/libs/utils';

interface DayActionMenuProps {
  onAddTask: () => void;
  onPickTask: () => void;
}

/** "+" trigger → dropdown to create a new task or pick an existing one onto this day. */
export function DayActionMenu({ onAddTask, onPickTask }: DayActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, () => setOpen(false));

  function select(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={triggerBtn}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Add to this day"
      >
        +
      </button>

      {open && (
        <div className={menu} role="menu">
          <button
            type="button"
            role="menuitem"
            className={cn(item, itemNew)}
            onClick={() => select(onAddTask)}
          >
            <span className={icon}>📝</span> New task
          </button>
          <button
            type="button"
            role="menuitem"
            className={cn(item, itemPick)}
            onClick={() => select(onPickTask)}
          >
            <span className={icon}>📋</span> Pick task
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const triggerBtn =
  'w-6 h-6 flex items-center justify-center text-[16px] text-[var(--text-lo)] hover:text-[var(--gold)] cursor-pointer transition-colors leading-none rounded hover:bg-[oklch(0.74_0.17_85_/_0.08)]';
const menu =
  'absolute right-0 top-[calc(100%+4px)] z-30 min-w-[112px] flex flex-col gap-0.5 p-1 rounded-[var(--r-sm)] border border-[oklch(0.74_0.17_85_/_0.35)] bg-[var(--panel)] shadow-[0_8px_24px_oklch(0_0_0_/_0.45)]';
const item =
  'flex items-center gap-1.5 px-2 py-1.5 rounded-[var(--r-sm)] text-left text-[10px] whitespace-nowrap font-[var(--font-body)] text-[var(--text-mid)] border border-transparent cursor-pointer transition-all duration-150 hover:text-[var(--text-hi)]';
const itemNew = 'hover:bg-[oklch(0.76_0.16_205_/_0.1)] hover:border-[oklch(0.76_0.16_205_/_0.3)]';
const itemPick = 'hover:bg-[oklch(0.74_0.17_85_/_0.1)] hover:border-[oklch(0.74_0.17_85_/_0.3)]';
const icon = 'text-[12px] leading-none shrink-0';
