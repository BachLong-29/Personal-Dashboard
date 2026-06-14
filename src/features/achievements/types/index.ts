export type GoalCategory = 'career' | 'health' | 'learning' | 'finance' | 'personal';
export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalStatus = 'not-started' | 'in-progress' | 'completed' | 'archived';
export type TrophyTier = 'bronze' | 'silver' | 'gold' | 'legendary';
export type GoalRank = 'S' | 'A' | 'B' | 'C' | 'D';
export type AmbitionsTab = 'goals' | 'overview' | 'trophies';
export type GoalSortBy = 'priority' | 'progress' | 'due' | 'status';

export interface GoalMilestone {
  id: string;
  label: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  cat: GoalCategory;
  rank: GoalRank;
  priority: GoalPriority;
  status: GoalStatus;
  progress: number;
  xp: number;
  coins: number;
  targetDate: string;
  targetLabel: string;
  createdAt: string;
  daysLeft: number;
  desc: string;
  note?: string;
  linkedTrophy?: string;
  completedDate?: string;
  milestones: GoalMilestone[];
}

export interface Trophy {
  id: string;
  name: string;
  tier: TrophyTier;
  icon: string;
  unlocked: boolean;
  date?: string;
  reward?: string;
  desc: string;
  linkedGoal: string;
  recent?: boolean;
  progress?: number;
}

export interface AmbitionsStats {
  total: number;
  active: number;
  completed: number;
  notStarted: number;
  completionRate: number;
  avgProgress: number;
  completedThisYear: number;
  milestonesTotal: number;
  milestonesDone: number;
  trophies: number;
  totalTrophies: number;
  lockedTrophies: number;
}

export interface CategoryMeta {
  id: GoalCategory;
  label: string;
  ci: string;
  accent: string;
  textClass: string;
  borderClass: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'career',   label: 'Career',   ci: '⚜', accent: 'var(--gold)',   textClass: 'text-[var(--gold)]',   borderClass: 'border-l-[var(--gold)]' },
  { id: 'health',   label: 'Health',   ci: '❀', accent: 'var(--mint)',   textClass: 'text-[var(--mint)]',   borderClass: 'border-l-[var(--mint)]' },
  { id: 'learning', label: 'Learning', ci: '◈', accent: 'var(--cyan)',   textClass: 'text-[var(--cyan)]',   borderClass: 'border-l-[var(--cyan)]' },
  { id: 'finance',  label: 'Finance',  ci: '◆', accent: 'var(--violet)', textClass: 'text-[var(--violet)]', borderClass: 'border-l-[var(--violet)]' },
  { id: 'personal', label: 'Personal', ci: '✦', accent: 'var(--rose)',   textClass: 'text-[var(--rose)]',   borderClass: 'border-l-[var(--rose)]' },
];

export const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<GoalCategory, CategoryMeta>;

export const RANK_DESC: Record<GoalRank, string> = {
  S: 'Legendary',
  A: 'Heroic',
  B: 'Skilled',
  C: 'Standard',
  D: 'Apprentice',
};

export const RANK_STYLE: Record<GoalRank, string> = {
  S: 'text-[var(--gold)]   bg-[oklch(0.74_0.17_85_/_0.12)]  border-[oklch(0.74_0.17_85_/_0.5)]',
  A: 'text-[var(--violet)] bg-[oklch(0.66_0.22_295_/_0.12)] border-[oklch(0.66_0.22_295_/_0.5)]',
  B: 'text-[var(--cyan)]   bg-[oklch(0.78_0.16_205_/_0.12)] border-[oklch(0.78_0.16_205_/_0.5)]',
  C: 'text-[var(--mint)]   bg-[oklch(0.76_0.14_162_/_0.12)] border-[oklch(0.76_0.14_162_/_0.5)]',
  D: 'text-[var(--text-mid)] bg-[var(--panel2)] border-[var(--border)]',
};

export const PRIORITY_STYLE: Record<GoalPriority, string> = {
  high:   'text-[var(--rose)]    bg-[oklch(0.74_0.18_5_/_0.08)]   border-[oklch(0.74_0.18_5_/_0.35)]',
  medium: 'text-[var(--gold)]    bg-[oklch(0.74_0.17_85_/_0.08)]  border-[oklch(0.74_0.17_85_/_0.3)]',
  low:    'text-[var(--text-lo)] bg-[var(--panel2)]                border-[var(--border)]',
};

export const MOTIV_LINES = [
  { quote: 'Discipline is the bridge between goals and accomplishment.', sub: "You're <strong>62%</strong> of the way through your hardest saga." },
  { quote: 'Small daily wins compound into legendary outcomes.',          sub: 'Your completion rate is up <strong>+14%</strong> this month.' },
  { quote: 'The summit is reached one honest step at a time.',           sub: '<strong>3 ambitions</strong> are within two weeks of completion.' },
];
