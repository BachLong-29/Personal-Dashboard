'use client';

import { WeekPeek } from '@/features/tasks/components/day/WeekPeek';

import { useWeekTasks } from '../hooks/useWeekTasks';

interface WeekPeekPanelProps {
  /** Opens the full week view (dashboard → Schedule → Week). */
  onOpenWeek?: () => void;
}

/** Feeds the current week's tasks / quests / habits into {@link WeekPeek}. */
export function WeekPeekPanel({ onOpenWeek }: WeekPeekPanelProps) {
  const weekTasks = useWeekTasks();
  return <WeekPeek tasks={weekTasks} onOpenWeek={onOpenWeek} />;
}
