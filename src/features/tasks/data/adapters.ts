// ─────────────────────────────────────────────────────────────────────────────
//  Task Management — API → UITask adapters
// ─────────────────────────────────────────────────────────────────────────────

import type { Task, Habit, HabitLog, TaskLog } from '@/types';

import type { UITask, TaskCat, TaskSlot } from './mock';

// Minimal shape shared by both @/types Quest and dashboard/types Quest
export interface QuestLike {
  id: string;
  title: string;
  desc: string;
  type: string;
  difficulty: string;
  xp: number;
  coins: number;
  done: boolean;
  tags: string[];
  dueDate?: string;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Days from today to the given ISO date string (negative = past) */
export function dayOffset(dateStr?: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

/** Human-readable deadline label */
export function formatDeadline(dateStr?: string): string {
  if (!dateStr) return '–';
  const offset = dayOffset(dateStr);
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  if (offset === -1) return 'Yesterday';
  if (offset < 0) return `${Math.abs(offset)}d ago`;
  if (offset <= 7)
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Deadline urgency token used by urgencyColors */
export function computeUrgency(dateStr?: string, done?: boolean): string {
  if (done) return 'done';
  if (!dateStr) return 'later';
  const offset = dayOffset(dateStr);
  if (offset < 0) return 'overdue';
  if (offset === 0) return 'today';
  if (offset <= 2) return 'soon';
  if (offset <= 7) return 'week';
  return 'later';
}

// ─── Mapping tables ───────────────────────────────────────────────────────────

const QUEST_TYPE_TO_CAT: Record<string, TaskCat> = {
  focus:   'focus',
  habit:   'habit',
  reflect: 'reflect',
  admin:   'admin',
  create:  'create',
  health:  'health',
  break:   'reflect',
  task:    'focus', // dashboard/types has 'task' as a QuestType
};

const COLOR_TO_CAT: Record<string, TaskCat> = {
  cyan:   'focus',
  mint:   'create',
  gold:   'habit',
  violet: 'reflect',
  rose:   'admin',
  amber:  'create',
  blue:   'focus',
};

// ─── Task → UITask ────────────────────────────────────────────────────────────

export function taskToUITask(t: Task, taskLog?: TaskLog): UITask {
  const startOffset = dayOffset(t.startDate);
  const endOffset   = t.endDate ? dayOffset(t.endDate) : startOffset;
  const totalDays   = Math.max(endOffset - startOffset + 1, 1);

  // A task is "multi-day" when it spans more than 1 calendar day
  const isMultiDay = totalDays > 1;

  // Multi-day task active today: clamp day to 0 so it appears in the day view
  const isActiveToday = isMultiDay && startOffset <= 0 && endOffset >= 0;
  const day           = isActiveToday ? 0 : startOffset;

  const loggedToday = isMultiDay ? !!taskLog : undefined;

  // "Done" for day-view purposes:
  //   - single-day: reflects task status
  //   - multi-day active today: true when today is logged OR task was explicitly completed
  //   - multi-day NOT active today (past / future): reflects overall status only
  //     → prevents a stale loggedToday from marking future-day slots as done
  const done = isMultiDay
    ? isActiveToday
      ? ((loggedToday ?? false) || t.status === 'done')
      : t.status === 'done'
    : t.status === 'done';

  const progress =
    t.status === 'done'        ? 1 :
    t.status === 'in_progress' ? 0.5 : 0;

  // Deadline label for multi-day tasks shows the full range
  const deadlineStr = t.endDate || t.startDate;
  const deadline = isMultiDay
    ? `${formatDeadline(t.startDate)} → ${formatDeadline(t.endDate)}`
    : formatDeadline(deadlineStr);

  return {
    id:              t.id,
    sourceId:        t.id,
    source:          'task',
    title:           t.name,
    desc:            t.note ?? '',
    cat:             COLOR_TO_CAT[t.color] ?? 'focus',
    diff:            'B',
    priority:        'medium',
    xp:              100,
    coins:           25,
    est:             t.duration ?? 60,
    deadline,
    deadlineUrgency: computeUrgency(deadlineStr, t.status === 'done'),
    progress,
    subtasks:        0,
    subtasksDone:    0,
    day,
    slot:            offsetToSlot(day, t.startTime),
    tags:            [],
    streak:          0,
    combo:           0,
    done,
    // raw API fields
    icon:            t.icon,
    status:          t.status,
    color:           t.color,
    tagId:           t.tagId,
    dependencies:    t.dependencies,
    startDate:       t.startDate,
    endDate:         t.endDate,
    startTime:       t.startTime,
    habitRef:        t.habitRef,
    active:          t.active,
    // multi-day extras
    isMultiDay,
    totalDays: isMultiDay ? totalDays : undefined,
    loggedToday,
  };
}

// ─── Quest → UITask ───────────────────────────────────────────────────────────

export function questToUITask(q: QuestLike): UITask {
  const offset = dayOffset(q.dueDate);

  return {
    id:              q.id,
    sourceId:        q.id,
    source:          'quest',
    title:           q.title,
    desc:            q.desc,
    cat:             QUEST_TYPE_TO_CAT[q.type] ?? 'focus',
    diff:            q.difficulty as UITask['diff'],
    priority:        diffToPriority(q.difficulty),
    xp:              q.xp,
    coins:           q.coins,
    est:             60,
    deadline:        formatDeadline(q.dueDate),
    deadlineUrgency: computeUrgency(q.dueDate, q.done),
    progress:        q.done ? 1 : 0,
    subtasks:        0,
    subtasksDone:    0,
    day:             offset,
    slot:            offsetToSlot(offset),
    tags:            q.tags,
    streak:          0,
    combo:           0,
    done:            q.done,
    endDate:         q.dueDate,
  };
}

// ─── Habit → UITask ───────────────────────────────────────────────────────────

/** Day-of-week (Date.getDay()) → HabitDay string */
const DOW_TO_HABIT_DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/** Returns the HabitScheduleEntry that covers today, or undefined */
export function getTodayEntry(h: Habit) {
  const today = DOW_TO_HABIT_DAY[new Date().getDay()];
  return h.schedule.find((e) => today && e.days.includes(today));
}

/** Returns true if the habit is scheduled for today */
export function isHabitScheduledToday(h: Habit): boolean {
  return getTodayEntry(h) !== undefined;
}

export function habitToUITask(h: Habit, log?: HabitLog, cancelled = false): UITask {
  const done      = log?.done ?? false;
  const entry     = getTodayEntry(h);
  const timeLabel = entry?.time ? `Today · ${entry.time}` : 'Today';

  return {
    id:              `habit-${h.id}`,
    sourceId:        h.id,
    source:          'habit',
    title:           `${h.icon} ${h.name}`,
    desc:            h.note ?? '',
    cat:             'habit',
    diff:            'C',
    priority:        'medium',
    xp:              50,
    coins:           12,
    est:             h.duration ?? 15,
    deadline:        done ? 'Done · Today' : timeLabel,
    deadlineUrgency: done ? 'done' : 'today',
    progress:        done ? 1 : 0,
    subtasks:        0,
    subtasksDone:    0,
    day:             0,
    slot:            timeToSlot(entry?.time),
    tags:            [],
    streak:          0,
    combo:           0,
    done,
    icon:            h.icon,
    color:           h.color,
    tagId:           h.tagId,
    startTime:       entry?.time,
    active:          h.active,
    cancelled,
  };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function diffToPriority(diff: string): UITask['priority'] {
  if (diff === 'S') return 'critical';
  if (diff === 'A') return 'high';
  if (diff === 'B') return 'medium';
  return 'low';
}

/** Map offset + optional explicit startTime to a TaskSlot */
function offsetToSlot(offset: number, startTime?: string): TaskSlot {
  if (offset !== 0) return 'morning';
  // If the task has an explicit scheduled time, use that hour for slot mapping
  const h = startTime
    ? parseInt(startTime.split(':')[0] ?? '0', 10)
    : new Date().getHours();
  if (h < 10)  return 'morning';
  if (h < 13)  return 'deep';
  if (h < 17)  return 'afternoon';
  return 'evening';
}

/** Map a "HH:MM" time string to the slot it falls in */
function timeToSlot(time?: string): TaskSlot {
  if (!time) return 'morning';
  const h = parseInt(time.split(':')[0] ?? '0', 10);
  if (h < 10) return 'morning';
  if (h < 13) return 'deep';
  if (h < 17) return 'afternoon';
  return 'evening';
}
