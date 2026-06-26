'use client';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { useOnClickOutside } from '@/hooks';
import { cn } from '@/libs/utils';

interface NewItemMenuProps {
  /** Show the "Quest" entry — only when a quest-add handler is available. */
  showQuestOption?: boolean;
  onSelectTask: () => void;
  onSelectQuest: () => void;
  onSelectHabit: () => void;
}

/** "+ New" split button → dropdown to create a Task, Quest or Habit. */
export function NewItemMenu({
  showQuestOption = true,
  onSelectTask,
  onSelectQuest,
  onSelectHabit,
}: NewItemMenuProps) {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, () => setOpen(false));

  const select = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="primary"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span>+</span> {t('quests.newShort')}
        <span className={cn(caret, open && 'rotate-180')}>▾</span>
      </Button>

      {open && (
        <div className={menu} role="menu">
          <button
            type="button"
            role="menuitem"
            className={cn(item, itemTask)}
            onClick={() => select(onSelectTask)}
          >
            <span className={icon}>📋</span>
            {t('quests.sections.tasks')}
          </button>
          {showQuestOption && (
            <button
              type="button"
              role="menuitem"
              className={cn(item, itemQuest)}
              onClick={() => select(onSelectQuest)}
            >
              <span className={icon}>✦</span>
              {t('quests.sections.quests')}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className={cn(item, itemHabit)}
            onClick={() => select(onSelectHabit)}
          >
            <span className={icon}>⚡</span>
            {t('quests.sections.habits')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const caret = 'text-[8px] ml-0.5 transition-transform duration-150';
const menu =
  'absolute right-0 top-[calc(100%+4px)] z-30 min-w-[140px] flex flex-col gap-0.5 p-1 rounded-[var(--r-sm)] border border-[oklch(0.74_0.17_85_/_0.35)] bg-[var(--panel)] shadow-[0_8px_24px_oklch(0_0_0_/_0.45)]';
const item =
  'flex items-center gap-2 px-2.5 py-2 rounded-[var(--r-sm)] text-left text-[12px] font-[var(--font-body)] text-[var(--text-mid)] border border-transparent cursor-pointer transition-all duration-150 hover:text-[var(--text-hi)]';
const itemTask = 'hover:bg-[oklch(0.76_0.16_205_/_0.1)] hover:border-[oklch(0.76_0.16_205_/_0.3)]';
const itemQuest = 'hover:bg-[oklch(0.74_0.17_85_/_0.1)] hover:border-[oklch(0.74_0.17_85_/_0.3)]';
const itemHabit = 'hover:bg-[oklch(0.66_0.22_295_/_0.1)] hover:border-[oklch(0.66_0.22_295_/_0.3)]';
const icon = 'text-[14px] leading-none shrink-0';
