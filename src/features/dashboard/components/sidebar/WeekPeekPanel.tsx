'use client';

import { WeekPeek } from '@/features/tasks/components/day/WeekPeek';

import { useWeekTasks } from '../../hooks/useWeekTasks';

interface WeekPeekPanelProps {
  /** Opens the full week view (dashboard → Schedule → Week). When omitted, the shortcut button is hidden. */
  onOpenWeek?: () => void;
}

/** Feeds the current week's tasks / quests / habits into {@link WeekPeek}. */
export function WeekPeekPanel({ onOpenWeek }: WeekPeekPanelProps) {
  const { tasks, taskBlocks } = useWeekTasks();
  return (
    <div className={panel}>
      <WeekPeek tasks={tasks} taskBlocks={taskBlocks} bare onOpenWeek={onOpenWeek} />
    </div>
  );
}

const panel =
  "shrink-0 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] overflow-hidden relative before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px),repeating-linear-gradient(90deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px)] border-[oklch(0.66_0.22_295_/_0.35)] shadow-[0_0_20px_oklch(0.66_0.22_295_/_0.06),inset_0_0_20px_oklch(0.66_0.22_295_/_0.03)]";
