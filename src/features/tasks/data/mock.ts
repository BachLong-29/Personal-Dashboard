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

  // ── Multi-day task fields ───────────────────────────────────────────────────
  /** True when endDate exists and spans ≥ 1 full calendar day after startDate */
  isMultiDay?: boolean;
  /** Total calendar days in the task range (inclusive) */
  totalDays?: number;
  /** Whether today's session has been logged (multi-day tasks only) */
  loggedToday?: boolean;
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

export const DIFF_LIST: TaskDiff[] = ['S', 'A', 'B', 'C', 'D'];

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
export function catOf(id: string): CatMeta {
  return TASK_CAT_MAP[id as TaskCat] ?? TASK_CATEGORIES[0]!;
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

// ─── Mock task data ───────────────────────────────────────────────────────────
export const MOCK_TASKS: UITask[] = [
  // TODAY (day=0)
  {
    id: 'q01',
    title: 'Plot the Solveig Codex',
    desc: 'Outline the next chapter of the design system — typography, color, motion tokens.',
    cat: 'create',
    diff: 'S',
    priority: 'critical',
    xp: 220,
    coins: 60,
    est: 120,
    deadline: 'Today · 18:00',
    deadlineUrgency: 'today',
    progress: 0.45,
    subtasks: 6,
    subtasksDone: 3,
    day: 0,
    slot: 'deep',
    tags: ['design-system', 'tokens', 'spec'],
    streak: 0,
    combo: 0,
    expandedNote: 'Ship the spec to Lior before EOD. The Codex unlocks the Forge Rite quest line.',
  },
  {
    id: 'q02',
    title: 'Morning Sigil Ritual',
    desc: "Hydrate, stretch, set the day's first intention.",
    cat: 'habit',
    diff: 'C',
    priority: 'low',
    xp: 60,
    coins: 18,
    est: 15,
    deadline: 'Today · 07:30',
    deadlineUrgency: 'done',
    progress: 1,
    subtasks: 4,
    subtasksDone: 4,
    day: 0,
    slot: 'morning',
    tags: ['routine', 'mind'],
    streak: 14,
    combo: 3,
    done: true,
  },
  {
    id: 'q03',
    title: 'Deep Work — Solo Dungeon',
    desc: 'Two hours sealed off. Phone in the void, deep focus on the spec.',
    cat: 'focus',
    diff: 'A',
    priority: 'high',
    xp: 180,
    coins: 45,
    est: 120,
    deadline: 'Today · 11:00',
    deadlineUrgency: 'now',
    progress: 0.7,
    subtasks: 0,
    subtasksDone: 0,
    day: 0,
    slot: 'deep',
    tags: ['focus', '2h'],
    streak: 6,
    combo: 2,
    expandedNote: 'Active session — 38 min remaining. Streak +6.',
  },
  {
    id: 'q04',
    title: 'Mentor Sync · Kai',
    desc: 'Weekly 1:1 with mentor. Bring the three open questions.',
    cat: 'social',
    diff: 'C',
    priority: 'medium',
    xp: 80,
    coins: 20,
    est: 30,
    deadline: 'Today · 14:00',
    deadlineUrgency: 'today',
    progress: 0,
    subtasks: 3,
    subtasksDone: 0,
    day: 0,
    slot: 'afternoon',
    tags: ['mentor', 'weekly'],
    streak: 0,
    combo: 0,
  },
  {
    id: 'q05',
    title: 'Clear the Inbox Wilds',
    desc: 'Process all messages. Reach inbox zero before the sun sets.',
    cat: 'admin',
    diff: 'B',
    priority: 'medium',
    xp: 90,
    coins: 25,
    est: 45,
    deadline: 'Today · 17:00',
    deadlineUrgency: 'today',
    progress: 0.2,
    subtasks: 0,
    subtasksDone: 0,
    day: 0,
    slot: 'afternoon',
    tags: ['admin', 'email'],
    streak: 0,
    combo: 0,
  },
  {
    id: 'q06',
    title: 'Twilight Reflection',
    desc: "Journal three wins, one lesson, tomorrow's pact.",
    cat: 'reflect',
    diff: 'C',
    priority: 'low',
    xp: 70,
    coins: 18,
    est: 15,
    deadline: 'Today · 21:30',
    deadlineUrgency: 'evening',
    progress: 0,
    subtasks: 3,
    subtasksDone: 0,
    day: 0,
    slot: 'evening',
    tags: ['journal', 'wind-down'],
    streak: 11,
    combo: 4,
  },
  {
    id: 'q07',
    title: 'Walk the Outer Path',
    desc: '30-minute walk. No earbuds. Notice five textures.',
    cat: 'health',
    diff: 'D',
    priority: 'low',
    xp: 50,
    coins: 12,
    est: 30,
    deadline: 'Today · 18:30',
    deadlineUrgency: 'evening',
    progress: 0,
    subtasks: 0,
    subtasksDone: 0,
    day: 0,
    slot: 'evening',
    tags: ['body', 'outside'],
    streak: 4,
    combo: 1,
  },

  // REST OF THE WEEK
  {
    id: 'q08',
    title: 'Forge the Quest Card v3',
    desc: 'Iterate the card layout with the new XP curve.',
    cat: 'create',
    diff: 'A',
    priority: 'high',
    xp: 180,
    coins: 50,
    est: 180,
    deadline: 'Tue · 16:00',
    deadlineUrgency: 'soon',
    progress: 0,
    subtasks: 5,
    subtasksDone: 0,
    day: 1,
    slot: 'deep',
    tags: ['design', 'ship'],
    streak: 0,
    combo: 0,
  },
  {
    id: 'q09',
    title: 'Strength Trial · Pull Day',
    desc: 'Gym session. Track the lift log.',
    cat: 'health',
    diff: 'B',
    priority: 'medium',
    xp: 100,
    coins: 24,
    est: 60,
    deadline: 'Tue · 07:00',
    deadlineUrgency: 'soon',
    progress: 0,
    subtasks: 0,
    subtasksDone: 0,
    day: 1,
    slot: 'morning',
    tags: ['body', 'gym'],
    streak: 8,
    combo: 2,
  },
  {
    id: 'q10',
    title: 'Council Sync · Guild',
    desc: 'Standup with the design guild. Demo the new tokens.',
    cat: 'social',
    diff: 'C',
    priority: 'medium',
    xp: 80,
    coins: 18,
    est: 45,
    deadline: 'Wed · 10:00',
    deadlineUrgency: 'soon',
    progress: 0,
    subtasks: 0,
    subtasksDone: 0,
    day: 2,
    slot: 'morning',
    tags: ['sync', 'demo'],
    streak: 0,
    combo: 0,
  },
  {
    id: 'q11',
    title: 'Read · The Lantern Codex (ch 4)',
    desc: '30 pages. Highlight three insights.',
    cat: 'reflect',
    diff: 'D',
    priority: 'low',
    xp: 50,
    coins: 12,
    est: 40,
    deadline: 'Wed · 21:00',
    deadlineUrgency: 'soon',
    progress: 0,
    subtasks: 0,
    subtasksDone: 0,
    day: 2,
    slot: 'evening',
    tags: ['read', 'learn'],
    streak: 9,
    combo: 3,
  },
  {
    id: 'q12',
    title: 'Trial of the Long Focus',
    desc: '4-hour deep block. No context switching.',
    cat: 'focus',
    diff: 'S',
    priority: 'critical',
    xp: 280,
    coins: 72,
    est: 240,
    deadline: 'Thu · 09:00',
    deadlineUrgency: 'soon',
    progress: 0,
    subtasks: 0,
    subtasksDone: 0,
    day: 3,
    slot: 'deep',
    tags: ['focus', '4h'],
    streak: 0,
    combo: 0,
  },
  {
    id: 'q13',
    title: 'Ship the Onboarding Flow',
    desc: 'Hand off final screens to engineering.',
    cat: 'create',
    diff: 'A',
    priority: 'high',
    xp: 200,
    coins: 55,
    est: 150,
    deadline: 'Thu · 17:00',
    deadlineUrgency: 'soon',
    progress: 0,
    subtasks: 4,
    subtasksDone: 0,
    day: 3,
    slot: 'afternoon',
    tags: ['ship', 'handoff'],
    streak: 0,
    combo: 0,
  },
  {
    id: 'q14',
    title: 'Forge Tools · Audit Plugins',
    desc: 'Trim the bloated Figma toolbelt. Keep only the worthy.',
    cat: 'admin',
    diff: 'C',
    priority: 'low',
    xp: 60,
    coins: 15,
    est: 30,
    deadline: 'Fri · 11:00',
    deadlineUrgency: 'later',
    progress: 0,
    subtasks: 0,
    subtasksDone: 0,
    day: 4,
    slot: 'morning',
    tags: ['admin', 'tools'],
    streak: 0,
    combo: 0,
  },
  {
    id: 'q15',
    title: 'Weekly Reflection Rite',
    desc: "Write the week's chapter. Three wins, one trial, next compass.",
    cat: 'reflect',
    diff: 'B',
    priority: 'high',
    xp: 140,
    coins: 36,
    est: 45,
    deadline: 'Fri · 18:00',
    deadlineUrgency: 'later',
    progress: 0,
    subtasks: 3,
    subtasksDone: 0,
    day: 4,
    slot: 'evening',
    tags: ['weekly', 'journal'],
    streak: 7,
    combo: 5,
    expandedNote: 'Combo bonus active: +50% XP if completed before Sat.',
  },
  {
    id: 'q16',
    title: 'Long Walk — Forest Path',
    desc: '90-minute walk, journal three notes after.',
    cat: 'health',
    diff: 'C',
    priority: 'low',
    xp: 80,
    coins: 20,
    est: 90,
    deadline: 'Sat · 09:00',
    deadlineUrgency: 'later',
    progress: 0,
    subtasks: 0,
    subtasksDone: 0,
    day: 5,
    slot: 'morning',
    tags: ['body', 'weekend'],
    streak: 0,
    combo: 0,
  },
  {
    id: 'q17',
    title: 'Salon with Mira & Theo',
    desc: 'Dinner. Bring the new sketchbook.',
    cat: 'social',
    diff: 'D',
    priority: 'low',
    xp: 60,
    coins: 18,
    est: 180,
    deadline: 'Sat · 19:00',
    deadlineUrgency: 'later',
    progress: 0,
    subtasks: 0,
    subtasksDone: 0,
    day: 5,
    slot: 'evening',
    tags: ['bonds', 'social'],
    streak: 0,
    combo: 0,
  },
  {
    id: 'q18',
    title: 'Sabbath · Idle Day',
    desc: 'No quests. Rest is a stat.',
    cat: 'habit',
    diff: 'D',
    priority: 'low',
    xp: 40,
    coins: 10,
    est: 480,
    deadline: 'Sun · all day',
    deadlineUrgency: 'later',
    progress: 0,
    subtasks: 0,
    subtasksDone: 0,
    day: 6,
    slot: 'morning',
    tags: ['rest'],
    streak: 11,
    combo: 0,
  },
  {
    id: 'q19',
    title: 'Plan the Week Ahead',
    desc: 'Set the compass: three pillars, one quest line.',
    cat: 'reflect',
    diff: 'B',
    priority: 'high',
    xp: 120,
    coins: 30,
    est: 45,
    deadline: 'Sun · 19:00',
    deadlineUrgency: 'later',
    progress: 0,
    subtasks: 4,
    subtasksDone: 0,
    day: 6,
    slot: 'evening',
    tags: ['plan', 'weekly'],
    streak: 8,
    combo: 0,
  },

  // LATER THIS MONTH
  {
    id: 'q20',
    title: 'Quest Line — Aetheria v2',
    desc: 'Multi-week saga. Ship the entire v2 redesign.',
    cat: 'create',
    diff: 'S',
    priority: 'critical',
    xp: 480,
    coins: 140,
    est: 1200,
    deadline: 'May 28',
    deadlineUrgency: 'month',
    progress: 0.3,
    subtasks: 12,
    subtasksDone: 4,
    day: 14,
    slot: 'deep',
    tags: ['epic', 'saga'],
    streak: 0,
    combo: 0,
    saga: true,
  },
  {
    id: 'q21',
    title: 'Public Talk · Local Meetup',
    desc: '20-min talk on gamified productivity.',
    cat: 'social',
    diff: 'A',
    priority: 'high',
    xp: 220,
    coins: 60,
    est: 240,
    deadline: 'May 22',
    deadlineUrgency: 'month',
    progress: 0.1,
    subtasks: 5,
    subtasksDone: 1,
    day: 9,
    slot: 'evening',
    tags: ['talk', 'public'],
    streak: 0,
    combo: 0,
  },
  {
    id: 'q22',
    title: 'Pilgrimage · Mountain Day',
    desc: 'Full day hike. No screens.',
    cat: 'health',
    diff: 'B',
    priority: 'medium',
    xp: 180,
    coins: 50,
    est: 480,
    deadline: 'May 25',
    deadlineUrgency: 'month',
    progress: 0,
    subtasks: 0,
    subtasksDone: 0,
    day: 12,
    slot: 'morning',
    tags: ['body', 'outside'],
    streak: 0,
    combo: 0,
  },
  {
    id: 'q23',
    title: 'Codex Review · v1.2',
    desc: 'Quarterly review of the personal codex.',
    cat: 'reflect',
    diff: 'A',
    priority: 'high',
    xp: 200,
    coins: 55,
    est: 90,
    deadline: 'May 30',
    deadlineUrgency: 'month',
    progress: 0,
    subtasks: 6,
    subtasksDone: 0,
    day: 16,
    slot: 'afternoon',
    tags: ['review', 'quarterly'],
    streak: 0,
    combo: 0,
  },
];

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
