'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { SkelBlock } from '@/components/ui/Skeleton';
import { GoldPanel } from '@/components/common/GoldPanel';
import { useUIStore } from '@/stores/ui.store';
import type { Budget } from '@/types';

import { useBudgets } from '../hooks/useBudgets';
import { useFinanceCategories } from '../hooks/useFinanceCategories';
import { useDeleteBudget } from '../hooks/useDeleteBudget';
import { currentMonthKey, formatMonthLabel } from '../utils';
import { BudgetFormModal } from './BudgetFormModal';
import { BudgetList } from './BudgetList';
import { FinancePageHeader } from './FinancePageHeader';
import { MonthStepper } from './MonthStepper';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function BudgetPage() {
  const t = useTranslations('finance');
  const locale = useLocale();
  const [month, setMonth] = useState(currentMonthKey());
  const { data: budgets = [], isLoading } = useBudgets(month);
  const { data: expenseCategories = [] } = useFinanceCategories('expense');
  const deleteBudget = useDeleteBudget();
  const addToast = useUIStore((s) => s.addToast);

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  const canCreate = month >= currentMonthKey();
  const existingCategoryIds = budgets.map((b) => b.categoryId);

  function handleEdit(budget: Budget) {
    setEditingBudget(budget);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingBudget(null);
    setShowForm(true);
  }

  function handleDeleteConfirm() {
    if (!deletingBudget) return;
    deleteBudget.mutate(deletingBudget.id, {
      onSuccess: () => {
        addToast({ type: 'success', message: t('budget.deleted') });
        setDeletingBudget(null);
      },
      onError: () => {
        addToast({ type: 'error', message: t('budget.deleteFailed') });
        setDeletingBudget(null);
      },
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="shrink-0"
      >
        <FinancePageHeader
          title={t('budget.title')}
          hideTitleOnMobile
          controls={
            <MonthStepper
              month={month}
              onChange={setMonth}
              className="h-9 w-full justify-between sm:h-auto sm:w-auto sm:justify-start"
            />
          }
          action={{
            label: t('budget.setBudget'),
            onClick: handleAdd,
            disabled: !canCreate,
            title: canCreate ? undefined : t('budget.pastMonth'),
          }}
        />
      </motion.div>

      {/* ── Budgets panel ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: EASE_OUT }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <GoldPanel background={false} className="flex min-h-0 flex-1 flex-col">
          <div className={panelHeader}>
            <span className={panelHeaderTitle}>{t('budget.panel')}</span>
            <span className={panelHeaderOrnament}>◆ ◆ ◆</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[0, 1].map((i) => (
                  <SkelBlock key={i} className="h-[132px] rounded-[var(--r-lg)]" />
                ))}
              </div>
            ) : budgets.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-[var(--r-lg)] border border-dashed border-[var(--border)] py-10 text-center">
                <div className="text-[32px] opacity-60">🧾</div>
                <div className="text-[13px] font-bold text-[var(--text-mid)]">
                  {t('budget.empty', { month: formatMonthLabel(month, locale) })}
                </div>
                <div className="text-[11px] text-[var(--text-lo)]">{t('budget.emptyHint')}</div>
              </div>
            ) : (
              <BudgetList
                budgets={budgets}
                categories={expenseCategories}
                onEdit={handleEdit}
                onDelete={setDeletingBudget}
              />
            )}
          </div>
        </GoldPanel>
      </motion.div>

      <BudgetFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        month={month}
        categories={expenseCategories}
        existingCategoryIds={existingCategoryIds}
        budget={editingBudget}
      />

      <Modal open={!!deletingBudget} onClose={() => setDeletingBudget(null)} maxWidth="380px">
        <ModalHead tag={t('budget.deleteTag')} title={`🗑 ${t('budget.deleteTitle')}`} />
        <ModalBody>
          <p className="text-[13px] leading-relaxed text-[var(--text-mid)]">
            {t('budget.confirmDelete', {
              name: deletingBudget?.categoryId ? deletingBudget.categoryName : t('budget.overall'),
              month: formatMonthLabel(month, locale),
            })}
          </p>
        </ModalBody>
        <ModalFoot>
          <Button
            variant="ghost"
            onClick={() => setDeletingBudget(null)}
            disabled={deleteBudget.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            isLoading={deleteBudget.isPending}
            disabled={deleteBudget.isPending}
          >
            {t('common.delete')}
          </Button>
        </ModalFoot>
      </Modal>
    </div>
  );
}

// ── Panel header (GoldPanel provides the frame; this is just the title row) ────

const panelHeader =
  'flex items-center gap-2 px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)]';
const panelHeaderTitle =
  'font-[var(--font-title)] text-[10px] font-bold tracking-[0.15em] text-[var(--gold)] uppercase flex-1';
const panelHeaderOrnament = 'text-[var(--gold-dim)] text-[8px] tracking-[3px] opacity-60';
