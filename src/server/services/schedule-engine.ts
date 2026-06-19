import { HabitModel } from '@/server/models/habit.model';
import { HabitLogModel } from '@/server/models/habit-log.model';
import { ScheduleBlockModel } from '@/server/models/schedule-block.model';
import { TaskModel } from '@/server/models/task.model';
import { QuestModel } from '@/server/models/quest.model';
import type { CalendarItem, CalendarStatus } from '@/types/calendar';
import type { HabitDay } from '@/types/habit';
import type { QuestType } from '@/types/quest';

// ─── Date helpers (local components — matches stats/habit-log convention) ───────

const DOW_TO_HABIT_DAY: HabitDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Parse "YYYY-MM-DD" to a local-midnight Date. */
function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

/** Stored Date → "YYYY-MM-DD" using local components. */
function toKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Inclusive list of "YYYY-MM-DD" keys between two date strings. */
export function dateKeysBetween(fromStr: string, toStr: string): string[] {
  return eachDay(fromStr, toStr).map((d) => d.key);
}

/** Inclusive list of day descriptors between two date strings. */
function eachDay(fromStr: string, toStr: string): Array<{ key: string; dow: HabitDay }> {
  const out: Array<{ key: string; dow: HabitDay }> = [];
  const cur = parseDate(fromStr);
  const end = parseDate(toStr);
  while (cur <= end) {
    out.push({ key: toKey(cur), dow: DOW_TO_HABIT_DAY[cur.getDay()]! });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** "HH:MM" + minutes → "HH:MM" (clamped to 23:59). */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(23 * 60 + 59, h! * 60 + m! + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ─── Quest visual mapping (quests have no color/icon field) ─────────────────────

const QUEST_META: Record<QuestType, { icon: string; color: string }> = {
  focus: { icon: '🎯', color: 'violet' },
  habit: { icon: '🔁', color: 'mint' },
  reflect: { icon: '📓', color: 'cyan' },
  admin: { icon: '🗂', color: 'amber' },
  create: { icon: '🎨', color: 'rose' },
  health: { icon: '💪', color: 'mint' },
  break: { icon: '☕', color: 'gold' },
};

// ─── Engine ─────────────────────────────────────────────────────────────────

/** Resolve a status given a planned date and whether the source is done. */
function resolveStatus(dayKey: string, todayKey: string, done: boolean): CalendarStatus {
  if (done) return 'done';
  return dayKey < todayKey ? 'missed' : 'planned';
}

export async function buildCalendar(
  userId: string,
  fromStr: string,
  toStr: string,
): Promise<CalendarItem[]> {
  const from = parseDate(fromStr);
  const toEnd = new Date(parseDate(toStr).getTime() + 86_400_000); // exclusive next midnight
  const todayKey = toKey(new Date());
  const days = eachDay(fromStr, toStr);

  const [habits, habitLogs, blocks] = await Promise.all([
    HabitModel.find({ userId, active: true }).lean(),
    HabitLogModel.find({ userId, date: { $gte: from, $lt: toEnd } }).lean(),
    ScheduleBlockModel.find({ userId, date: { $gte: from, $lt: toEnd } }).lean(),
  ]);

  // Source ids referenced by blocks
  const taskBlockIds = blocks.filter((b) => b.sourceType === 'task').map((b) => b.sourceId);
  const questBlockIds = blocks.filter((b) => b.sourceType === 'quest').map((b) => b.sourceId);

  const [tasks, quests] = await Promise.all([
    TaskModel.find({
      userId,
      active: true,
      $or: [{ _id: { $in: taskBlockIds } }, { startDate: { $gte: from, $lt: toEnd } }],
    }).lean(),
    QuestModel.find({
      userId,
      $or: [{ _id: { $in: questBlockIds } }, { dueDate: { $gte: from, $lt: toEnd } }],
    }).lean(),
  ]);

  const taskById = new Map(tasks.map((t) => [t._id.toString(), t]));
  const questById = new Map(quests.map((q) => [q._id.toString(), q]));

  // Lookup maps
  const habitLogDone = new Map(habitLogs.map((l) => [`${l.habitId}:${toKey(l.date)}`, l.done]));
  // habit occurrences replaced by a reschedule task that day
  const habitReplaced = new Set(
    tasks.filter((t) => t.habitRef).map((t) => `${t.habitRef!.toString()}:${toKey(t.startDate)}`),
  );
  const taskIdsWithBlock = new Set(taskBlockIds.map((id) => id.toString()));
  const questIdsWithBlock = new Set(questBlockIds.map((id) => id.toString()));

  const items: CalendarItem[] = [];

  // ── A. Habit occurrences ─────────────────────────────────────────────────
  for (const habit of habits) {
    const hid = habit._id.toString();
    for (const { key, dow } of days) {
      if (habitReplaced.has(`${hid}:${key}`)) continue; // a reschedule task owns this day

      const occurrences = habit.schedule
        .filter((e) => e.days.includes(dow))
        .map((e) => ({ time: e.time, duration: habit.duration ?? 0 }));

      for (const occ of occurrences) {
        const done = habitLogDone.get(`${hid}:${key}`) ?? false;
        items.push({
          id: `habit:${hid}:${key}`,
          title: habit.name,
          date: key,
          startTime: occ.time,
          endTime: occ.duration > 0 ? addMinutes(occ.time, occ.duration) : occ.time,
          duration: occ.duration,
          status: resolveStatus(key, todayKey, done),
          sourceType: 'habit',
          sourceId: hid,
          icon: habit.icon,
          color: habit.color,
        });
      }
    }
  }

  // ── B. Task items ────────────────────────────────────────────────────────
  // B1. From blocks
  for (const block of blocks) {
    if (block.sourceType !== 'task') continue;
    const task = taskById.get(block.sourceId.toString());
    if (!task) continue;
    const key = toKey(block.date);
    const done = block.status === 'done' || task.status === 'done';
    items.push({
      id: `block:${block._id.toString()}`,
      title: task.name,
      date: key,
      startTime: block.startTime,
      endTime: addMinutes(block.startTime, block.duration),
      duration: block.duration,
      status: block.status === 'missed' ? 'missed' : resolveStatus(key, todayKey, done),
      sourceType: 'task',
      sourceId: task._id.toString(),
      icon: task.icon,
      color: task.color,
      meta: { blockId: block._id.toString() },
    });
  }
  // B2. Fallback for tasks without blocks, placed on startDate
  for (const task of tasks) {
    if (taskIdsWithBlock.has(task._id.toString())) continue;
    const key = toKey(task.startDate);
    if (key < fromStr || key > toStr) continue;
    items.push({
      id: `task:${task._id.toString()}:${key}`,
      title: task.name,
      date: key,
      startTime: task.startTime ?? null,
      endTime: task.startTime ? addMinutes(task.startTime, task.duration ?? 0) : null,
      duration: task.duration ?? 0,
      status: resolveStatus(key, todayKey, task.status === 'done'),
      sourceType: 'task',
      sourceId: task._id.toString(),
      icon: task.icon,
      color: task.color,
    });
  }

  // ── C. Quest items ───────────────────────────────────────────────────────
  // C1. From blocks
  for (const block of blocks) {
    if (block.sourceType !== 'quest') continue;
    const quest = questById.get(block.sourceId.toString());
    if (!quest) continue;
    const key = toKey(block.date);
    const meta = QUEST_META[quest.type];
    items.push({
      id: `block:${block._id.toString()}`,
      title: quest.title,
      date: key,
      startTime: block.startTime,
      endTime: addMinutes(block.startTime, block.duration),
      duration: block.duration,
      status: block.status === 'missed' ? 'missed' : resolveStatus(key, todayKey, quest.done),
      sourceType: 'quest',
      sourceId: quest._id.toString(),
      icon: meta.icon,
      color: meta.color,
      meta: { blockId: block._id.toString() },
    });
  }
  // C2. Deadline-only quests (no block) → all-day item at dueDate
  for (const quest of quests) {
    if (questIdsWithBlock.has(quest._id.toString())) continue;
    const key = toKey(quest.dueDate);
    if (key < fromStr || key > toStr) continue;
    const meta = QUEST_META[quest.type];
    items.push({
      id: `quest:${quest._id.toString()}:${key}`,
      title: quest.title,
      date: key,
      startTime: null,
      endTime: null,
      duration: 0,
      status: resolveStatus(key, todayKey, quest.done),
      sourceType: 'quest',
      sourceId: quest._id.toString(),
      icon: meta.icon,
      color: meta.color,
      meta: { deadline: true },
    });
  }

  // Sort by date, then startTime (all-day/null last)
  items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.startTime === b.startTime) return 0;
    if (a.startTime === null) return 1;
    if (b.startTime === null) return -1;
    return a.startTime < b.startTime ? -1 : 1;
  });

  return items;
}
