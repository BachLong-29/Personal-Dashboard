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
  startDate: string;
  endDate: string;
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
  startDate: string;
  endDate: string;
  dependencies?: string[];
}

export interface UpdateTaskPayload {
  name?: string;
  note?: string;
  tagId?: string;
  color?: TaskColor;
  icon?: string;
  status?: TaskStatus;
  startDate?: string;
  endDate?: string;
  dependencies?: string[];
  active?: boolean;
}
