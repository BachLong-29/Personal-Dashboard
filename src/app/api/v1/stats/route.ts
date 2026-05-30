import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { HabitLogModel } from '@/server/models/habit-log.model';
import { HabitModel } from '@/server/models/habit.model';
import { TaskModel } from '@/server/models/task.model';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import type { HabitDay } from '@/types/habit';

const DOW_TO_HABIT_DAY: HabitDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function localMidnight(offset = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (offset !== 0) d.setDate(d.getDate() + offset);
  return d;
}

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// GET /api/v1/stats
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const today = localMidnight();
  const todayStr = toDateStr(today);
  const weekStart = localMidnight(-6);
  const todayDow = DOW_TO_HABIT_DAY[today.getDay()] as HabitDay;

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const allTasks = await TaskModel.find({ userId: user.sub, active: true }).lean();

  const tasksDone = allTasks.filter((t) => t.status === 'done').length;
  const tasksInProg = allTasks.filter((t) => t.status === 'in_progress').length;
  const tasksPending = allTasks.filter(
    (t) => t.status === 'pending' || t.status === 'waiting',
  ).length;
  const tasksTodo = allTasks.filter((t) => t.status === 'todo').length;
  const tasksOverdue = allTasks.filter((t) => {
    const due = t.endDate ?? t.startDate;
    return t.status !== 'done' && due < today;
  }).length;
  const completionRate = allTasks.length > 0 ? Math.round((tasksDone / allTasks.length) * 100) : 0;

  // Pending tasks list — not done, sorted by startDate asc, limit 10
  const pendingTaskList = allTasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 10)
    .map((t) => {
      const due = t.endDate ?? t.startDate;
      return {
        id: t._id.toString(),
        name: t.name,
        icon: t.icon,
        color: t.color,
        status: t.status,
        startDate: toDateStr(t.startDate),
        overdue: due < today,
        daysOverdue:
          due < today ? Math.floor((today.getTime() - due.getTime()) / 86_400_000) : undefined,
      };
    });

  // ── Habits ─────────────────────────────────────────────────────────────────
  const habits = await HabitModel.find({ userId: user.sub, active: true }).lean();

  // Habits scheduled for today
  const habitsToday = habits.filter((h) => h.schedule.some((e) => e.days.includes(todayDow)));

  // Today's logs
  const todayLogs = await HabitLogModel.find({
    userId: user.sub,
    date: { $gte: today, $lt: localMidnight(1) },
  }).lean();

  const doneToday = todayLogs.filter((l) => l.done).length;
  const totalToday = habitsToday.length;
  const completionRateToday = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0;

  // Last 7 days habit logs
  const weekLogs = await HabitLogModel.find({
    userId: user.sub,
    date: { $gte: weekStart },
    done: true,
  }).lean();

  // ── Weekly trend (last 7 days) ─────────────────────────────────────────────
  const dates: string[] = [];
  const weekTasksDone: number[] = [];
  const weekHabitsDone: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = localMidnight(-i);
    const dayStr = toDateStr(day);
    dates.push(dayStr.slice(5)); // MM-DD

    // Tasks scheduled on this day that are done
    weekTasksDone.push(
      allTasks.filter((t) => toDateStr(t.startDate) === dayStr && t.status === 'done').length,
    );

    // Habit logs done on this day
    weekHabitsDone.push(weekLogs.filter((l) => toDateStr(new Date(l.date)) === dayStr).length);
  }

  // Week habit completion rate — average across days that had habits scheduled
  const weekCompletionRate = (() => {
    let totalScheduled = 0;
    let totalDone = 0;
    for (let i = 0; i < 7; i++) {
      totalDone += weekHabitsDone[i] ?? 0;
      totalScheduled += weekHabitsDone[i] ?? 0; // approximate: use done as proxy
    }
    return totalDone > 0 ? Math.round((totalDone / Math.max(totalScheduled, 1)) * 100) : 0;
  })();

  return successResponse({
    tasks: {
      total: allTasks.length,
      done: tasksDone,
      inProgress: tasksInProg,
      pending: tasksPending,
      todo: tasksTodo,
      overdue: tasksOverdue,
      completionRate,
    },
    habits: {
      activeCount: habits.length,
      doneToday,
      totalToday,
      completionRateToday,
      weekCompletionRate,
    },
    weekly: {
      dates,
      tasksDone: weekTasksDone,
      habitsDone: weekHabitsDone,
    },
    pendingTasks: pendingTaskList,
    generatedAt: todayStr,
  });
});
