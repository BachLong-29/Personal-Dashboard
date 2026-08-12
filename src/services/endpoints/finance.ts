import { apiClient } from '@/libs/axios';
import type {
  ApiResponse,
  Wallet,
  CreateWalletPayload,
  UpdateWalletPayload,
  FinanceCategory,
  CreateFinanceCategoryPayload,
  Transaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  TransactionFilters,
  SepayStatus,
  SepayKeyResult,
} from '@/types';

function toQueryString(filters?: TransactionFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.walletId) params.set('walletId', filters.walletId);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.type) params.set('type', filters.type);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const financeEndpoints = {
  listWallets: () => apiClient.get<ApiResponse<Wallet[]>>('/finance/wallets'),

  createWallet: (payload: CreateWalletPayload) =>
    apiClient.post<ApiResponse<Wallet>>('/finance/wallets', payload),

  updateWallet: (id: string, payload: UpdateWalletPayload) =>
    apiClient.patch<ApiResponse<Wallet>>(`/finance/wallets/${id}`, payload),

  removeWallet: (id: string) => apiClient.delete<ApiResponse<null>>(`/finance/wallets/${id}`),

  getSepayStatus: (walletId: string) =>
    apiClient.get<ApiResponse<SepayStatus>>(`/finance/wallets/${walletId}/sepay`),

  generateSepayKey: (walletId: string) =>
    apiClient.patch<ApiResponse<SepayKeyResult>>(`/finance/wallets/${walletId}/sepay`),

  listCategories: (type?: 'income' | 'expense') =>
    apiClient.get<ApiResponse<FinanceCategory[]>>(
      `/finance/categories${type ? `?type=${type}` : ''}`,
    ),

  createCategory: (payload: CreateFinanceCategoryPayload) =>
    apiClient.post<ApiResponse<FinanceCategory>>('/finance/categories', payload),

  removeCategory: (id: string) => apiClient.delete<ApiResponse<null>>(`/finance/categories/${id}`),

  listTransactions: (filters?: TransactionFilters) =>
    apiClient.get<ApiResponse<Transaction[]>>(`/finance/transactions${toQueryString(filters)}`),

  createTransaction: (payload: CreateTransactionPayload) =>
    apiClient.post<ApiResponse<Transaction>>('/finance/transactions', payload),

  updateTransaction: (id: string, payload: UpdateTransactionPayload) =>
    apiClient.patch<ApiResponse<Transaction>>(`/finance/transactions/${id}`, payload),

  removeTransaction: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/finance/transactions/${id}`),
};
