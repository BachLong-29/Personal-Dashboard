import type { DashboardSettings, Escalation, QuestType } from '../types';

export const QUEST_ICONS: Record<QuestType, string> = {
  focus: '🎯',
  habit: '⚡',
  reflect: '📖',
  admin: '📬',
  create: '✨',
  health: '🌿',
  break: '☕',
};

export const SCHED_COLORS: Record<QuestType, string> = {
  focus: '#7dd3fc',
  habit: '#fbbf24',
  reflect: '#c4b5fd',
  admin: '#f87171',
  create: '#6ee7b7',
  health: '#86efac',
  break: '#94a3b8',
};

export const QUOTES = [
  { text: "Every quest completed is a step toward the hero you're becoming.", author: '— The Oracle' },
  { text: 'Small wins compound into legendary feats. Keep your streak alive.', author: '— Aetheria Codex' },
  { text: 'The discipline you forge today shapes the warrior of tomorrow.', author: '— Shadow Tome' },
  { text: 'Your focus is your mana. Spend it wisely and recharge often.', author: '— Elder Scroll' },
];

export const XP_MAP: Record<string, number> = { S: 150, A: 120, B: 90, C: 60, D: 50 };
export const COIN_MAP: Record<string, number> = { S: 40, A: 30, B: 25, C: 15, D: 12 };

export const ESCALATIONS: Escalation[] = [
  { xpLoss: 100, coinLoss: 20, streakBreak: false, statLoss: 2, rankDemote: false },
  { xpLoss: 200, coinLoss: 40, streakBreak: true, statLoss: 5, rankDemote: false },
  { xpLoss: 350, coinLoss: 80, streakBreak: true, statLoss: 8, rankDemote: true },
  { xpLoss: 500, coinLoss: 120, streakBreak: true, statLoss: 12, rankDemote: true },
];

export const DEFAULT_SETTINGS: DashboardSettings = {
  showGuildPanel: true,
  timerDuration: 25,
  characterName: 'Aria Solveig',
  animationsEnabled: true,
  showQuoteCard: true,
};

export const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S'] as const;

export const SKIP_CONFIRM_STORAGE_KEY = 'aetheria_skip_quest_confirm';
