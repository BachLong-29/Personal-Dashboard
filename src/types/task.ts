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
  /** Optional — omit for open-ended / point-in-time tasks */
  endDate?: string;
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
  /** Defaults to startDate when omitted */
  endDate?: string;
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
  endDate?: string | null;
  dependencies?: string[];
  active?: boolean;
}
