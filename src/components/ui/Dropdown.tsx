'use client';

import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

/** Matches the menu's own `w-[220px]`; needed to right-align it from a rect. */
const MENU_WIDTH = 220;

export function Dropdown({ trigger, groups, align = 'left', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  // The menu is portalled, because callers sit inside panels that clip their
  // overflow — an absolutely positioned menu simply never appeared there. That
  // means its position has to be tracked against the trigger by hand.
  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const box = rootRef.current?.getBoundingClientRect();
      if (!box) return;
      const left = align === 'right' ? box.right - MENU_WIDTH : box.left;
      // Never off the left edge on a narrow screen.
      setRect({ top: box.bottom + 6, left: Math.max(8, left) });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, align]);

  return (
    <div ref={rootRef} className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen((p) => !p)}>{trigger}</div>

      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: rect.top, left: rect.left, width: MENU_WIDTH }}
            className={cn(
              'fixed z-[1050] p-1',
              'bg-[var(--bg-2)] border border-[var(--border-hi)] rounded-[var(--r-md)] shadow-[var(--sh-3)]',
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
          </div>,
          document.body,
        )}
    </div>
  );
}
