'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/libs/utils';

export interface DropdownItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownGroup {
  label?: string;
  items: DropdownItem[];
}

export interface DropdownProps {
  trigger: ReactNode;
  groups: DropdownGroup[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, groups, align = 'left', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen((p) => !p)}>{trigger}</div>

      {open && (
        <div
          className={cn(
            'absolute top-[calc(100%+6px)] z-50 w-[220px] p-1',
            'bg-[var(--bg-2)] border border-[var(--border-hi)] rounded-[var(--r-md)] shadow-[var(--sh-3)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {groups.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="h-px bg-[var(--border-lo)] my-1" />}
              {group.label && (
                <div className="[font-family:var(--f-title)] text-[9px] tracking-[0.2em] uppercase text-[var(--text-dim)] px-[10px] pt-1.5 pb-1">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick?.();
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-[10px] py-2 rounded-[var(--r-sm)]',
                    'text-[13px] text-[var(--text-md)] cursor-pointer text-left',
                    'transition-colors duration-150',
                    item.danger
                      ? 'hover:bg-[oklch(0.62_0.24_22_/_0.15)] hover:text-[var(--rose)]'
                      : 'hover:bg-[var(--surface-3)] hover:text-[var(--text-hi)]',
                    item.disabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="font-[var(--f-mono)] text-[9px] text-[var(--text-dim)] tracking-[0.1em]">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
