'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { SkelBlock } from '@/components/ui/Skeleton';
import { GoldPanel } from '@/components/common/GoldPanel';
import { useUIStore } from '@/stores/ui.store';
import type { Wallet } from '@/types';

import { useWallets } from '../hooks/useWallets';
import { useDeleteWallet } from '../hooks/useDeleteWallet';
import { useCountUp } from '../hooks/useCountUp';
import { AMOUNT_MASK, formatCurrency } from '../utils';
import { useFinanceUIStore } from '../stores/finance-ui.store';
import { WalletList } from './WalletList';
import { WalletFormModal } from './WalletFormModal';
import { SepayConnectModal } from './SepayConnectModal';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function WalletsPage() {
  const t = useTranslations('finance');
  // ── Data ─────────────────────────────────────────────────────────────────────
  const { data: wallets = [], isLoading } = useWallets();
  const deleteWallet = useDeleteWallet();
  const addToast = useUIStore((s) => s.addToast);

  const totalBalance = useMemo(() => wallets.reduce((sum, w) => sum + w.balance, 0), [wallets]);
  const animatedBalance = useCountUp(totalBalance);
  const amountsHidden = useFinanceUIStore((s) => s.amountsHidden);
  const toggleAmountsHidden = useFinanceUIStore((s) => s.toggleAmountsHidden);

  // ── Modals ───────────────────────────────────────────────────────────────────
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [sepayWallet, setSepayWallet] = useState<Wallet | null>(null);
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);

  function handleDeleteConfirm() {
    if (!deletingWallet) return;
    deleteWallet.mutate(deletingWallet.id, {
      onSuccess: () => {
        addToast({
          type: 'success',
          message: t('accounts.deleted', { name: deletingWallet.name }),
        });
        setDeletingWallet(null);
      },
      onError: () => {
        addToast({ type: 'error', message: t('accounts.deleteFailed') });
        setDeletingWallet(null);
      },
    });
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="shrink-0"
        >
          <GoldPanel className="flex flex-wrap items-end justify-between gap-3 p-4">
            <div>
              <div className="text-[9px] tracking-[0.3em] text-[var(--gold)] [font-family:var(--f-title)]">
                {t('eyebrow')}
              </div>
              <h1 className="text-[22px] font-bold tracking-[0.03em] text-[var(--text-hi)] [font-family:var(--f-title)]">
                {t('accounts.title')}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[24px] font-bold tabular-nums text-[var(--gold)] [font-family:var(--f-title)]">
                  {amountsHidden ? AMOUNT_MASK : formatCurrency(animatedBalance)}
                </span>
                <button
                  type="button"
                  onClick={toggleAmountsHidden}
                  aria-label={amountsHidden ? t('overview.showAmounts') : t('overview.hideAmounts')}
                  aria-pressed={amountsHidden}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] text-[12px] text-[var(--text-mid)] transition-colors duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                >
                  {amountsHidden ? '🙈' : '👁'}
                </button>
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-[var(--text-lo)]">
                {t('accounts.subtitle', { count: wallets.length })}
              </div>
            </div>

            <Button variant="primary" onClick={() => setShowAddWallet(true)}>
              ＋ {t('accounts.addWallet')}
            </Button>
          </GoldPanel>
        </motion.div>

        {/* ── Accounts panel ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: EASE_OUT }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <GoldPanel background={false} className="flex min-h-0 flex-1 flex-col">
            <div className={panelHeader}>
              <span className={panelHeaderTitle}>{t('accounts.panel')}</span>
              <span className={panelHeaderOrnament}>◆ ◆ ◆</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <SkelBlock key={i} className="h-[132px] rounded-[var(--r-lg)]" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {wallets.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-[var(--r-lg)] border border-dashed border-[var(--border)] py-8 text-center">
                      <div className="text-[32px] opacity-60">🏦</div>
                      <div className="text-[13px] font-bold text-[var(--text-mid)]">
                        {t('accounts.empty')}
                      </div>
                      <div className="text-[11px] text-[var(--text-lo)]">
                        {t('accounts.emptyHint')}
                      </div>
                    </div>
                  ) : (
                    <WalletList
                      wallets={wallets}
                      amountsHidden={amountsHidden}
                      onEdit={setEditingWallet}
                      onDelete={setDeletingWallet}
                      onManageSepay={setSepayWallet}
                    />
                  )}
                </div>
              )}
            </div>
          </GoldPanel>
        </motion.div>
      </div>

      <WalletFormModal open={showAddWallet} onClose={() => setShowAddWallet(false)} />

      <WalletFormModal
        open={!!editingWallet}
        onClose={() => setEditingWallet(null)}
        wallet={editingWallet}
      />

      <SepayConnectModal wallet={sepayWallet} onClose={() => setSepayWallet(null)} />

      <Modal open={!!deletingWallet} onClose={() => setDeletingWallet(null)} maxWidth="380px">
        <ModalHead tag={t('accounts.deleteTag')} title={`🗑 ${t('accounts.deleteTitle')}`} />
        <ModalBody>
          <p className="text-[13px] leading-relaxed text-[var(--text-mid)]">
            {t('accounts.deleteBody', { name: deletingWallet?.name ?? '' })}
          </p>
        </ModalBody>
        <ModalFoot>
          <Button
            variant="ghost"
            onClick={() => setDeletingWallet(null)}
            disabled={deleteWallet.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            isLoading={deleteWallet.isPending}
            disabled={deleteWallet.isPending}
          >
            {t('common.delete')}
          </Button>
        </ModalFoot>
      </Modal>
    </>
  );
}

// ── Panel header (GoldPanel provides the frame; this is just the title row) ────

const panelHeader =
  'flex items-center gap-2 px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)]';
const panelHeaderTitle =
  'font-[var(--font-title)] text-[10px] font-bold tracking-[0.15em] text-[var(--gold)] uppercase flex-1';
const panelHeaderOrnament = 'text-[var(--gold-dim)] text-[8px] tracking-[3px] opacity-60';
