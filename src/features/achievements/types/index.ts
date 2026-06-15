export type GoalCategory = 'career' | 'health' | 'learning' | 'finance' | 'personal';
export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalStatus = 'not-started' | 'in-progress' | 'completed' | 'archived';
export type TrophyTier = 'bronze' | 'silver' | 'gold' | 'legendary';
export type GoalRank = 'S' | 'A' | 'B' | 'C' | 'D';
export type AmbitionsTab = 'goals' | 'overview' | 'trophies' | 'bingo';
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

