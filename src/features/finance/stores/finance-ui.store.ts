import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FinanceUIState {
  /** Privacy toggle for balances across all Finance pages — shared + persisted. */
  amountsHidden: boolean;
  toggleAmountsHidden: () => void;
}

export const useFinanceUIStore = create<FinanceUIState>()(
  persist(
    (set) => ({
      amountsHidden: false,
      toggleAmountsHidden: () => set((s) => ({ amountsHidden: !s.amountsHidden })),
    }),
    { name: 'finance-ui-storage' },
  ),
);
