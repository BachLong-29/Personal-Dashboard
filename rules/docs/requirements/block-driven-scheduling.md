# Block-Driven Scheduling — giờ của task đến từ block, không từ task

<role>Engineer giữ quy tắc "block là nguồn sự thật duy nhất về giờ" cho mọi view lịch</role>

<context>
Trước đây task có một `startTime` (HH:MM) quyết định slot Dawn/Deep/Afternoon/Twilight ở Day View,
còn [schedule-block](./schedule-block.md) là lớp lập lịch tuỳ chọn không bao giờ hiện trên grid —
hai nguồn sự thật cho câu hỏi "làm lúc nào".

Quyết định: bỏ `task.startTime`. Một task chỉ có giờ khi có block. Field đã bị gỡ khỏi
`task.model.ts`, `src/types/task.ts`, schema POST/PATCH và serializer; dữ liệu cũ được chuyển bằng
`scripts/migrate-starttime-to-blocks.ts` (đọc raw collection để vẫn chạy sau khi field biến mất
khỏi schema; tạo block `duration = task.duration ?? 60` nếu ngày đó chưa có block, rồi `$unset`).
</context>

<task>
Mọi view đặt task theo block; mọi thao tác "đặt giờ" ghi block, không ghi task.
</task>

<requirement>

## Day View — chỉ task có block

`useScheduleDayTasks({ requireBlock: true })` (`src/features/dashboard/hooks/useScheduleDayTasks.ts`)
— dùng ở `ScheduleDayViewPanel` và `TaskManagement`. Task có `startDate` mà **không** có block
ngày đó **không hiện** trên grid (đã bỏ fallback slot cũ từ 07/2026).

Vì sao: grid là timeline theo giờ; một task không giờ đặt vào "slot mặc định" trông như đã lên lịch
dù chưa. Task có ngày mà chưa có phiên vẫn thấy ở Week View (dạng span).

Slot của card = slot của **block sớm nhất** của task trong ngày đó. `UITask.startTime` vẫn tồn tại
nhưng là giá trị **dẫn xuất** từ block — giữ để `QuestCardMini`, `ScheduleStrip`, edit modal không
phải đổi.

## Kéo vào slot (Day View)

`onMoveToSlot`: giờ mới = `slotToDefaultTime(slot)` (06:00 / 10:00 / 13:00 / 17:00,
`src/features/tasks/data/adapters.ts`).

- Ngày đó đã có block → `PATCH` `startTime` của block đó.
- Chưa có → `POST` block `{date, startTime, duration: task.est ?? 60}`.

## Week View — block trước, span sau

`src/features/dashboard/components/schedule/WeekView.tsx`:

- Task có ≥1 block **trong tuần đang xem** → hiện đúng ở các ngày có block, kèm giờ + phút.
- Task không có block nào trong tuần → hiện như **span** trên mọi ngày thuộc
  `[startDate, endDate ?? startDate]`, không giờ, xếp cuối cột.

Chi tiết kéo-thả: [week-view-rescheduling](./week-view-rescheduling.md).

## Form

`TaskForm` (`src/features/tasks/components/shared/TaskForm.tsx`) không có ô Start Time. Lập lịch
ban đầu đi qua:

- `AddTaskModal` — tạo xong mà có **cả** `duration` và `startDate` → mở SessionPlanner.
- `EditTaskModal` — sau khi lưu, nếu task là việc cần làm, có ngày, **chưa có block nào**, và
  (trước đó chưa có ngày · ngày bắt đầu đổi · vừa mở lại từ `done`) → mở SessionPlanner. Không đòi
  estimate: task không estimate chính là task cần xếp tay.
- Task đã có block mà đổi ngày hoặc đổi estimate → `SessionUpdatePrompt` (xem
  [overdue-task-handling](./overdue-task-handling.md) §Session prompt).

`EditTaskModal` bật các dialog này **sau** khi save đã clear `task`, nên mọi nơi render nó phải giữ
mounted và điều khiển bằng `open` — render có điều kiện sẽ unmount luôn dialog đang chờ.

## Habit reschedule

Dời một lần habit sang giờ khác = tạo task thay thế có `habitRef` + block tại giờ mới (không còn ghi
`startTime`). Engine bỏ occurrence habit ngày đó khi có task `habitRef` cùng ngày. Xem
[reschedule-habit](./reschedule-habit.md).

## Edge cases

- Task có block ở tuần khác nhưng không có block tuần này → hiện dạng span (Week View xét block theo
  tuần, không theo toàn bộ lịch sử).
- Calendar engine (`buildCalendar`) vẫn sinh item **không giờ** cho task có `startDate` mà không có
  block — item đó đi vào capacity/stats nhưng không vào conflict check.

</requirement>

<tone>Chính xác, mỗi quy tắc kèm lý do.</tone>
