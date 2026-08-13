import type mongoose from 'mongoose';

import { BudgetModel, type IBudget } from '@/server/models/budget.model';
import { FinanceCategoryModel } from '@/server/models/finance-category.model';
import { TransactionModel } from '@/server/models/transaction.model';

export interface BudgetWithSpent {
  id: string;
  categoryId: string | null;
  categoryName: string;
  month: string;
  limit: number;
  recurring: boolean;
  spent: number;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

/** "YYYY-MM" → first/last day of that month, as Date objects (UTC midnight). */
export function monthRange(month: string): { from: Date; to: Date } {
  const parts = month.split('-');
  const year = Number(parts[0]);
  const mo = Number(parts[1]);
  return { from: new Date(Date.UTC(year, mo - 1, 1)), to: new Date(Date.UTC(year, mo, 0)) };
}

function budgetKey(categoryId?: mongoose.Types.ObjectId): string {
  return categoryId ? categoryId.toString() : 'overall';
}

/**
 * The budgets in effect for `month`: explicit budgets set for that exact
 * month, plus the most recent still-active recurring budget per category
 * from an earlier month (only when that month has no explicit override).
 */
async function resolveActiveBudgets(userId: string, month: string): Promise<IBudget[]> {
  const explicit = await BudgetModel.find({ userId, month });
  const covered = new Set(explicit.map((b) => budgetKey(b.categoryId)));

  const recurringCandidates = await BudgetModel.find({
    userId,
    recurring: true,
    month: { $lt: month },
  }).sort({ month: -1 });

  const inherited: IBudget[] = [];
  for (const b of recurringCandidates) {
    const key = budgetKey(b.categoryId);
    if (covered.has(key)) continue;
    covered.add(key);
    inherited.push(b);
  }

  return [...explicit, ...inherited];
}

/** Budgets active in a month, with `spent`/`percentage` derived from that month's expense transactions. */
export async function listBudgetsWithSpent(
  userId: string,
  month: string,
): Promise<BudgetWithSpent[]> {
  const budgets = await resolveActiveBudgets(userId, month);
  if (budgets.length === 0) return [];

  const { from, to } = monthRange(month);
  const expenses = await TransactionModel.find({
    userId,
    type: 'expense',
    date: { $gte: from, $lte: to },
  }).lean();

  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
  const spentByCategory = new Map<string, number>();
  for (const t of expenses) {
    const key = t.categoryId.toString();
    spentByCategory.set(key, (spentByCategory.get(key) ?? 0) + t.amount);
  }

  const categoryIds = budgets
    .map((b) => b.categoryId)
    .filter((id): id is mongoose.Types.ObjectId => !!id);
  const categories = categoryIds.length
    ? await FinanceCategoryModel.find({ _id: { $in: categoryIds } }).lean()
    : [];
  const categoryById = new Map(categories.map((c) => [c._id.toString(), c.name]));

  return budgets
    .map((b) => {
      const categoryId = b.categoryId?.toString() ?? null;
      const spent = categoryId ? (spentByCategory.get(categoryId) ?? 0) : totalSpent;
      const categoryName = categoryId ? (categoryById.get(categoryId) ?? 'Unknown') : 'Overall';
      return {
        id: b._id.toString(),
        categoryId,
        categoryName,
        // Always the month being viewed, even for a budget inherited from an earlier
        // recurring entry — `spent` above is computed against this month too.
        month,
        limit: b.limit,
        recurring: b.recurring,
        spent,
        percentage: Math.round((spent / b.limit) * 100),
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      } satisfies BudgetWithSpent;
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
