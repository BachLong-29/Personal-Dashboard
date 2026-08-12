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
