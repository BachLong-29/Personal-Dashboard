import type { TaskColor } from './task';

export type WalletType = 'bank' | 'cash' | 'ewallet';
export type FinanceCategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'manual' | 'sepay' | 'recurring';

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  icon: string;
  color: TaskColor;
  currency: string;
  balance: number;
  bankCode?: string;
  bankAccountNumber?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletPayload {
  name: string;
  type: WalletType;
  icon: string;
  color: TaskColor;
  currency?: string;
  bankCode?: string;
  bankAccountNumber?: string;
}

export interface UpdateWalletPayload {
  name?: string;
  icon?: string;
  color?: TaskColor;
  bankCode?: string | null;
  bankAccountNumber?: string | null;
}

export interface SepayStatus {
  configured: boolean;
  connected: boolean;
  webhookUrl: string;
}

export interface SepayKeyResult {
  apiKey: string;
  webhookUrl: string;
}

export interface FinanceCategory {
  id: string;
  userId: string;
  name: string;
  type: FinanceCategoryType;
  icon: string;
  color: TaskColor;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinanceCategoryPayload {
  name: string;
  type: FinanceCategoryType;
  icon: string;
  color: TaskColor;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  note?: string;
  date: string;
  source: TransactionSource;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionPayload {
  walletId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  note?: string;
  date: string;
}

export interface UpdateTransactionPayload {
  walletId?: string;
  categoryId?: string;
  type?: TransactionType;
  amount?: number;
  note?: string | null;
  date?: string;
}

export interface TransactionFilters {
  walletId?: string;
  categoryId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  search?: string;
}

export interface Budget {
  id: string;
  /** null = overall (all-expense) budget for the month */
  categoryId: string | null;
  categoryName: string;
  month: string;
  limit: number;
  /** True if this budget also applies to every later month with no override. */
  recurring: boolean;
  /** Derived from expense transactions in `month` — not stored. */
  spent: number;
  /** round(spent / limit * 100) */
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetPayload {
  /** Omit for the overall (all-expense) budget */
  categoryId?: string;
  month: string;
  limit: number;
  /** Apply to every month after `month` too, until overridden. Default false. */
  recurring?: boolean;
}

export interface UpdateBudgetPayload {
  limit: number;
}

export interface OverviewCategorySlice {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  /** Share of the month's total expense, rounded. */
  percentage: number;
}

export interface OverviewTransaction {
  id: string;
  walletId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  note?: string;
  date: string;
}

/** Month totals for the overview dashboard — all derived from the ledger, none of it stored. */
export interface FinanceOverview {
  month: string;
  income: number;
  expense: number;
  net: number;
  /** null when there was no income that month. */
  savingsRate: number | null;
  spentToday: number;
  spentWeek: number;
  daysInMonth: number;
  /** Days remaining in the month including today; 0 for past months. */
  daysLeft: number;
  topCategories: OverviewCategorySlice[];
  recent: OverviewTransaction[];
}

export type FinanceGoalStatus = 'active' | 'completed' | 'archived';

/** A savings goal with its funding progress for a given month. */
export interface FinanceGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  progress: number;
  targetDate: string | null;
  status: FinanceGoalStatus;
  monthsLeft: number | null;
  requiredMonthly: number | null;
  requiredDaily: number | null;
  contributedThisMonth: number;
  unallocatedThisMonth: number;
  onTrack: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinanceGoalPayload {
  name: string;
  icon: string;
  color: TaskColor;
  targetAmount: number;
  targetDate?: string;
}

export interface UpdateFinanceGoalPayload {
  name?: string;
  icon?: string;
  color?: TaskColor;
  targetAmount?: number;
  targetDate?: string | null;
  status?: 'active' | 'archived';
}

export interface CreateContributionPayload {
  amount: number;
  date?: string;
  note?: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface ForecastPoint {
  month: string;
  balance: number;
  actual: boolean;
}

export interface BalanceForecast {
  current: number;
  avgNet: number;
  basedOnMonths: number;
  points: ForecastPoint[];
}

export interface UpdateFinanceCategoryPayload {
  name?: string;
  icon?: string;
  color?: TaskColor;
}
