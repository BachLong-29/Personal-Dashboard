import type mongoose from 'mongoose';

import { NotificationModel } from '@/server/models/notification.model';

const DEFAULT_CAP = 60;

/**
 * Keep a user's notification table bounded without ever silently dropping
 * something they haven't seen yet. Evicts the oldest *read* notifications
 * first; only trims unread ones as a last resort if read notifications alone
 * can't bring the total back under the cap (otherwise the table would grow
 * unbounded for a user who never dismisses anything).
 */
export async function enforceNotificationCap(
  userId: mongoose.Types.ObjectId,
  cap = DEFAULT_CAP,
): Promise<void> {
  const total = await NotificationModel.countDocuments({ userId });
  const overBy = total - cap;
  if (overBy <= 0) return;

  const readOverflow = await NotificationModel.find({ userId, isRead: true })
    .sort({ createdAt: 1 })
    .limit(overBy)
    .select('_id')
    .lean();

  if (readOverflow.length > 0) {
    await NotificationModel.deleteMany({ _id: { $in: readOverflow.map((n) => n._id) } });
  }

  const remainingOverBy = overBy - readOverflow.length;
  if (remainingOverBy <= 0) return;

  // Still over cap with nothing but unread notifications left — trim the
  // oldest unread ones too, otherwise storage grows without bound.
  const unreadOverflow = await NotificationModel.find({ userId })
    .sort({ createdAt: 1 })
    .limit(remainingOverBy)
    .select('_id')
    .lean();

  if (unreadOverflow.length > 0) {
    await NotificationModel.deleteMany({ _id: { $in: unreadOverflow.map((n) => n._id) } });
  }
}
