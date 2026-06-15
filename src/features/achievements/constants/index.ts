import type { CategoryMeta, GoalCategory, GoalPriority, GoalRank } from '../types';

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
