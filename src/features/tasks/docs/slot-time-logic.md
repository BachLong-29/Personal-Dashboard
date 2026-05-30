# Task Slot & Start Time Logic

## Overview

Every task in the day view belongs to one of four **slots** (time buckets). The slot
controls which column the task card appears in and carries its own colour palette.

| Slot ID     | Label     | Time Range | Glyph | Default startTime |
| ----------- | --------- | ---------- | ----- | ----------------- |
| `morning`   | Dawn      | 06 – 10    | ◐     | `06:00`           |
| `deep`      | Deep Work | 10 – 13    | ❖     | `10:00`           |
| `afternoon` | Afternoon | 13 – 17    | ☉     | `13:00`           |
| `evening`   | Twilight  | 17 – 22    | ☾     | `17:00`           |

---

## How a task's slot is determined (`offsetToSlot`)

Source: `src/features/tasks/data/adapters.ts → offsetToSlot()`

```
Priority 1 — explicit startTime set on the task
   → parse hour from HH:MM, map to slot (regardless of date offset)
   hour < 10              → 'morning'
   hour < 13              → 'deep'
   hour < 17              → 'afternoon'
   hour >= 17             → 'evening'

Priority 2 — no startTime, today (offset = 0)
   → use current clock hour as fallback (same mapping as above)
   ⚠ This means a task without startTime will appear in different slots
     depending on what time of day it is rendered. Avoid relying on this.

Priority 3 — no startTime, different day (offset ≠ 0)
   → always 'morning' (safe default for tasks not yet given a time)
```

### For Habits (`timeToSlot`)

Habits use the `entry.time` from their schedule directly — same hour→slot mapping.
If no entry time exists, defaults to `'morning'`.

---

## Drag-and-drop slot assignment

Source: `src/features/tasks/components/TaskManagement.tsx → handleMoveToSlot()`

When the user drags a task card into a different slot column:

1. **Determine new `startTime`**
   - If the task is dropped on the **current day** (`day === 0`):
     `newStartTime = slotToDefaultTime(targetSlot)` — the _start_ of the target slot.
   - If dropped on a **past/future day**: `startTime` is left unchanged (slot is decorative for non-today).

2. **Optimistic UI update**
   - Update local `UITask` state: `{ slot: targetSlot, day, startTime: newStartTime }`.

3. **API persistence** (tasks only, current day)
   - Calls `PATCH /api/v1/tasks/:id` with `{ startTime: newStartTime }`.
   - On the next re-fetch, `offsetToSlot(day, startTime)` will resolve to the
     same slot from the persisted `startTime`, so the card stays in place.

### Default startTimes when dragging

```
Drag into Dawn      → startTime = '06:00'
Drag into Deep Work → startTime = '10:00'
Drag into Afternoon → startTime = '13:00'
Drag into Twilight  → startTime = '17:00'
```

> **Why the start of the range?**
> Using the range start is the least surprising default — the user can always
> edit the exact time afterwards in the task edit modal.

---

## startTime in the create / edit form

Source: `src/features/tasks/components/shared/TaskForm.tsx`

- The form shows an `<input type="time">` for `startTime`.
- As the user types, a live **slot badge** appears next to the input
  showing which slot that time falls in (e.g. `◐ Dawn (06–10)`).
- `startTime` is optional. Tasks without it get their slot from the
  current-hour fallback (today) or default to `morning` (other days).

---

## API contract

### POST `/api/v1/tasks`

```jsonc
{
  "startTime": "14:30", // optional HH:MM — assigns slot on creation
}
```

### PATCH `/api/v1/tasks/:id`

```jsonc
{
  "startTime": "10:00"   // update → moves task to Deep Work slot
  "startTime": null      // null → clears startTime (falls back to slot defaults)
}
```

---

## File map

| File                                                      | Role                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| `src/features/tasks/data/mock.ts`                         | `SLOTS` array — slot metadata (label, colour, glyph, time range) |
| `src/features/tasks/data/adapters.ts`                     | `offsetToSlot()`, `timeToSlot()`, `slotToDefaultTime()`          |
| `src/features/tasks/components/shared/TaskForm.tsx`       | Unified create/edit form with startTime picker + slot badge      |
| `src/features/tasks/components/shared/AddTaskModal.tsx`   | Create-task modal wrapping `TaskForm`                            |
| `src/features/tasks/components/shared/EditTaskModal.tsx`  | Edit-task modal wrapping `TaskForm`                              |
| `src/features/tasks/components/TaskManagement.tsx`        | `handleMoveToSlot()` — drag persistence                          |
| `src/features/dashboard/components/ScheduleTaskModal.tsx` | Legacy dashboard create/edit modal (also has startTime)          |
| `src/app/api/v1/tasks/route.ts`                           | POST — accepts `startTime` in create payload                     |
| `src/app/api/v1/tasks/[id]/route.ts`                      | PATCH — accepts `startTime` (string or null)                     |
| `src/server/models/task.model.ts`                         | Mongoose schema — `startTime` field with `HH:MM` regex           |
| `scripts/migrate-task-starttime.ts`                       | One-time backfill script for existing tasks without startTime    |
