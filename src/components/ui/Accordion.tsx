'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '@/libs/utils';

export interface AccordionItem {
  key: string;
  title: ReactNode;
  content: ReactNode;
  icon?: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenKey?: string;
  className?: string;
}

export function Accordion({ items, defaultOpenKey, className }: AccordionProps) {
  const [openKey, setOpenKey] = useState<string | null>(defaultOpenKey ?? null);

  const toggle = (key: string) => setOpenKey((prev) => (prev === key ? null : key));

  return (
    <div
      className={cn(
        'flex flex-col border border-[var(--border)] rounded-[var(--r-md)] overflow-hidden',
        className,
      )}
    >
      {items.map((item) => {
        const open = openKey === item.key;
        return (
          <div key={item.key} className="border-b border-[var(--border-lo)] last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(item.key)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left',
                '[font-family:var(--f-title)] text-[15px] tracking-[0.06em]',
                'transition-all duration-[180ms] hover:bg-[var(--surface-2)]',
                open ? 'text-[var(--gold)]' : 'text-[var(--text-hi)]',
              )}
            >
              {item.icon ?? <span className="text-[10px] text-[var(--gold)]">◆</span>}
              <span className="flex-1">{item.title}</span>
              <span
                className={cn(
                  'text-[10px] transition-transform duration-[250ms] [transition-timing-function:var(--ease-out)]',
                  open ? 'rotate-180 text-[var(--gold)]' : 'text-[var(--text-lo)]',
                )}
              >
                ▼
              </span>
            </button>

            <div
              className="overflow-hidden transition-[max-height] duration-300 [transition-timing-function:var(--ease-out)]"
              style={{ maxHeight: open ? '300px' : '0' }}
            >
              <div className="px-4 pb-4 text-[13px] text-[var(--text-md)] leading-relaxed">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
