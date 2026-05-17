export type QuestType = 'focus' | 'habit' | 'reflect' | 'admin' | 'create' | 'health' | 'break';
export type Difficulty = 'S' | 'A' | 'B' | 'C' | 'D';
export type CenterTab = 'quests' | 'schedule' | 'stats' | 'habits';
export type HabitColor = 'gold' | 'mint' | 'violet' | 'cyan' | 'rose' | 'amber' | 'blue';
export type HabitDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Quest {
  id: string;
  title: string;
  desc: string;
  type: QuestType;
  difficulty: Difficulty;
  xp: number;
  coins: number;
  done: boolean;
  tags: string[];
  habitId?: string;
  habitColor?: HabitColor;
  habitIcon?: string;
}

export interface Habit {
  id: string;
  name: string;
  days: HabitDay[];
  note?: string;
  tagId: string;
  color: HabitColor;
  icon: string;
  active: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  done: boolean;
}

export interface CharacterStat {
  key: string;
  value: number;
  color: string;
}

export interface Character {
  name: string;
  title: string;
  level: number;
  rank: string;
  class: string;
  streak: number;
  xp: number;
  xpNext: number;
  coins: number;
  gems: number;
  stats: CharacterStat[];
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  earned: boolean;
}

export interface ScheduleItem {
  time: string;
  label: string;
  type: QuestType;
  done: boolean;
}

export interface Analytics {
  weeklyXP: number[];
  focusHours: number[];
  tasksDone: number[];
  weekLabels: string[];
}

export interface GuildMember {
  name: string;
  level: number;
  avatar: string;
  online: boolean;
}

export interface BurstPos {
  x: number;
  y: number;
}

export interface DashboardSettings {
  showGuildPanel: boolean;
  timerDuration: number;
  characterName: string;
  animationsEnabled: boolean;
  showQuoteCard: boolean;
}

export interface Escalation {
  xpLoss: number;
  coinLoss: number;
  streakBreak: boolean;
  statLoss: number;
  rankDemote: boolean;
}

export interface PendingQuest {
  quest: Quest;
  burstPos: BurstPos | null;
}

export interface PenaltyState {
  tier: number;
  unfinished: Quest[];
}
