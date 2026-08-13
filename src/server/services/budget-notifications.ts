import mongoose from 'mongoose';

import { NotificationModel } from '@/server/models/notification.model';
import { enforceNotificationCap } from '@/server/services/notification-cleanup';
import { listBudgetsWithSpent } from '@/server/services/finance-budget';

// In-process throttle, same rationale as generateScheduleNotifications: this
// re-sums a month of transactions, so skip repeat work within the window.
const REGEN_THROTTLE_MS = 5 * 60 * 1000;
const lastGeneratedAt = new Map<string, number>();

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')}₫`;
}

/**
 * Lazily upsert a "Budget Exceeded" notification for any of this month's
 * budgets at >= 100% spent. Idempotent via dedupeKey — safe to call on every
 * budgets-list read. Only checks the *current* month, per spec.
 */
export async function generateBudgetNotifications(userId: string): Promise<void> {
  const lastRun = lastGeneratedAt.get(userId);
  if (lastRun !== undefined && Date.now() - lastRun < REGEN_THROTTLE_MS) return;
  lastGeneratedAt.set(userId, Date.now());

  const month = currentMonthKey();
  const budgets = await listBudgetsWithSpent(userId, month);
  const exceeded = budgets.filter((b) => b.percentage >= 100);
  if (exceeded.length === 0) return;

  const uid = new mongoose.Types.ObjectId(userId);
  await Promise.all(
    exceeded.map((b) => {
      const dedupeKey = `budget:${b.id}:${b.month}`;
      const over = b.spent - b.limit;
      return NotificationModel.updateOne(
        { userId: uid, dedupeKey },
        {
          $setOnInsert: {
            userId: uid,
            type: 'system',
            title: '⚠ Budget Exceeded',
            message: `${b.categoryName} vượt ngân sách ${formatVnd(over)} (${b.percentage}%)`,
            dedupeKey,
            isRead: false,
          },
        },
        { upsert: true },
      );
    }),
  );

  await enforceNotificationCap(uid);
}
