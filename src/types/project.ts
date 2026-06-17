import type { Task, TaskColor } from './task';

export type ProjectStatus = 'active' | 'completed' | 'archived';
export type ProjectPriority = 'high' | 'medium' | 'low';

export interface ProjectDTO {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: TaskColor;
  icon: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: string;
  deadline?: string;
  xp: number;
  coins: number;
  completedDate?: string;
  /** Derived 0..1 — doneTasks / totalTasks */
  progress: number;
  /** Count of tasks with status 'done' */
  doneTasks: number;
  /** Count of all active tasks in the project */
  totalTasks: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Project detail bundled with its tasks. */
export interface ProjectDetailDTO extends ProjectDTO {
  tasks: Task[];
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  color: TaskColor;
  icon: string;
  priority?: ProjectPriority;
  startDate?: string;
  deadline?: string;
  xp?: number;
  coins?: number;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string | null;
  color?: TaskColor;
  icon?: string;
  priority?: ProjectPriority;
  startDate?: string | null;
  deadline?: string | null;
  xp?: number;
  coins?: number;
}
