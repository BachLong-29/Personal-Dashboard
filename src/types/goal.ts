export interface GoalMilestoneDTO {
  id: string;
  label: string;
  done: boolean;
}

export interface GoalDTO {
  id: string;
  userId: string;
  title: string;
  cat: 'career' | 'health' | 'learning' | 'finance' | 'personal';
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  priority: 'high' | 'medium' | 'low';
  status: 'not-started' | 'in-progress' | 'completed' | 'archived';
  progress: number;
  xp: number;
  coins: number;
  targetDate: string;
  targetLabel: string;
  daysLeft: number;
  desc?: string;
  note?: string;
  linkedTrophy?: string;
  completedDate?: string;
  milestones: GoalMilestoneDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalPayload {
  title: string;
  cat: GoalDTO['cat'];
  rank: GoalDTO['rank'];
  priority: GoalDTO['priority'];
  targetDate: string;
  desc?: string;
  note?: string;
  linkedTrophy?: string;
  milestones?: { label: string; done?: boolean }[];
}

export interface UpdateGoalPayload {
  title?: string;
  cat?: GoalDTO['cat'];
  rank?: GoalDTO['rank'];
  priority?: GoalDTO['priority'];
  status?: GoalDTO['status'];
  targetDate?: string;
  desc?: string | null;
  note?: string | null;
  linkedTrophy?: string | null;
  milestones?: { label: string; done: boolean }[];
}
