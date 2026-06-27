# Task System

Tasks là công việc có ngày bắt đầu cụ thể. Khác với Quests (không có deadline rõ ràng), Tasks hỗ trợ cả single-day và multi-day execution.

---

## Task Properties

```typescript
{
  name:         string       // tên, tối đa 100 ký tự
  note:         string?      // ghi chú, tối đa 500 ký tự
  tagId:        string       // category
  color:        TaskColor    // màu hiển thị
  icon:         string       // emoji
  status:       TaskStatus   // trạng thái hiện tại
  duration:     number?      // ước tính thời gian (phút), 1-1440
  startDate:    string       // "YYYY-MM-DD"
  startTime:    string?      // "HH:MM", khi reschedule habit
  endDate:      string?      // "YYYY-MM-DD" — nếu null → single-day
  habitRef:     ObjectId?    // trỏ tới habit gốc nếu là reschedule
  deferReason:  string?      // lý do dời task, tối đa 200 ký tự
  dependencies: ObjectId[]   // task IDs phải xong trước
  active:       boolean      // soft delete
}
```

### Task Status Flow

```
todo ──────────────► in_progress ──────► done
  │                      │
  └──────────────────► waiting
                    (bị block bởi dependency)
                         │
                         └──────► pending
                              (tạm hoãn)
```

- **todo:** Chưa bắt đầu
- **in_progress:** Đang thực hiện (auto-set khi log ngày đầu tiên của multi-day task)
- **pending:** Đang chờ / tạm hoãn
- **waiting:** Blocked bởi task dependency chưa xong
- **done:** Hoàn thành

---

## Single-Day vs Multi-Day

### Single-Day Task

- `endDate` không có (hoặc bằng `startDate`)
- "Done" = `status === 'done'`
- Toggle: `updateTask({ status: newDone ? 'done' : 'todo' })`
- Rewards: **60 XP + 15 coins** khi set done

### Multi-Day Task

- `endDate > startDate`
- "Done for today" = có TaskLog với `date = today`
- Toggle: `toggleTaskLog({ taskId, date: today })`
  - Lần đầu log: auto-update `status: 'in_progress'`
- Rewards: **60 XP + 15 coins** mỗi ngày khi log (không phải khi complete cuối)

**Lưu ý:** Task log và task status là hai khái niệm riêng biệt cho multi-day tasks.

---

## Task trong Dashboard (Today's Tasks)

Tasks xuất hiện trong QuestPanel nếu:

```typescript
task.active === true &&
  task.startDate <= todayDateStr &&
  (task.endDate ?? task.startDate) >= todayDateStr;
```

Tức là: task còn active và ngày hôm nay nằm trong range [startDate, endDate].

---

## CRUD Operations

| Action     | API                                     | Notes                           |
| ---------- | --------------------------------------- | ------------------------------- |
| Danh sách  | `GET /api/v1/tasks`                     | Có thể filter theo date, status |
| Tạo mới    | `POST /api/v1/tasks`                    |                                 |
| Cập nhật   | `PATCH /api/v1/tasks/:id`               | Cập nhật bất kỳ field           |
| Xoá (soft) | `DELETE /api/v1/tasks/:id`              | Set `active: false`             |
| Task logs  | `GET /api/v1/task-logs?date=YYYY-MM-DD` | Logs của ngày cụ thể            |
| Toggle log | `POST /api/v1/task-logs`                | Upsert daily session log        |

---

## Task Views (Tasks Page)

Route: `/tasks`

| View       | Mô tả                                     |
| ---------- | ----------------------------------------- |
| Day View   | Tasks của một ngày, sorted theo startTime |
| Week View  | 7-column grid, tasks hiển thị theo ngày   |
| Month View | Calendar grid với task counts             |
| All View   | Table tất cả tasks với filter/search      |

---

## Dependencies

Task có thể phụ thuộc vào task khác:

```typescript
task.dependencies: ObjectId[]  // danh sách task IDs phải xong trước
```

- Nếu có dependency chưa done → task nên ở status `waiting`
- Hiển thị dependency chain trong UI (planned feature)

---

## Task Colors

Cùng palette với Habit: `gold` | `mint` | `violet` | `cyan` | `rose` | `amber` | `blue`

---

## Defer Task

User có thể đánh dấu task "không thể hoàn thành hôm nay" và dời sang ngày khác:

- Trigger: checkbox trong `EditTaskModal`
- Chọn lý do (chip cố định hoặc tự nhập, max 200 ký tự):
  - "Quá bận / hết thời gian"
  - "Bị chặn / chờ người khác"
  - "Ưu tiên thay đổi đột xuất"
  - "Sức khỏe / cá nhân"
- Chọn ngày mới (mặc định ngày mai, không chọn quá khứ)
- Submit: `PATCH /api/v1/tasks/:id` với `{ startDate, deferReason }`
- Badge "↺ Rescheduled" hiển thị trên TaskCard khi `deferReason` tồn tại

---

## Reschedule Habit → Task

Khi user muốn dời một lần xuất hiện của habit sang giờ khác:

1. Tạo Task với `habitRef: habit._id` và `startTime: "HH:MM"`
2. Ngày đó, task log thay thế habit log
3. Task được đánh dấu done bình thường

Cơ chế này cho phép flexibility mà không phá vỡ habit schedule gốc.
