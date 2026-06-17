export type TaskStatus = 'todo' | 'in_progress' | 'pending' | 'waiting' | 'done';
export type TaskColor = 'gold' | 'mint' | 'violet' | 'cyan' | 'rose' | 'amber' | 'blue';

export interface Task {
  id: string;
  userId: string;
  name: string;
  note?: string;
  tagId: string;
  color: TaskColor;
  icon: string;
  status: TaskStatus;
  /** Estimated duration in minutes */
  duration?: number;
  startDate: string;
  /** HH:MM scheduled time within startDate — set when rescheduling a habit */
  startTime?: string;
  /** Optional — omit for open-ended / point-in-time tasks */
  endDate?: string;
  /** Habit ID this task replaces for the startDate day */
  habitRef?: string;
  /** Project ID this task belongs to — omitted for standalone tasks */
  projectId?: string;
  /** Reason the task was deferred to a later date */
  deferReason?: string;
  dependencies: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  name: string;
  note?: string;
  tagId: string;
  color: TaskColor;
  icon: string;
  /** Estimated duration in minutes */
  duration?: number;
  startDate: string;
  /** HH:MM scheduled time — used when rescheduling a habit to a specific time */
  startTime?: string;
  /** Defaults to startDate when omitted */
  endDate?: string;
  /** Habit ObjectId this task is replacing */
  habitRef?: string;
  /** Project ObjectId this task belongs to */
  projectId?: string;
  dependencies?: string[];
}

export interface UpdateTaskPayload {
  name?: string;
  note?: string;
  tagId?: string;
  color?: TaskColor;
  icon?: string;
  status?: TaskStatus;
  duration?: number;
  startDate?: string;
  /** HH:MM scheduled time — null to clear */
  startTime?: string | null;
  endDate?: string | null;
  /** null to clear the defer reason */
  deferReason?: string | null;
  /** Project ObjectId — null to detach the task from its project */
  projectId?: string | null;
  dependencies?: string[];
  active?: boolean;
}
