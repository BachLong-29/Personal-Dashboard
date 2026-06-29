// ─────────────────────────────────────────────────────────────────────────────
//  Task Management — Mock data + types (UI layer)
// ─────────────────────────────────────────────────────────────────────────────

export type TaskSlot = 'morning' | 'deep' | 'afternoon' | 'evening';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskCat = 'focus' | 'create' | 'habit' | 'reflect' | 'admin' | 'health' | 'social';
export type TaskDiff = 'S' | 'A' | 'B' | 'C' | 'D';

/** Which API entity this task was derived from */
export type UITaskSource = 'task' | 'quest' | 'habit' | 'mock';

export interface UITask {
  id: string;
  title: string;
  desc: string;
  cat: TaskCat;
  diff: TaskDiff;
  priority: TaskPriority;
  xp: number;
  coins: number;
  est: number; // minutes
  deadline: string;
  deadlineUrgency: string;
  progress: number; // 0–1
  subtasks: number;
  subtasksDone: number;
  day: number; // offset from today (0 = today)
  slot: TaskSlot;
  tags: string[];
  streak: number;
  combo: number;
  done?: boolean;
  expandedNote?: string;
  saga?: boolean;
  // ── Fields from real API entities ──────────────────────────────────────────
  /** Original entity ID before any prefix transform */
  sourceId?: string;
  /** Which API entity this was mapped from */
  source?: UITaskSource;
  /** Task/Habit icon glyph */
  icon?: string;
  /** Raw API status (Tasks only) */
  status?: 'todo' | 'in_progress' | 'pending' | 'waiting' | 'done';
  /** Color token from the API */
  color?: string;
  /** Task dependencies (Task only) */
  dependencies?: string[];
  /** ISO date – when this task/quest starts */
  startDate?: string;
  /** ISO date – when this task/quest ends / is due */
  endDate?: string;
  /** Whether the source entity is active */
  active?: boolean;
  /** Reason the task was deferred to a later date */
  deferReason?: string;
  /** tagId from the API entity — needed to create replacement tasks */
  tagId?: string;
  /** HH:MM scheduled time (task with startTime, or habit schedule time) */
  startTime?: string;
  /** Habit ObjectId this task replaces (source === 'task' && habitRef set) */
  habitRef?: string;
  /** Habit occurrence was cancelled — a replacement task exists for this day */
  cancelled?: boolean;
  /** Cloudinary image URLs attached to this task (max 3) */
  attachments?: string[];

  // ── Project tagging ─────────────────────────────────────────────────────────
  /** Project ObjectId this task belongs to (omitted for standalone tasks) */
  projectId?: string;
  /** Resolved project name — shown as a label on the card */
  projectName?: string;
  /** Resolved project icon glyph */
  projectIcon?: string;
  /** Resolved project color token (TaskColor) */
  projectColor?: string;

  // ── Multi-day task fields ───────────────────────────────────────────────────
  /** True when endDate exists and spans ≥ 1 full calendar day after startDate */
  isMultiDay?: boolean;
  /** Total calendar days in the task range (inclusive) */
  totalDays?: number;
  /** Whether today's session has been logged (multi-day tasks only) */
  loggedToday?: boolean;
  /** Overdue escalation level — null when not overdue or done */
  overdueLevel?: 'late' | 'critical' | 'failed' | null;
}

// ─── Category meta ────────────────────────────────────────────────────────────
export interface CatMeta {
  id: TaskCat;
  label: string;
  color: string;
  icon: string;
  desc: string;
}

export const TASK_CATEGORIES: CatMeta[] = [
  { id: 'focus', label: 'Focus', color: 'cyan', icon: '◈', desc: 'Deep work' },
  { id: 'create', label: 'Forge', color: 'mint', icon: '✦', desc: 'Build & ship' },
  { id: 'habit', label: 'Ritual', color: 'gold', icon: '◉', desc: 'Daily habits' },
  { id: 'reflect', label: 'Insight', color: 'violet', icon: '✧', desc: 'Reflect & plan' },
  { id: 'admin', label: 'Errands', color: 'rose', icon: '✕', desc: 'Admin & ops' },
  { id: 'health', label: 'Vitality', color: 'mint', icon: '❀', desc: 'Body & rest' },
  { id: 'social', label: 'Bonds', color: 'violet', icon: '✷', desc: 'People' },
];

export const TASK_CAT_MAP = Object.fromEntries(TASK_CATEGORIES.map((c) => [c.id, c])) as Record<
  TaskCat,
  CatMeta
>;

// ─── Priority meta ────────────────────────────────────────────────────────────
export interface PriMeta {
  label: string;
  color: string;
  token: string;
}

export const PRIORITIES: Record<TaskPriority, PriMeta> = {
  critical: { label: 'Critical', color: 'rose', token: '▲▲▲' },
  high: { label: 'High', color: 'gold', token: '▲▲' },
  medium: { label: 'Medium', color: 'cyan', token: '▲' },
  low: { label: 'Low', color: 'mint', token: '·' },
};

// export const DIFF_LIST: TaskDiff[] = ['S', 'A', 'B', 'C', 'D'];

// ─── Slot meta ────────────────────────────────────────────────────────────────
export interface SlotMeta {
  id: TaskSlot;
  label: string;
  time: string;
  glyph: string;
  /** CSS color value for the slot accent */
  color: string;
  /** CSS color with low opacity — used for tinted backgrounds */
  bg: string;
}

export const SLOTS: SlotMeta[] = [
  {
    id: 'morning',
    label: 'Dawn',
    time: '06–10',
    glyph: '◐',
    color: 'oklch(0.74 0.17 85)',
    bg: 'oklch(0.74 0.17 85 / 0.07)',
  },
  {
    id: 'deep',
    label: 'Deep Work',
    time: '10–13',
    glyph: '❖',
    color: 'oklch(0.66 0.22 295)',
    bg: 'oklch(0.66 0.22 295 / 0.07)',
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    time: '13–17',
    glyph: '☉',
    color: 'oklch(0.76 0.16 205)',
    bg: 'oklch(0.76 0.16 205 / 0.07)',
  },
  {
    id: 'evening',
    label: 'Twilight',
    time: '17–22',
    glyph: '☾',
    color: 'oklch(0.72 0.18 5)',
    bg: 'oklch(0.72 0.18 5 / 0.07)',
  },
];

// ─── Week day meta ────────────────────────────────────────────────────────────
export interface WeekDayMeta {
  idx: number;
  short: string;
  label: string;
}

export const WEEK_DAYS: WeekDayMeta[] = [
  { idx: 0, short: 'Mon', label: 'Monday' },
  { idx: 1, short: 'Tue', label: 'Tuesday' },
  { idx: 2, short: 'Wed', label: 'Wednesday' },
  { idx: 3, short: 'Thu', label: 'Thursday' },
  { idx: 4, short: 'Fri', label: 'Friday' },
  { idx: 5, short: 'Sat', label: 'Saturday' },
  { idx: 6, short: 'Sun', label: 'Sunday' },
];

// ─── Schedule strip ───────────────────────────────────────────────────────────
export interface ScheduleEntry {
  time: string;
  endTime: string;
  label: string;
  taskId: string;
  done: boolean;
  active: boolean;
}

export const TODAY_SCHEDULE: ScheduleEntry[] = [
  {
    time: '06:30',
    endTime: '07:00',
    label: 'Morning Sigil Ritual',
    taskId: 'q02',
    done: true,
    active: false,
  },
  {
    time: '09:00',
    endTime: '11:00',
    label: 'Deep Work · Dungeon',
    taskId: 'q03',
    done: false,
    active: true,
  },
  {
    time: '11:30',
    endTime: '13:30',
    label: 'Plot the Solveig Codex',
    taskId: 'q01',
    done: false,
    active: false,
  },
  {
    time: '14:00',
    endTime: '14:30',
    label: 'Mentor Sync · Kai',
    taskId: 'q04',
    done: false,
    active: false,
  },
  {
    time: '16:00',
    endTime: '16:45',
    label: 'Clear the Inbox Wilds',
    taskId: 'q05',
    done: false,
    active: false,
  },
  {
    time: '18:30',
    endTime: '19:00',
    label: 'Walk the Outer Path',
    taskId: 'q07',
    done: false,
    active: false,
  },
  {
    time: '21:30',
    endTime: '21:45',
    label: 'Twilight Reflection',
    taskId: 'q06',
    done: false,
    active: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const [DEFAULT_CAT] = TASK_CATEGORIES;
export function catOf(id: string): CatMeta {
  return TASK_CAT_MAP[id as TaskCat] ?? DEFAULT_CAT;
}

export function priOf(id: string): PriMeta {
  return PRIORITIES[id as TaskPriority] ?? PRIORITIES.medium;
}

export function fmtEst(mins: number): string {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

// ─── Color token → CSS variable ───────────────────────────────────────────────
export const COLOR_VAR: Record<string, string> = {
  gold: 'var(--gold)',
  mint: 'var(--mint)',
  violet: 'var(--violet)',
  cyan: 'var(--cyan)',
  rose: 'var(--rose)',
  amber: 'oklch(0.76 0.16 55)',
};

// ─── Activity feed ────────────────────────────────────────────────────────────
export interface ActivityItem {
  icon: string;
  text: string;
  ts: string;
  kind: string;
}

export const ACTIVITY: ActivityItem[] = [
  { icon: '✓', text: 'Morning Sigil Ritual cleared', ts: '07:02', kind: 'done' },
  { icon: '⚡', text: 'Streak +14 · combo ×3 active', ts: '07:02', kind: 'streak' },
  { icon: '◈', text: 'Deep Work session started', ts: '09:00', kind: 'start' },
  { icon: '✦', text: '+180 XP · +45 ◎ awarded', ts: '09:00', kind: 'xp' },
];
