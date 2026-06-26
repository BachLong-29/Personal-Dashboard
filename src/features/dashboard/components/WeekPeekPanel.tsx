'use client';

import { useMemo } from 'react';

import {
  questToUITask,
  taskToUITask,
  habitToUITask,
  isHabitScheduledForDate,
} from '@/features/tasks/data/adapters';
import type { UITask } from '@/features/tasks/data/mock';
import { WeekPeek } from '@/features/tasks/components/day/WeekPeek';
import { toLocalDate } from '@/features/tasks/utils/date.utils';

import { useHabitLogsRange } from '../hooks/useHabitLogsRange';
import { useHabits } from '../hooks/useHabits';
import { useQuests } from '../hooks/useQuests';
import { useTaskLogs } from '../hooks/useTaskLogs';
import { useTasks } from '../hooks/useTasks';

/**
 * Self-contained panel that feeds the current week's tasks / quests / habits
 * into {@link WeekPeek}. Drops the block-scheduling and project metadata that
 * the day view needs — WeekPeek only reads day / done / cat / icon / title /
 * diff, so the lighter merge is enough.
 */
export function WeekPeekPanel() {
  const todayStr = toLocalDate(new Date());

  // Current week range (Mon–Sun) for the habit-log cache.
  const currentWeekStart = useMemo(() => {
    const today = new Date();
    const monBased = (today.getDay() + 6) % 7;
    const d = new Date(today);
    d.setDate(today.getDate() - monBased);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const logRangeFrom = useMemo(() => toLocalDate(currentWeekStart), [currentWeekStart]);
  const logRangeTo = useMemo(() => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + 6);
    return toLocalDate(d);
  }, [currentWeekStart]);

  const { data: apiTasks = [] } = useTasks();
  const { data: apiQuestsRaw = [] } = useQuests();
  const { data: apiHabits = [] } = useHabits();
  const { data: apiTaskLogs = [] } = useTaskLogs(todayStr);
  const { data: weekHabitLogs = [] } = useHabitLogsRange(logRangeFrom, logRangeTo);

  const cancelledHabitIds = useMemo(
    () =>
      new Set(
        apiTasks.flatMap((t) => (t.habitRef && t.startDate === todayStr ? [t.habitRef] : [])),
      ),
    [apiTasks, todayStr],
  );

  const weekTasks = useMemo<UITask[]>(() => {
    const tasks = apiTasks.map((t) => {
      const log = apiTaskLogs.find((l) => l.taskId === t.id);
      return taskToUITask(t, log);
    });
    const quests = apiQuestsRaw.map((q) => questToUITask(q));
    const habits = apiHabits
      .filter((h) => h.active)
      .flatMap((h) =>
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date(currentWeekStart);
          d.setDate(currentWeekStart.getDate() + i);
          if (!isHabitScheduledForDate(h, d)) return null;
          const ds = toLocalDate(d);
          const log = weekHabitLogs.find(
            (l) => l.habitId === h.id && toLocalDate(new Date(l.date)) === ds,
          );
          const cancelled = ds === todayStr && cancelledHabitIds.has(h.id);
          const ui = habitToUITask(h, log, cancelled, d);
          return { ...ui, id: `habit-${h.id}-${ds}` };
        }).filter((x): x is UITask => x !== null),
      );
    return [...tasks, ...quests, ...habits];
  }, [
    apiTasks,
    apiTaskLogs,
    apiQuestsRaw,
    apiHabits,
    weekHabitLogs,
    cancelledHabitIds,
    currentWeekStart,
    todayStr,
  ]);

  return <WeekPeek tasks={weekTasks} />;
}
