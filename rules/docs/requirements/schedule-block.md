# Schedule Block — một phiên ngồi làm của Task/Quest

<role>Fullstack engineer giữ model + API cho "phiên làm việc" — nguồn sự thật duy nhất về giờ của task</role>

<context>
Task chỉ là mục tiêu (ngày bắt đầu/kết thúc + estimate), không có giờ. Một task 16h cần được chia
thành nhiều lần ngồi làm qua nhiều ngày — mỗi lần là một `ScheduleBlock`. Từ khi bỏ
`task.startTime` ([block-driven-scheduling](./block-driven-scheduling.md)), block là thứ **duy nhất**
đặt task vào một giờ trên Day/Week View và vào capacity của ngày.

Habit **không** sinh block (sinh thẳng Calendar Item từ `habit.schedule`); Event cũng không
(tự expand — xem [event](./event.md)). Tổng quan engine: [schedule-engine](./schedule-engine.md).
</context>

<task>
Model `ScheduleBlock`, CRUD API, cascade khi nguồn bị xoá, và progress tính từ block gắn vào task.
</task>

<requirement>

## Dữ liệu — `src/server/models/schedule-block.model.ts`

| Field        | Kiểu                              | Ghi chú                              |
| ------------ | --------------------------------- | ------------------------------------ |
| `userId`     | ObjectId                          | index                                |
| `sourceType` | `'task' \| 'quest'`               | habit/event không có block           |
| `sourceId`   | ObjectId                          | ref Task hoặc Quest                  |
| `date`       | Date                              | ngày của phiên; API trả `YYYY-MM-DD` |
| `startTime`  | string `HH:MM` 24h                | bắt buộc — block luôn có giờ         |
| `duration`   | number phút, 1..1440              |                                      |
| `status`     | `'planned' \| 'done' \| 'missed'` | default `planned`                    |

Index `{userId, date}` (đọc theo khoảng ngày) và `{userId, sourceType, sourceId}` (đọc theo task).
`endTime` **không lưu** — luôn tính `startTime + duration` (clamp 23:59) ở engine.

## API — `src/app/api/v1/schedule-blocks/`

| Method + path                 | Việc                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `GET /schedule-blocks`        | Query tuỳ chọn `from`, `to` (bao trọn ngày `to`), `sourceType`, `sourceId`; sort `date, startTime` |
| `POST /schedule-blocks`       | `{sourceType, sourceId, date, startTime, duration}` — 404 nếu nguồn không thuộc user               |
| `PATCH /schedule-blocks/:id`  | Đổi bất kỳ `date`, `startTime`, `duration`, `status`                                               |
| `DELETE /schedule-blocks/:id` | Xoá cứng                                                                                           |

Zod qua `validateBody` / `validateSearchParams`. Client hooks ở
`src/features/schedule/hooks/useScheduleBlocks.ts` (`useScheduleBlocks`, `useTaskBlocks`, create/
update/delete). Mỗi mutation invalidate **cả ba**: `scheduleBlocks`, `calendar` và `['tasks']` — vì
task list mang progress, calendar mang giờ; thiếu một cái là một màn hình hiện số cũ.

## Cascade

| Hành động                                        | Block                                                     |
| ------------------------------------------------ | --------------------------------------------------------- |
| `DELETE /tasks/:id` (soft delete `active:false`) | xoá hết block của task                                    |
| `DELETE /quests/:id` (xoá cứng)                  | xoá hết block của quest — block mồ côi vẫn chiếm capacity |
| Archive project                                  | xoá block của mọi task con                                |
| `PATCH /tasks/:id {active:false}`                | **không** xoá — xem edge case                             |

## Task Progress — `src/server/helpers/schedule-block.helpers.ts`

Gắn vào mỗi task trong `GET /api/v1/tasks` (field tính, không lưu):

```txt
plannedMinutes   = Σ duration mọi block của task
completedMinutes = Σ duration block status = 'done'
progressPct      = min(100, round(completed / task.duration × 100)) — null nếu không có estimate
```

Aggregation tự cast id sang ObjectId — `$match` của aggregate không qua schema casting.

## Ai tạo block

- **SessionPlanner** (`src/features/schedule/components/SessionPlanner.tsx`) — thêm/sửa/xoá phiên,
  auto-fill. Giờ mặc định của phiên mới là **giờ hiện tại** (đọc lại mỗi lần mở planner, vì planner
  mounted sẵn khi đóng — chỉ dùng lazy init sẽ ra giờ lúc app load). Auto-fill chia `remaining`
  đều theo ngày của task (làm tròn 15'), mọi ngày bắt đầu cùng giờ hiện tại; phần dư đặt vào ngày
  cuối, **bắt đầu ngay sau block trước** để không tự chồng giờ.
- Kéo task vào slot ở Day View — xem [block-driven-scheduling](./block-driven-scheduling.md).
- `SessionUpdatePrompt` (`src/features/tasks/components/shared/`) sau khi đổi ngày task — dời mọi
  block sang `startDate` mới.
- AI assistant (`src/server/agent/tools.ts`) — xem [ai-task-agent](./ai-task-agent.md).

## Edge cases

- Overdue auto-archive và "Abandon" dùng `PATCH {active:false}` nên block **còn lại** trong DB.
  Calendar/Week View lọc task `active` nên không hiện, nhưng
  [task-suggestion](./task-suggestion.md) đọc block theo ngày không lọc nguồn.
- Không UI nào set `status: 'done' | 'missed'` cho block. Calendar suy `done` từ `task.status`,
  `missed` từ ngày đã qua — nên `completedMinutes` của progress hiện gần như luôn 0.
- Không chặn block nằm ngoài `[startDate, endDate]` của task; planner hiển thị chúng bình thường.

## Ngoài phạm vi

Hiển thị (→ [calendar-item](./calendar-item.md)), trùng giờ/quá tải
(→ [conflict-capacity](./conflict-capacity.md)), block cho quest từ UI (API cho phép, chưa có UI).

## Open questions

- Có nên cascade block khi `PATCH active:false` (archive/abandon) như `DELETE`?
- Block `done` nên được set khi tick task xong, hay bỏ hẳn `completedMinutes` khỏi progress?

</requirement>

<tone>Ngắn, chỉ ra nguồn sự thật và lý do cascade.</tone>
