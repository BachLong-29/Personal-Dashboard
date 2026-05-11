export type QuestType = 'focus' | 'habit' | 'reflect' | 'admin' | 'create' | 'health' | 'break';
export type Difficulty = 'S' | 'A' | 'B' | 'C' | 'D';

export interface Quest {
  id: string;
  userId: string;
  title: string;
  desc: string;
  type: QuestType;
  difficulty: Difficulty;
  xp: number;
  coins: number;
  done: boolean;
  tags: string[];
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestPayload {
  title: string;
  desc?: string;
  type: QuestType;
  difficulty: Difficulty;
  tags?: string[];
  dueDate?: string;
}
