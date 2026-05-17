'use client';

import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

export interface Tab {
  key: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeKey?: string;
  onChange?: (key: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

export function Tabs({ tabs, activeKey, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'inline-flex bg-[var(--bg-2)] border border-[var(--border)] rounded-full p-1',
          className,
        )}
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange?.(tab.key)}
              className={cn(
                'rounded-full px-4 py-1.5 [font-family:var(--f-title)] text-[13px] tracking-[0.1em] uppercase',
                'transition-all duration-[180ms] [transition-timing-function:var(--ease-out)]',
                active
                  ? 'bg-gradient-to-br from-[var(--gold-2)] to-[var(--gold)] text-[#0a0400] shadow-[var(--sh-glow-gold)]'
                  : 'text-[var(--text-md)] hover:text-[var(--text-hi)]',
                tab.disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex gap-1 border-b border-[var(--border)]', className)}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange?.(tab.key)}
            className={cn(
              'relative px-4 py-[9px] [font-family:var(--f-title)] text-[13px] tracking-[0.12em] font-semibold uppercase',
              'bg-none border-none rounded-[var(--r-sm)_var(--r-sm)_0_0]',
              'transition-colors duration-[180ms]',
              active ? 'text-[var(--gold)]' : 'text-[var(--text-md)] hover:text-[var(--text-hi)]',
              tab.disabled && 'opacity-40 cursor-not-allowed',
            )}
          >
            {tab.label}
            {active && (
              <span className="absolute bottom-[-1px] left-3 right-3 h-0.5 rounded-t bg-[var(--gold)] shadow-[0_0_8px_var(--gold-glow)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
