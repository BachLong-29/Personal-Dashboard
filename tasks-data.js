// Task Management — sample data
// Categories with theme color tokens already in the CSS.
const TASK_CATEGORIES = [
  { id: "focus",   label: "Focus",     color: "cyan",   icon: "◈", desc: "Deep work" },
  { id: "create",  label: "Forge",     color: "mint",   icon: "✦", desc: "Build & ship" },
  { id: "habit",   label: "Ritual",    color: "gold",   icon: "◉", desc: "Daily habits" },
  { id: "reflect", label: "Insight",   color: "violet", icon: "✧", desc: "Reflect & plan" },
  { id: "admin",   label: "Errands",   color: "rose",   icon: "✕", desc: "Admin & ops" },
  { id: "health",  label: "Vitality",  color: "mint",   icon: "❀", desc: "Body & rest" },
  { id: "social",  label: "Bonds",     color: "violet", icon: "✷", desc: "People" },
];

const PRIORITIES = {
  critical: { label: "Critical", color: "rose",   token: "▲▲▲" },
  high:     { label: "High",     color: "gold",   token: "▲▲"  },
  medium:   { label: "Medium",   color: "cyan",   token: "▲"   },
  low:      { label: "Low",      color: "mint",   token: "·"   },
};

// Difficulty rank: S > A > B > C > D
const DIFFICULTIES = ["S","A","B","C","D"];

// ────────────────────────────────────────────────────────────
// QUESTS — covers today, this week, this month
// ────────────────────────────────────────────────────────────
const TASKS = [
  // — TODAY (Mon)
  { id: "q01", title: "Plot the Solveig Codex",          desc: "Outline the next chapter of the design system — typography, color, motion tokens.",
    cat: "create",  diff: "S", priority: "critical", xp: 220, coins: 60, est: 120, due: "today 18:00",
    progress: 0.45, subtasks: 6, subtasksDone: 3, day: 0, slot: "deep",
    tags: ["design-system","tokens","spec"], streak: 0, combo: 0,
    deadline: "Today · 18:00", deadlineUrgency: "today",
    expandedNote: "Ship the spec to Lior before EOD. The Codex unlocks the Forge Rite quest line."
  },
  { id: "q02", title: "Morning Sigil Ritual",            desc: "Hydrate, stretch, set the day's first intention.",
    cat: "habit",   diff: "C", priority: "low", xp: 60, coins: 18, est: 15, due: "today 07:30",
    progress: 1, subtasks: 4, subtasksDone: 4, day: 0, slot: "morning", done: true,
    tags: ["routine","mind"], streak: 14, combo: 3,
    deadline: "Today · 07:30", deadlineUrgency: "done"
  },
  { id: "q03", title: "Deep Work — Solo Dungeon",        desc: "Two hours sealed off. Phone in the void, deep focus on the spec.",
    cat: "focus",   diff: "A", priority: "high", xp: 180, coins: 45, est: 120, due: "today 11:00",
    progress: 0.7, subtasks: 0, subtasksDone: 0, day: 0, slot: "deep",
    tags: ["focus","2h"], streak: 6, combo: 2,
    deadline: "Today · 11:00", deadlineUrgency: "now",
    expandedNote: "Active session — 38 min remaining. Streak +6."
  },
  { id: "q04", title: "Mentor Sync · Kai",               desc: "Weekly 1:1 with mentor. Bring the three open questions.",
    cat: "social",  diff: "C", priority: "medium", xp: 80, coins: 20, est: 30, due: "today 14:00",
    progress: 0, subtasks: 3, subtasksDone: 0, day: 0, slot: "afternoon",
    tags: ["mentor","weekly"], streak: 0, combo: 0,
    deadline: "Today · 14:00", deadlineUrgency: "today"
  },
  { id: "q05", title: "Clear the Inbox Wilds",           desc: "Process all messages. Reach inbox zero before the sun sets.",
    cat: "admin",   diff: "B", priority: "medium", xp: 90, coins: 25, est: 45, due: "today 17:00",
    progress: 0.2, subtasks: 0, subtasksDone: 0, day: 0, slot: "afternoon",
    tags: ["admin","email"], streak: 0, combo: 0,
    deadline: "Today · 17:00", deadlineUrgency: "today"
  },
  { id: "q06", title: "Twilight Reflection",             desc: "Journal three wins, one lesson, tomorrow's pact.",
    cat: "reflect", diff: "C", priority: "low", xp: 70, coins: 18, est: 15, due: "today 21:30",
    progress: 0, subtasks: 3, subtasksDone: 0, day: 0, slot: "evening",
    tags: ["journal","wind-down"], streak: 11, combo: 4,
    deadline: "Today · 21:30", deadlineUrgency: "evening"
  },
  { id: "q07", title: "Walk the Outer Path",             desc: "30-minute walk. No earbuds. Notice five textures.",
    cat: "health",  diff: "D", priority: "low", xp: 50, coins: 12, est: 30, due: "today 18:30",
    progress: 0, subtasks: 0, subtasksDone: 0, day: 0, slot: "evening",
    tags: ["body","outside"], streak: 4, combo: 1,
    deadline: "Today · 18:30", deadlineUrgency: "evening"
  },

  // — REST OF THE WEEK (offsets day=1..6 from today)
  { id: "q08", title: "Forge the Quest Card v3",         desc: "Iterate the card layout with the new XP curve.",
    cat: "create",  diff: "A", priority: "high", xp: 180, coins: 50, est: 180, due: "tue 16:00",
    progress: 0, subtasks: 5, subtasksDone: 0, day: 1, slot: "deep",
    tags: ["design","ship"], streak: 0, combo: 0,
    deadline: "Tue · 16:00", deadlineUrgency: "soon"
  },
  { id: "q09", title: "Strength Trial · Pull Day",       desc: "Gym session. Track the lift log.",
    cat: "health",  diff: "B", priority: "medium", xp: 100, coins: 24, est: 60, due: "tue 07:00",
    progress: 0, subtasks: 0, subtasksDone: 0, day: 1, slot: "morning",
    tags: ["body","gym"], streak: 8, combo: 2,
    deadline: "Tue · 07:00", deadlineUrgency: "soon"
  },
  { id: "q10", title: "Council Sync · Guild",            desc: "Standup with the design guild. Demo the new tokens.",
    cat: "social",  diff: "C", priority: "medium", xp: 80, coins: 18, est: 45, due: "wed 10:00",
    progress: 0, subtasks: 0, subtasksDone: 0, day: 2, slot: "morning",
    tags: ["sync","demo"], streak: 0, combo: 0,
    deadline: "Wed · 10:00", deadlineUrgency: "soon"
  },
  { id: "q11", title: "Read · The Lantern Codex (ch 4)", desc: "30 pages. Highlight three insights.",
    cat: "reflect", diff: "D", priority: "low", xp: 50, coins: 12, est: 40, due: "wed 21:00",
    progress: 0, subtasks: 0, subtasksDone: 0, day: 2, slot: "evening",
    tags: ["read","learn"], streak: 9, combo: 3,
    deadline: "Wed · 21:00", deadlineUrgency: "soon"
  },
  { id: "q12", title: "Trial of the Long Focus",         desc: "4-hour deep block. No context switching.",
    cat: "focus",   diff: "S", priority: "critical", xp: 280, coins: 72, est: 240, due: "thu 09:00",
    progress: 0, subtasks: 0, subtasksDone: 0, day: 3, slot: "deep",
    tags: ["focus","4h"], streak: 0, combo: 0,
    deadline: "Thu · 09:00", deadlineUrgency: "soon"
  },
  { id: "q13", title: "Ship the Onboarding Flow",        desc: "Hand off final screens to engineering.",
    cat: "create",  diff: "A", priority: "high", xp: 200, coins: 55, est: 150, due: "thu 17:00",
    progress: 0, subtasks: 4, subtasksDone: 0, day: 3, slot: "afternoon",
    tags: ["ship","handoff"], streak: 0, combo: 0,
    deadline: "Thu · 17:00", deadlineUrgency: "soon"
  },
  { id: "q14", title: "Forge Tools · Audit Plugins",     desc: "Trim the bloated Figma toolbelt. Keep only the worthy.",
    cat: "admin",   diff: "C", priority: "low", xp: 60, coins: 15, est: 30, due: "fri 11:00",
    progress: 0, subtasks: 0, subtasksDone: 0, day: 4, slot: "morning",
    tags: ["admin","tools"], streak: 0, combo: 0,
    deadline: "Fri · 11:00", deadlineUrgency: "later"
  },
  { id: "q15", title: "Weekly Reflection Rite",          desc: "Write the week's chapter. Three wins, one trial, next compass.",
    cat: "reflect", diff: "B", priority: "high", xp: 140, coins: 36, est: 45, due: "fri 18:00",
    progress: 0, subtasks: 3, subtasksDone: 0, day: 4, slot: "evening",
    tags: ["weekly","journal"], streak: 7, combo: 5,
    deadline: "Fri · 18:00", deadlineUrgency: "later",
    expandedNote: "Combo bonus active: +50% XP if completed before Sat."
  },
  { id: "q16", title: "Long Walk — Forest Path",         desc: "90-minute walk, journal three notes after.",
    cat: "health",  diff: "C", priority: "low", xp: 80, coins: 20, est: 90, due: "sat 09:00",
    progress: 0, subtasks: 0, subtasksDone: 0, day: 5, slot: "morning",
    tags: ["body","weekend"], streak: 0, combo: 0,
    deadline: "Sat · 09:00", deadlineUrgency: "later"
  },
  { id: "q17", title: "Salon with Mira & Theo",          desc: "Dinner. Bring the new sketchbook.",
    cat: "social",  diff: "D", priority: "low", xp: 60, coins: 18, est: 180, due: "sat 19:00",
    progress: 0, subtasks: 0, subtasksDone: 0, day: 5, slot: "evening",
    tags: ["bonds","social"], streak: 0, combo: 0,
    deadline: "Sat · 19:00", deadlineUrgency: "later"
  },
  { id: "q18", title: "Sabbath · Idle Day",              desc: "No quests. Rest is a stat.",
    cat: "habit",   diff: "D", priority: "low", xp: 40, coins: 10, est: 480, due: "sun all day",
    progress: 0, subtasks: 0, subtasksDone: 0, day: 6, slot: "morning",
    tags: ["rest"], streak: 11, combo: 0,
    deadline: "Sun · all day", deadlineUrgency: "later"
  },
  { id: "q19", title: "Plan the Week Ahead",             desc: "Set the compass: three pillars, one quest line.",
    cat: "reflect", diff: "B", priority: "high", xp: 120, coins: 30, est: 45, due: "sun 19:00",
    progress: 0, subtasks: 4, subtasksDone: 0, day: 6, slot: "evening",
    tags: ["plan","weekly"], streak: 8, combo: 0,
    deadline: "Sun · 19:00", deadlineUrgency: "later"
  },

  // — LATER THIS MONTH (anchor day=14..26 to map onto month grid)
  { id: "q20", title: "Quest Line — Aetheria v2",        desc: "Multi-week saga. Ship the entire v2 redesign.",
    cat: "create",  diff: "S", priority: "critical", xp: 480, coins: 140, est: 1200, due: "May 28",
    progress: 0.3, subtasks: 12, subtasksDone: 4, day: 14, slot: "deep",
    tags: ["epic","saga"], streak: 0, combo: 0,
    deadline: "May 28", deadlineUrgency: "month",
    saga: true
  },
  { id: "q21", title: "Public Talk · Local Meetup",      desc: "20-min talk on gamified productivity.",
    cat: "social",  diff: "A", priority: "high", xp: 220, coins: 60, est: 240, due: "May 22",
    progress: 0.1, subtasks: 5, subtasksDone: 1, day: 9, slot: "evening",
    tags: ["talk","public"], streak: 0, combo: 0,
    deadline: "May 22", deadlineUrgency: "month"
  },
  { id: "q22", title: "Pilgrimage · Mountain Day",       desc: "Full day hike. No screens.",
    cat: "health",  diff: "B", priority: "medium", xp: 180, coins: 50, est: 480, due: "May 25",
    progress: 0, subtasks: 0, subtasksDone: 0, day: 12, slot: "morning",
    tags: ["body","outside"], streak: 0, combo: 0,
    deadline: "May 25", deadlineUrgency: "month"
  },
  { id: "q23", title: "Codex Review · v1.2",             desc: "Quarterly review of the personal codex.",
    cat: "reflect", diff: "A", priority: "high", xp: 200, coins: 55, est: 90, due: "May 30",
    progress: 0, subtasks: 6, subtasksDone: 0, day: 16, slot: "afternoon",
    tags: ["review","quarterly"], streak: 0, combo: 0,
    deadline: "May 30", deadlineUrgency: "month"
  },
];

// ────────────────────────────────────────────────────────────
// SCHEDULE — today's hour-by-hour
// ────────────────────────────────────────────────────────────
const TODAY_SCHEDULE = [
  { time: "06:30", endTime: "07:00", label: "Morning Sigil Ritual",  taskId: "q02", done: true,  active: false },
  { time: "09:00", endTime: "11:00", label: "Deep Work · Dungeon",    taskId: "q03", done: false, active: true },
  { time: "11:30", endTime: "13:30", label: "Plot the Solveig Codex", taskId: "q01", done: false, active: false },
  { time: "14:00", endTime: "14:30", label: "Mentor Sync · Kai",      taskId: "q04", done: false, active: false },
  { time: "16:00", endTime: "16:45", label: "Clear the Inbox Wilds",  taskId: "q05", done: false, active: false },
  { time: "18:30", endTime: "19:00", label: "Walk the Outer Path",    taskId: "q07", done: false, active: false },
  { time: "21:30", endTime: "21:45", label: "Twilight Reflection",    taskId: "q06", done: false, active: false },
];

// ────────────────────────────────────────────────────────────
// WEEK META
// ────────────────────────────────────────────────────────────
const WEEK_DAYS = [
  { idx: 0, short: "Mon", label: "Monday",    date: "May 18", today: true  },
  { idx: 1, short: "Tue", label: "Tuesday",   date: "May 19", today: false },
  { idx: 2, short: "Wed", label: "Wednesday", date: "May 20", today: false },
  { idx: 3, short: "Thu", label: "Thursday",  date: "May 21", today: false },
  { idx: 4, short: "Fri", label: "Friday",    date: "May 22", today: false },
  { idx: 5, short: "Sat", label: "Saturday",  date: "May 23", today: false },
  { idx: 6, short: "Sun", label: "Sunday",    date: "May 24", today: false },
];

// ────────────────────────────────────────────────────────────
// MONTH META — May 2026 (Fri May 1 start)
// ────────────────────────────────────────────────────────────
const MONTH_META = {
  monthName: "May",
  year: 2026,
  // (weekdayOfFirst: 0=Sun..6=Sat). May 1 2026 is a Friday → 5.
  firstWeekday: 5,
  daysInMonth: 31,
  todayDate: 18,
};

// ────────────────────────────────────────────────────────────
// HERO STATS
// ────────────────────────────────────────────────────────────
const HERO = {
  name: "Aria Solveig",
  title: "Shadow Weaver · Lv 24",
  level: 24,
  rank: "S",
  xp: 3420,
  xpNext: 5000,
  coins: 248,
  gems: 132,
  streak: 12,
  bestStreak: 28,
  comboMultiplier: 1.5,
  comboActive: true,
  weeklyXp: 2840,
  weeklyXpGoal: 4200,
  todayXp: 360,
  todayXpGoal: 800,
  completedToday: 1,
  totalToday: 7,
  completedWeek: 14,
  totalWeek: 28,
  focusActive: true,
  focusRemaining: 38 * 60, // seconds
  focusTotal: 120 * 60,
};

// Activity feed
const ACTIVITY = [
  { kind: "xp",        ts: "2m",   text: "Streak +1 · 12 days",          xp: 0,   icon: "✦" },
  { kind: "complete",  ts: "8m",   text: "Morning Sigil Ritual",          xp: 60,  icon: "◉" },
  { kind: "levelup",   ts: "1h",   text: "Reached Level 24",              xp: 0,   icon: "▲" },
  { kind: "combo",     ts: "1h",   text: "Combo x1.5 unlocked",           xp: 0,   icon: "✷" },
  { kind: "achieve",   ts: "3h",   text: "Achievement · Week Warrior",    xp: 0,   icon: "✧" },
];

Object.assign(window, { TASKS, TASK_CATEGORIES, PRIORITIES, DIFFICULTIES, TODAY_SCHEDULE, WEEK_DAYS, MONTH_META, HERO, ACTIVITY });
