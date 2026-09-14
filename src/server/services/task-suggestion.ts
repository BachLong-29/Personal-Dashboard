import { ProjectModel } from '@/server/models/project.model';
import { ScheduleBlockModel } from '@/server/models/schedule-block.model';
import { TaskModel } from '@/server/models/task.model';
import { UserSettingModel, DEFAULT_SCHEDULE_SETTINGS } from '@/server/models/user-setting.model';
import { expandEvents } from '@/server/services/event-expand';
import type { ITask } from '@/server/models/task.model';
import type { Task } from '@/types/task';
import type { SuggestionReason, TaskSuggestion } from '@/types/task-suggestion';

/**
 * Ranks *backlog* tasks (active, not done, no `startDate`) for a target day.
 *
 * Every date in the DB is stored at UTC midnight (`new Date("YYYY-MM-DD")`), so
 * all bounds here are computed in UTC to stay consistent with the tasks and
 * schedule-block routes.
 */

const DAY_MS = 86_400_000;

/** Maximum points each signal can contribute — also the reason-chip ordering. */
const WEIGHT = {
  deadline: 35,
  stale: 25,
  fits: 20,
  same_project: 15,
  priority: 15,
  same_tag: 10,
  unblocked: 10,
} as const;

function dayBounds(dateStr: string): { start: Date; end: Date } {
  const start = new Date(dateStr);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

function serialize(t: ITask): Task {
  return {
    id: t._id.toString(),
    userId: t.userId.toString(),
    name: t.name,
    note: t.note,
    tagId: t.tagId,
    color: t.color,
    icon: t.icon,
    status: t.status,
    duration: t.duration,
    startDate: t.startDate?.toISOString().substring(0, 10),
    endDate: t.endDate?.toISOString().substring(0, 10),
    habitRef: t.habitRef?.toString(),
    projectId: t.projectId?.toString(),
    attachments: t.attachments ?? [],
    dependencies: t.dependencies.map((d) => d.toString()),
    active: t.active,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/** Deadline pressure — the single strongest signal (0–35). */
function deadlineScore(deadline: Date, target: Date, warningDays: number): number {
  const daysLeft = daysBetween(target, deadline);
  if (daysLeft <= 0) return 35;
  if (daysLeft <= warningDays) return 32;
  if (daysLeft <= 3) return 28;
  if (daysLeft <= 7) return 20;
  if (daysLeft <= 14) return 12;
  return 5;
}

function deadlineLabel(daysLeft: number): string {
  if (daysLeft < 0) return `Deadline passed ${Math.abs(daysLeft)}d`;
  if (daysLeft === 0) return 'Deadline today';
  return `Deadline in ${daysLeft}d`;
}

/** How long the task has sat undated — 5 pts per 3 days, capped at 25. */
function staleScore(ageDays: number): number {
  return Math.min(WEIGHT.stale, Math.floor(ageDays / 3) * 5);
}

export async function suggestBacklogTasks(
  userId: string,
  dateStr: string,
  limit: number,
): Promise<TaskSuggestion[]> {
  const { start: dayStart, end: dayEnd } = dayBounds(dateStr);

  const [backlog, setting, dayBlocks, dayTasks, dayEvents] = await Promise.all([
    // Backlog = active, unfinished, never given a date.
    TaskModel.find({
      userId,
      active: true,
      status: { $ne: 'done' },
      startDate: { $exists: false },
    }).sort({ createdAt: 1 }),
    UserSettingModel.findOne({ userId }).lean(),
    ScheduleBlockModel.find({ userId, date: { $gte: dayStart, $lt: dayEnd } }),
    TaskModel.find({
      userId,
      active: true,
      $or: [
        { endDate: { $exists: false }, startDate: { $gte: dayStart, $lt: dayEnd } },
        { endDate: { $gte: dayStart }, startDate: { $lt: dayEnd } },
      ],
    }),
    expandEvents(userId, dateStr, dateStr),
  ]);

  if (backlog.length === 0) return [];

  const sched = setting?.schedule ?? DEFAULT_SCHEDULE_SETTINGS;

  // ── Day context — what is already planned, and how much room is left ────────
  const blockedTaskIds = new Set(
    dayBlocks.filter((b) => b.sourceType === 'task').map((b) => b.sourceId.toString()),
  );
  const plannedMinutes = dayBlocks.reduce((sum, b) => sum + b.duration, 0);
  // Dated tasks without a block still consume the day — count their estimate.
  const unblockedMinutes = dayTasks
    .filter((t) => !blockedTaskIds.has(t._id.toString()))
    .reduce((sum, t) => sum + (t.duration ?? 0), 0);
  // Meetings, classes and the like are not tasks but they do take the hours.
  // All-day and non-busy events are on the calendar without claiming time.
  const eventMinutes = dayEvents
    .filter((e) => e.busy && !e.allDay)
    .reduce((sum, e) => sum + e.duration, 0);
  const remainingMinutes = Math.max(
    0,
    sched.dailyCapacityMinutes - plannedMinutes - unblockedMinutes - eventMinutes,
  );

  const dayTagIds = new Set(dayTasks.map((t) => t.tagId));
  const dayProjectIds = new Set(
    dayTasks.flatMap((t) => (t.projectId ? [t.projectId.toString()] : [])),
  );

  // ── Dependency + project lookups for the backlog pool ───────────────────────
  const depIds = [...new Set(backlog.flatMap((t) => t.dependencies.map((d) => d.toString())))];
  const projectIds = [
    ...new Set(backlog.flatMap((t) => (t.projectId ? [t.projectId.toString()] : []))),
  ];

  const [depTasks, projects] = await Promise.all([
    depIds.length > 0
      ? TaskModel.find({ userId, _id: { $in: depIds } }).select('_id status')
      : Promise.resolve([]),
    projectIds.length > 0
      ? ProjectModel.find({ userId, _id: { $in: projectIds } }).select(
          '_id priority deadline status',
        )
      : Promise.resolve([]),
  ]);

  const doneDepIds = new Set(
    depTasks.filter((t) => t.status === 'done').map((t) => t._id.toString()),
  );
  const projectMap = new Map(projects.map((p) => [p._id.toString(), p]));

  const now = new Date();
  const suggestions: TaskSuggestion[] = [];

  for (const task of backlog) {
    const deps = task.dependencies.map((d) => d.toString());

    // A task waiting on unfinished work is not actionable — never suggest it.
    if (deps.some((id) => !doneDepIds.has(id))) continue;

    // A backlog task can still hold a block on the target day (dragged there
    // without a date). It is already visible, so it must not be re-suggested.
    if (blockedTaskIds.has(task._id.toString())) continue;

    let score = 0;
    const reasons: SuggestionReason[] = [];

    const project = task.projectId ? projectMap.get(task.projectId.toString()) : undefined;

    if (project?.deadline) {
      score += deadlineScore(project.deadline, dayStart, sched.deadlineWarningDays);
      reasons.push({
        code: 'deadline',
        label: deadlineLabel(daysBetween(dayStart, project.deadline)),
      });
    }

    if (project) {
      score += project.priority === 'high' ? 15 : project.priority === 'medium' ? 8 : 3;
      if (project.priority === 'high') reasons.push({ code: 'priority', label: 'High priority' });
    }

    const ageDays = daysBetween(task.createdAt, now);
    score += staleScore(ageDays);
    if (ageDays >= 7) reasons.push({ code: 'stale', label: `In backlog ${ageDays}d` });

    // Capacity fit — an unestimated task gets a neutral half-score so it is
    // neither rewarded nor buried below estimated ones.
    if (task.duration === undefined) {
      score += 8;
    } else if (task.duration <= remainingMinutes) {
      score += WEIGHT.fits;
      reasons.push({ code: 'fits', label: `Fits ${remainingMinutes}m left` });
    }

    // Context batching — same project beats same category, never both.
    if (task.projectId && dayProjectIds.has(task.projectId.toString())) {
      score += WEIGHT.same_project;
      reasons.push({ code: 'same_project', label: 'Same project' });
    } else if (dayTagIds.has(task.tagId)) {
      score += WEIGHT.same_tag;
      reasons.push({ code: 'same_tag', label: 'Same category' });
    }

    if (deps.length > 0) {
      score += WEIGHT.unblocked;
      reasons.push({ code: 'unblocked', label: 'Dependencies done' });
    }

    suggestions.push({
      task: serialize(task),
      score: Math.min(100, Math.round(score)),
      reasons: reasons.sort((a, b) => WEIGHT[b.code] - WEIGHT[a.code]).slice(0, 3),
    });
  }

  // Ties break toward the task that has waited longest (backlog is createdAt asc).
  return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
}
