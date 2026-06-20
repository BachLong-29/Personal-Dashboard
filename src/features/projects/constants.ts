import type { TaskColor, TaskStatus } from '@/types';
import type { ProjectPriority } from '@/types/project';

/** TaskColor → oklch CSS value (mirrors TaskForm's COLOR_OPTIONS). */
export const COLOR_CSS: Record<TaskColor, string> = {
  gold: 'oklch(0.74 0.17 85)',
  mint: 'oklch(0.76 0.14 162)',
  violet: 'oklch(0.66 0.22 295)',
  cyan: 'oklch(0.76 0.16 205)',
  rose: 'oklch(0.72 0.18 5)',
  amber: 'oklch(0.76 0.16 55)',
  blue: 'oklch(0.65 0.18 250)',
};

export const COLOR_OPTIONS: { value: TaskColor; label: string }[] = [
  { value: 'gold', label: 'Gold' },
  { value: 'mint', label: 'Mint' },
  { value: 'violet', label: 'Violet' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'rose', label: 'Rose' },
  { value: 'amber', label: 'Amber' },
  { value: 'blue', label: 'Blue' },
];

export const PRIORITY_OPTIONS: { value: ProjectPriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const PRIORITY_CSS: Record<ProjectPriority, string> = {
  high: 'oklch(0.72 0.18 5)',
  medium: 'oklch(0.76 0.16 55)',
  low: 'oklch(0.76 0.16 205)',
};

/** Kanban columns — order matters. */
export const STATUS_COLUMNS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending', label: 'Pending' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'done', label: 'Done' },
];

/** Per-status accent color — used to distinguish Kanban columns. */
export const STATUS_CSS: Record<TaskStatus, string> = {
  todo: 'oklch(0.65 0.02 280)', // neutral gray
  in_progress: 'oklch(0.65 0.18 250)', // blue
  pending: 'oklch(0.76 0.16 55)', // orange
  waiting: 'oklch(0.86 0.16 95)', // yellow
  done: 'oklch(0.72 0.18 145)', // green
};

export const PROJECT_ICONS = [
  '🚀',
  '📦',
  '🏗',
  '🎯',
  '🧩',
  '📚',
  '💡',
  '🛠',
  '🎨',
  '🌱',
  '⚙️',
  '🔮',
];
