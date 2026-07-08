'use client';

import { GoldPanel } from '@/components/common/GoldPanel';
import { WeekPeek } from '@/features/tasks/components/day/WeekPeek';

import { useWeekTasks } from '../hooks/useWeekTasks';

/** Feeds the current week's tasks / quests / habits into {@link WeekPeek}. */
export function WeekPeekPanel() {
  const { tasks, taskBlocks } = useWeekTasks();
  return (
    <GoldPanel className="shrink-0">
      <WeekPeek tasks={tasks} taskBlocks={taskBlocks} bare />
    </GoldPanel>
  );
}
