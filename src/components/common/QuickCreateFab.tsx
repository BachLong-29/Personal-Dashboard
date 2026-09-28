'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { usePathname } from '@/i18n/navigation';
import { cn } from '@/libs/utils';
import { useUIStore } from '@/stores/ui.store';

/**
 * The one place to create something, on a phone.
 *
 * The topbar's left cluster had grown to five icons in the corner hardest for
 * a thumb to reach. Creating moved here instead: bottom-right is where the
 * thumb already rests, and one button can hold all three things worth
 * capturing in a hurry.
 *
 * Phone only — on desktop the same three live in the topbar's ＋ menu, where
 * there is room to print their keyboard shortcuts beside them.
 */
export function QuickCreateFab() {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);

  const openNotes = useUIStore((s) => s.openNotes);
  const openQuickAddTask = useUIStore((s) => s.openQuickAddTask);
  const openQuickAddTransaction = useUIStore((s) => s.openQuickAddTransaction);

  // Profile keeps a fixed save bar along the bottom edge (ProfilePage.tsx),
  // and the button would land on top of its right-hand button. That bar is
  // permanent, unlike a toast, so the button stands down there.
  const pathname = usePathname();
  if (pathname.startsWith('/profile')) return null;

  const actions = [
    { key: 'note', icon: '✎', label: t('quickAddMenu.note'), run: openNotes },
    { key: 'task', icon: '📋', label: t('quickAddMenu.task'), run: openQuickAddTask },
    {
      key: 'transaction',
      icon: '💰',
      label: t('quickAddMenu.transaction'),
      run: openQuickAddTransaction,
    },
  ];

  const pick = (run: () => void) => {
    setOpen(false);
    run();
  };

  return (
    <div className="sm:hidden">
      {/* Catches the next tap anywhere, so the dial never needs an X of its own. */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className={stack}>
        <AnimatePresence>
          {open &&
            actions.map((action, i) => (
              <motion.button
                key={action.key}
                type="button"
                onClick={() => pick(action.run)}
                className={item}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                // Bottom-up, so the nearest option settles first under the thumb.
                transition={{ duration: 0.16, delay: (actions.length - 1 - i) * 0.035 }}
              >
                <span className="text-[12px] whitespace-nowrap">{action.label}</span>
                <span className={itemIcon}>{action.icon}</span>
              </motion.button>
            ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={t('quickAddMenu.ariaLabel')}
          className={fab}
        >
          <span className={cn('block transition-transform duration-200', open && 'rotate-45')}>
            ＋
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Clear of the mobile bottom nav, which is fixed 56px tall on the dashboard.
 * Sitting at `bottom-4` would bury the button under it on the one page most
 * likely to be open when a thought arrives.
 */
const stack = 'fixed right-4 bottom-[72px] z-40 flex flex-col items-end gap-2';

const fab = cn(
  'flex h-12 w-12 items-center justify-center rounded-full',
  'border border-[var(--gold)] bg-[var(--panel)] text-[20px] leading-none text-[var(--gold)]',
  'shadow-[0_6px_20px_rgba(0,0,0,0.45),0_0_16px_var(--gold-glow)] transition-transform',
  'active:scale-95',
);

const item = cn(
  'flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)]',
  'py-1.5 pr-1.5 pl-3 text-[var(--text-hi)] shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
);

const itemIcon = cn(
  'flex h-8 w-8 items-center justify-center rounded-full text-[14px]',
  'border border-[var(--border)] bg-[var(--bg-2)]',
);
