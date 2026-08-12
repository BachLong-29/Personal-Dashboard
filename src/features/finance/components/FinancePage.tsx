'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { GoldPanel } from '@/components/common/GoldPanel';
import DashboardTopbar from '@/features/dashboard/components/layout/DashboardTopbar';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { buildEmptyChar, profileToCharacter } from '@/features/dashboard/utils/character.utils';
import type { Character } from '@/features/dashboard/types';
import type { Transaction, TransactionType, Wallet } from '@/types';

import { useWallets } from '../hooks/useWallets';
import { useFinanceCategories } from '../hooks/useFinanceCategories';
import { useTransactions } from '../hooks/useTransactions';
import { useCountUp } from '../hooks/useCountUp';
import { formatCurrency } from '../utils';
import { WalletStrip } from './WalletStrip';
import { FinanceFilters } from './FinanceFilters';
import { TransactionList } from './TransactionList';
import { WalletFormModal } from './WalletFormModal';
import { TransactionFormModal } from './TransactionFormModal';
import { SepayConnectModal } from './SepayConnectModal';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function FinancePage() {
  // ── Character for the topbar ────────────────────────────────────────────────
  const { data: profileData } = useProfile();
  const charInitialized = useRef(false);
  const [char, setChar] = useState<Character>(() => buildEmptyChar());
  useEffect(() => {
    const profile = profileData?.profile;
    if (!profile || charInitialized.current) return;
    setChar(profileToCharacter(profile));
    charInitialized.current = true;
  }, [profileData]);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // ── Data ─────────────────────────────────────────────────────────────────────
  const { data: wallets = [], isLoading: walletsLoading } = useWallets();
  const { data: categories = [] } = useFinanceCategories();

  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [categoryId, setCategoryId] = useState('');

  const { data: transactions = [], isLoading: txLoading } = useTransactions({
    walletId: selectedWalletId ?? undefined,
    type: type === 'all' ? undefined : type,
    categoryId: categoryId || undefined,
    search: search || undefined,
  });

  const totalBalance = useMemo(() => wallets.reduce((sum, w) => sum + w.balance, 0), [wallets]);
  const animatedBalance = useCountUp(totalBalance);

  // ── Modals ───────────────────────────────────────────────────────────────────
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showAddTx, setShowAddTx] = useState(false);
  const [sepayWallet, setSepayWallet] = useState<Wallet | null>(null);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg)]">
      <DashboardTopbar char={char} dateStr={dateStr} />

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
                CASH FLOW
              </div>
              <h1 className="text-[22px] font-bold tracking-[0.03em] text-[var(--text-hi)] [font-family:var(--f-title)]">
                Finance
              </h1>
              <div className="mt-1 text-[24px] font-bold tabular-nums text-[var(--gold)] [font-family:var(--f-title)]">
                {formatCurrency(animatedBalance)}
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => setShowAddTx(true)}
              disabled={wallets.length === 0}
            >
              ＋ Add Transaction
            </Button>
          </GoldPanel>
        </motion.div>

        {/* ── Ledger panel ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: EASE_OUT }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <GoldPanel background={false} className="flex min-h-0 flex-1 flex-col">
            <div className={panelHeader}>
              <span className={panelHeaderTitle}>Ledger</span>
              <span className={panelHeaderOrnament}>◆ ◆ ◆</span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
              {/* Wallets */}
              {!walletsLoading && (
                <WalletStrip
                  wallets={wallets}
                  selectedId={selectedWalletId}
                  onSelect={setSelectedWalletId}
                  onAddWallet={() => setShowAddWallet(true)}
                  onManageSepay={setSepayWallet}
                />
              )}

              {wallets.length === 0 && !walletsLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 rounded-[var(--r-lg)] border border-dashed border-[var(--border)] py-10 text-center"
                >
                  <div className="text-[32px] opacity-60">🏦</div>
                  <div className="text-[13px] font-bold text-[var(--text-mid)]">No wallets yet</div>
                  <div className="text-[11px] text-[var(--text-lo)]">
                    Add a wallet to start tracking your cash flow.
                  </div>
                </motion.div>
              )}

              {/* Filters */}
              <FinanceFilters
                search={search}
                onSearchChange={setSearch}
                type={type}
                onTypeChange={setType}
                categoryId={categoryId}
                onCategoryChange={setCategoryId}
                categories={categories}
              />

              {/* Transactions */}
              <TransactionList
                transactions={transactions}
                categories={categories}
                wallets={wallets}
                isLoading={txLoading}
                onEdit={setEditingTx}
              />
            </div>
          </GoldPanel>
        </motion.div>
      </div>

      <WalletFormModal open={showAddWallet} onClose={() => setShowAddWallet(false)} />

      <SepayConnectModal wallet={sepayWallet} onClose={() => setSepayWallet(null)} />

      <TransactionFormModal
        open={showAddTx}
        onClose={() => setShowAddTx(false)}
        wallets={wallets}
        categories={categories}
        defaultWalletId={selectedWalletId}
      />

      <TransactionFormModal
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        wallets={wallets}
        categories={categories}
        transaction={editingTx}
      />
    </div>
  );
}

// ── Panel header (GoldPanel provides the frame; this is just the title row) ────

const panelHeader =
  'flex items-center gap-2 px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)]';
const panelHeaderTitle =
  'font-[var(--font-title)] text-[10px] font-bold tracking-[0.15em] text-[var(--gold)] uppercase flex-1';
const panelHeaderOrnament = 'text-[var(--gold-dim)] text-[8px] tracking-[3px] opacity-60';
