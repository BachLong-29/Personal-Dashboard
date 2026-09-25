import mongoose from 'mongoose';

import { FinanceCategoryModel } from '@/server/models/finance-category.model';
import { NotificationModel } from '@/server/models/notification.model';
import { TransactionModel } from '@/server/models/transaction.model';
import { UserSettingModel } from '@/server/models/user-setting.model';
import { WalletModel } from '@/server/models/wallet.model';
import { enforceNotificationCap } from '@/server/services/notification-cleanup';

// In-process throttle, same rationale as generateBudgetNotifications: this
// runs three queries, and every notification-list read would otherwise redo
// them. Losing the throttle on a cold serverless instance only costs one
// extra pass — the upsert below is idempotent either way.
const REGEN_THROTTLE_MS = 5 * 60 * 1000;
const lastGeneratedAt = new Map<string, number>();

/**
 * Names worth chasing the first time, matched against the user's own finance
 * categories. Substrings, lower-cased: "ăn" is meant to catch "Ăn sáng",
 * "Ăn trưa" and "Ăn tối" as three separate things to remember.
 */
const DEFAULT_CATEGORY_KEYWORDS = ['giữ xe', 'xăng', 'cafe', 'coffee', 'ăn', 'church', 'nhà thờ'];

interface CategoryLite {
  _id: mongoose.Types.ObjectId;
  name: string;
}

/**
 * Which categories this reminder covers.
 *
 * `undefined` means the user has never opened the setting, so the defaults are
 * derived from their own category names. An empty array means they looked and
 * chose none, which is honoured as-is.
 */
export function resolveCashLogCategoryIds(
  stored: mongoose.Types.ObjectId[] | undefined,
  categories: CategoryLite[],
): mongoose.Types.ObjectId[] {
  if (stored !== undefined) return stored;

  return categories
    .filter((c) => {
      const name = c.name.toLowerCase();
      return DEFAULT_CATEGORY_KEYWORDS.some((keyword) => name.includes(keyword));
    })
    .map((c) => c._id);
}

/** Wall-clock parts in a given IANA zone, or in UTC if the zone is unusable. */
function zonedParts(date: Date, timeZone: string): { date: string; minutes: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
  } catch {
    // A stored timezone can be anything the user typed. Falling back beats
    // throwing inside a best-effort generator.
    return zonedParts(date, 'UTC');
  }

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00';
  // `hour12: false` yields 24 rather than 0 for midnight in some engines.
  const hour = Number(get('hour')) % 24;

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: hour * 60 + Number(get('minute')),
  };
}

/** Offset of a zone from UTC at a given instant, in minutes. */
function zoneOffsetMinutes(date: Date, timeZone: string): number {
  const { date: day, minutes } = zonedParts(date, timeZone);
  const [y = 0, m = 1, d = 1] = day.split('-').map(Number);
  const asUtc = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  // Seconds are dropped on both sides, so round to the nearest minute.
  return Math.round((asUtc - date.getTime()) / 60_000);
}

function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Upsert one "write down today's cash" notification per day, listing only the
 * categories that have no cash spending recorded yet.
 *
 * Idempotent via dedupeKey, so it is safe to call on every notification read.
 * Silent when there is nothing to chase: a reminder that fires on a day the
 * user already did the work is a reminder they learn to ignore.
 */
export async function generateCashLogNotifications(userId: string): Promise<void> {
  const lastRun = lastGeneratedAt.get(userId);
  if (lastRun !== undefined && Date.now() - lastRun < REGEN_THROTTLE_MS) return;
  lastGeneratedAt.set(userId, Date.now());

  const uid = new mongoose.Types.ObjectId(userId);
  const setting = await UserSettingModel.findOne({ userId: uid }).lean();
  if (!setting?.cashLog?.enabled) return;

  const now = new Date();
  const timeZone = setting.timezone || 'UTC';
  const { date: today, minutes: nowMinutes } = zonedParts(now, timeZone);
  if (nowMinutes < toMinutes(setting.cashLog.time)) return;

  const categories = await FinanceCategoryModel.find({ userId: uid, type: 'expense' })
    .select('_id name')
    .lean();
  const watchedIds = resolveCashLogCategoryIds(setting.cashLog.categoryIds, categories);
  if (watchedIds.length === 0) return;

  // Cash only: bank and e-wallet spending arrives through the SePay webhook
  // without anyone typing it, which is the whole reason this reminder exists.
  const cashWallets = await WalletModel.find({ userId: uid, type: 'cash' }).select('_id').lean();

  // The day's bounds as absolute instants, so the query matches the user's
  // day rather than the server's.
  const offset = zoneOffsetMinutes(now, timeZone);
  const [y = 0, m = 1, d = 1] = today.split('-').map(Number);
  const dayStart = new Date(Date.UTC(y, m - 1, d) - offset * 60_000);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000);

  const logged =
    cashWallets.length === 0
      ? []
      : await TransactionModel.find({
          userId: uid,
          type: 'expense',
          walletId: { $in: cashWallets.map((w) => w._id) },
          date: { $gte: dayStart, $lt: dayEnd },
        })
          .select('categoryId')
          .lean();

  const loggedIds = new Set(logged.map((t) => t.categoryId.toString()));
  const watched = new Set(watchedIds.map((id) => id.toString()));
  const missing = categories.filter(
    (c) => watched.has(c._id.toString()) && !loggedIds.has(c._id.toString()),
  );
  if (missing.length === 0) return;

  const names = missing.map((c) => c.name).join(' · ');
  const dedupeKey = `cash-log:${today}`;

  await NotificationModel.updateOne(
    { userId: uid, dedupeKey },
    {
      $setOnInsert: {
        userId: uid,
        type: 'cash-log',
        title: '💵 Log today’s cash',
        message: `Nothing recorded yet for: ${names}`,
        dedupeKey,
        // Still there tomorrow morning if the app was never opened tonight.
        expiresAt: new Date(dayEnd.getTime() + 24 * 60 * 60_000),
      },
    },
    { upsert: true },
  );

  await enforceNotificationCap(uid);
}
