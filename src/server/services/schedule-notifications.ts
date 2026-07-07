import mongoose from 'mongoose';

import { NotificationModel } from '@/server/models/notification.model';
import { DEFAULT_SCHEDULE_SETTINGS, UserSettingModel } from '@/server/models/user-setting.model';
import { buildCalendar } from '@/server/services/schedule-engine';
import { computeCapacity, detectConflicts } from '@/server/services/schedule-insights';

interface PendingNotification {
  type: 'reminder' | 'deadline' | 'overload' | 'conflict';
  title: string;
  message: string;
  dedupeKey: string;
  expiresAt: Date;
}

function toKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function timeToMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Lazily upsert schedule-derived notifications for the current day window.
 * Idempotent via dedupeKey — safe to call on every notifications read.
 */
export async function generateScheduleNotifications(userId: string): Promise<void> {
  const setting = await UserSettingModel.findOne({ userId }).lean();
  const sched = setting?.schedule ?? DEFAULT_SCHEDULE_SETTINGS;

  const today = new Date();
  const todayKey = toKey(today);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  // Window covers today + deadline look-ahead
  const lookAhead = new Date(today);
  lookAhead.setDate(lookAhead.getDate() + (sched.deadlineWarningDays ?? 1));
  const toKeyAhead = toKey(lookAhead);

  const items = await buildCalendar(userId, todayKey, toKeyAhead);
  const todayItems = items.filter((i) => i.date === todayKey);

  const pending: PendingNotification[] = [];
  const minutesNow = nowMinutes();

  // ── Reminders — upcoming timed items today, not done ─────────────────────
  for (const item of todayItems) {
    if (item.status !== 'planned' || item.startTime === null) continue;
    if (item.sourceType === 'task') continue; // reminders for habit/quest only
    const start = timeToMinutes(item.startTime);
    const lead = item.sourceType === 'habit' ? sched.habitReminderLead : sched.questReminderLead;
    if (start < minutesNow) continue; // already past
    pending.push({
      type: 'reminder',
      title: `⏰ ${item.title}`,
      message: `Sắp tới lúc ${item.startTime}${lead ? ` (nhắc trước ${lead} phút)` : ''}`,
      dedupeKey: `reminder:${item.id}`,
      expiresAt: endOfToday,
    });
  }

  // ── Deadline warnings — quests/tasks due within the look-ahead window ────
  for (const item of items) {
    const isDeadline = item.meta?.deadline || item.sourceType === 'task';
    if (!isDeadline || item.status === 'done') continue;
    if (item.date < todayKey || item.date > toKeyAhead) continue;
    const when = item.date === todayKey ? 'hôm nay' : `ngày ${item.date}`;
    pending.push({
      type: 'deadline',
      title: `⚠ Đến hạn: ${item.title}`,
      message: `"${item.title}" đến hạn ${when}`,
      dedupeKey: `deadline:${item.sourceType}:${item.sourceId}`,
      expiresAt: endOfToday,
    });
  }

  // ── Overload warning — today's capacity ──────────────────────────────────
  const [capacity] = computeCapacity(todayItems, [todayKey], sched.dailyCapacityMinutes ?? 600);
  if (capacity && capacity.status === 'overloaded') {
    const h = (n: number) => (n / 60).toFixed(1).replace(/\.0$/, '');
    pending.push({
      type: 'overload',
      title: '🔥 Ngày quá tải',
      message: `Hôm nay đã lên ${h(capacity.plannedMinutes)}h / ${h(capacity.availableMinutes)}h khả dụng`,
      dedupeKey: `overload:${todayKey}`,
      expiresAt: endOfToday,
    });
  }

  // ── Conflict warnings — today's hard conflicts ───────────────────────────
  const conflicts = detectConflicts(todayItems, sched.minBreakMinutes ?? 15);
  for (const c of conflicts.filter((x) => x.type === 'hard')) {
    pending.push({
      type: 'conflict',
      title: '✕ Trùng lịch',
      message: `${c.a.title} (${c.a.startTime}) trùng giờ ${c.b.title} (${c.b.startTime})`,
      dedupeKey: `conflict:${todayKey}:${c.a.id}:${c.b.id}`,
      expiresAt: endOfToday,
    });
  }

  if (pending.length === 0) return;

  const uid = new mongoose.Types.ObjectId(userId);
  await Promise.all(
    pending.map((n) =>
      NotificationModel.updateOne(
        { userId: uid, dedupeKey: n.dedupeKey },
        {
          $setOnInsert: {
            userId: uid,
            type: n.type,
            title: n.title,
            message: n.message,
            dedupeKey: n.dedupeKey,
            expiresAt: n.expiresAt,
            isRead: false,
          },
        },
        { upsert: true },
      ),
    ),
  );
}
