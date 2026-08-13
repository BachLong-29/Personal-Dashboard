import { FinanceCategoryModel } from '@/server/models/finance-category.model';
import { TransactionModel } from '@/server/models/transaction.model';

import { monthRange } from './finance-budget';

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
  type: 'income' | 'expense';
  amount: number;
  note?: string;
  date: string;
}

export interface FinanceOverview {
  month: string;
  income: number;
  expense: number;
  /** income − expense (can be negative) */
  net: number;
  /** null when there was no income that month — a rate would be meaningless. */
  savingsRate: number | null;
  spentToday: number;
  spentWeek: number;
  daysInMonth: number;
  /** Days remaining in the month including today; 0 for past months. */
  daysLeft: number;
  topCategories: OverviewCategorySlice[];
  recent: OverviewTransaction[];
}

/** "YYYY-MM-DD" for a Date, using the same UTC-day convention as stored transaction dates. */
function dayKey(date: Date): string {
  return date.toISOString().substring(0, 10);
}

/** Monday-based start of the week containing `today`, as a "YYYY-MM-DD" key. */
function weekStartKey(today: string): string {
  const d = new Date(`${today}T00:00:00.000Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Mon = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return dayKey(d);
}

/**
 * Month totals for the Finance overview — income/expense/savings, spend pace, top expense
 * categories and the latest transactions. Everything is derived from the transaction ledger;
 * nothing here is stored.
 *
 * `today` is the caller's local date ("YYYY-MM-DD") so "spent today" matches the date the user
 * would pick in the transaction form, rather than the server's UTC day.
 */
export async function getFinanceOverview(
  userId: string,
  month: string,
  today: string,
): Promise<FinanceOverview> {
  const { from, to } = monthRange(month);

  const transactions = await TransactionModel.find({
    userId,
    date: { $gte: from, $lte: to },
  })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const weekStart = weekStartKey(today);

  let income = 0;
  let expense = 0;
  let spentToday = 0;
  let spentWeek = 0;
  const expenseByCategory = new Map<string, number>();

  for (const t of transactions) {
    if (t.type === 'income') {
      income += t.amount;
      continue;
    }

    expense += t.amount;

    const key = t.categoryId.toString();
    expenseByCategory.set(key, (expenseByCategory.get(key) ?? 0) + t.amount);

    const day = dayKey(t.date);
    if (day === today) spentToday += t.amount;
    if (day >= weekStart && day <= today) spentWeek += t.amount;
  }

  const categoryIds = Array.from(expenseByCategory.keys());
  const categories = categoryIds.length
    ? await FinanceCategoryModel.find({ _id: { $in: categoryIds } }).lean()
    : [];
  const categoryById = new Map(categories.map((c) => [c._id.toString(), c]));

  const topCategories: OverviewCategorySlice[] = Array.from(expenseByCategory.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([categoryId, amount]) => {
      const category = categoryById.get(categoryId);
      return {
        categoryId,
        name: category?.name ?? 'Unknown',
        icon: category?.icon ?? '📦',
        color: category?.color ?? 'gold',
        amount,
        percentage: expense > 0 ? Math.round((amount / expense) * 100) : 0,
      };
    });

  const daysInMonth = to.getUTCDate();
  const monthOfToday = today.substring(0, 7);
  const daysLeft =
    monthOfToday === month
      ? daysInMonth - Number(today.substring(8, 10)) + 1
      : month > monthOfToday
        ? daysInMonth
        : 0;

  return {
    month,
    income,
    expense,
    net: income - expense,
    savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : null,
    spentToday,
    spentWeek,
    daysInMonth,
    daysLeft,
    topCategories,
    recent: transactions.slice(0, 5).map((t) => ({
      id: t._id.toString(),
      walletId: t.walletId.toString(),
      categoryId: t.categoryId.toString(),
      type: t.type,
      amount: t.amount,
      note: t.note,
      date: dayKey(t.date),
    })),
  };
}
