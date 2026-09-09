import type { Task } from './task';

/** Why a backlog task was suggested for a given day. */
export type SuggestionReasonCode =
  | 'deadline'
  | 'priority'
  | 'stale'
  | 'fits'
  | 'same_project'
  | 'same_tag'
  | 'unblocked';

export interface SuggestionReason {
  code: SuggestionReasonCode;
  /** Short human-readable label, ready to render as a chip. */
  label: string;
}

export interface TaskSuggestion {
  task: Task;
  /** 0–100 — higher means a better fit for the requested day. */
  score: number;
  /** Top contributing signals, strongest first (max 3). */
  reasons: SuggestionReason[];
}
