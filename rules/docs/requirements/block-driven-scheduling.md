<role>
Engineer refactoring task scheduling so schedule blocks are the single source of truth for a task's time-of-day, replacing the per-task `startTime` field.
</role>

<context>
Previously a task carried a single `startTime` (HH:MM) that decided which day-view slot
(Dawn/Deep/Afternoon/Twilight) its card appeared in. Schedule blocks were a separate,
optional planning layer (SessionPlanner) and were never rendered in the day grid.
This created two sources of truth for "when" a task happens.

Decision: drop `task.startTime`. A task's slot on a given date is derived from its
**earliest schedule block on that date**. Tasks with no block on the date fall back to a
default slot so they still show in the grid. Dragging a card into a slot creates or moves a
block instead of writing `startTime`. Existing `startTime` values are migrated into blocks.
</context>

<task>
Remove the `startTime` field end-to-end and make blocks drive slot placement.
</task>

<requirement>
- DATA: remove `startTime` from the Task model, `Task` / `CreateTaskPayload` /
  `UpdateTaskPayload` types, and the tasks POST/PATCH schemas + serializer.
- MIGRATION: one-time script converts each task with `startTime` into a `ScheduleBlock`
  { sourceType:'task', date:startDate, startTime, duration: task.duration ?? 60 } when the
  task has no block on that date, then `$unset`s the field. Reads the raw collection so it
  works after the schema field is removed.
- SLOT DERIVATION: for a task card shown on date D, slot = slot of the earliest block with
  sourceId=task.id and date=D. No block on D → fallback (`offsetToSlot(day)` →
  morning / current-hour for today). `UITask.startTime` is kept but is now a DERIVED display
  value sourced from that block, not from the task entity.
- DRAG-TO-SLOT: dropping a task into a slot creates a block (date = the column's date,
  startTime = slot default, duration = task.est ?? 60) when none exists for that date, or
  updates the earliest existing block's startTime. Persisted via the schedule-block API.
- FORM: remove the Start Time input + slot badge from the shared TaskForm and the legacy
  dashboard ScheduleTaskModal. Initial scheduling happens via drag or the SessionPlanner.
- HABIT RESCHEDULE: still moves a habit occurrence to a new time, now by creating the
  replacement task and a block at that time (was: task.startTime).
- DASHBOARD: WeekView / DayView / ScheduleTaskModal stop reading `task.startTime`.
</requirement>

<tone>
Surgical. Lean on the type checker to find every reference. Keep `UITask.startTime` so
display components (QuestCardMini, ScheduleStrip, edit modal) need no change — only its
source changes.
</tone>
