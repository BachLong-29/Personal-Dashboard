'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { CommandPalette, type CommandGroup } from '@/components/ui/CommandPalette';
import { useUIStore } from '@/stores/ui.store';

import { useFinanceCategories } from '../hooks/useFinanceCategories';
import { useWallets } from '../hooks/useWallets';
import { parseQuickEntry, type QuickEntryDraft } from '../quick-entry';
import { formatCurrency } from '../utils';
import { TransactionFormModal } from './TransactionFormModal';

/**
 * Ctrl/Cmd + Shift + A opens a one-line "quick add transaction" palette from anywhere in
 * the protected app — reuses the same CommandPalette shell as Global Search, and the same
 * parseQuickEntry()/TransactionFormModal draft flow already used on the Finance Overview
 * page, so there's nothing new to learn and no separate code path to keep in sync.
 */
export function QuickAddTransaction() {
  const open = useUIStore((s) => s.quickAddTransactionOpen);
  const closeQuickAddTransaction = useUIStore((s) => s.closeQuickAddTransaction);
  const t = useTranslations('finance');

  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useFinanceCategories();

  const [text, setText] = useState('');
  const [pendingDraft, setPendingDraft] = useState<QuickEntryDraft | null>(null);

  const draft = useMemo(
    () => parseQuickEntry(text, wallets, categories),
    [text, wallets, categories],
  );

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey || e.key.toLowerCase() !== 'a') return;

      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTyping) return;

      const store = useUIStore.getState();
      if (store.searchOpen || store.quickAddTaskOpen || store.quickAddTransactionOpen) return;

      e.preventDefault();
      store.openQuickAddTransaction();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  const handleClosePalette = () => {
    setText('');
    closeQuickAddTransaction();
  };

  const handleCloseModal = () => {
    setPendingDraft(null);
    setText('');
  };

  const groups: CommandGroup[] = useMemo(() => {
    if (!draft) return [];
    const categoryName = categories.find((c) => c.id === draft.categoryId)?.name;
    const icon = categories.find((c) => c.id === draft.categoryId)?.icon ?? '➕';
    const sign = draft.type === 'income' ? '+' : '−';
    const label = [`${sign}${formatCurrency(draft.amount)}`, draft.note || undefined, categoryName]
      .filter(Boolean)
      .join(' · ');

    return [
      {
        items: [
          {
            key: 'quick-add',
            icon,
            label,
            onSelect: () => setPendingDraft(draft),
          },
        ],
      },
    ];
  }, [draft, categories]);

  return (
    <>
      <CommandPalette
        open={open}
        onClose={handleClosePalette}
        groups={groups}
        query={text}
        onQueryChange={setText}
        disableFilter
        placeholder={t('overview.quickAddPlaceholder')}
        emptyLabel={t('overview.quickAddHelp')}
      />

      <TransactionFormModal
        open={!!pendingDraft}
        onClose={handleCloseModal}
        wallets={wallets}
        categories={categories}
        draft={pendingDraft}
      />
    </>
  );
}
