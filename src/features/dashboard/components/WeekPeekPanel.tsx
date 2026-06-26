'use client';

import { WeekPeek } from '@/features/tasks/components/day/WeekPeek';

import { useWeekTasks } from '../hooks/useWeekTasks';

/** Feeds the current week's tasks / quests / habits into {@link WeekPeek}. */
export function WeekPeekPanel() {
  const weekTasks = useWeekTasks();
  return <WeekPeek tasks={weekTasks} />;
}
