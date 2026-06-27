# Schedule Block

<role>Domain model & API cho phiên làm việc cụ thể của Task/Quest.</role>

<context>
Hiện tại Task chỉ có **1** `startTime` duy nhất → không thể chia một task lớn (estimate 16h)
thành nhiều phiên làm việc qua nhiều ngày. Spec [schedule-engine](./schedule-engine.md) mục 7
yêu cầu mỗi task/quest có thể sinh nhiều **Schedule Block** — mỗi block là một lần ngồi làm.
</context>

<task>
Thêm model `ScheduleBlock` + API CRUD, và tính **Task Progress** dựa trên tổng thời lượng block đã hoàn thành.
</task>

---

## Mục tiêu

- Một Task `Build Dashboard` (estimate 16h) được chia thành nhiều block:

| Ngày  | Giờ   | Thời lượng |
| ----- | ----- | ---------- |
| 03/06 | 08:00 | 2h         |
| 04/06 | 08:00 | 2h         |
| 05/06 | 08:00 | 4h         |

- Habit **không** sinh Schedule Block (sinh trực tiếp Calendar Item — xem [calendar-item](./calendar-item.md)).

---

## Data Model — `schedule_blocks`

```typescript
interface IScheduleBlock {
  _id: ObjectId;
  userId: ObjectId; // index
  sourceType: 'task' | 'quest'; // habit không tạo block
  sourceId: ObjectId; // ref Task hoặc Quest
  date: Date; // ngày local midnight
  startTime: string; // "HH:MM" 24h
  duration: number; // phút (min 1, max 1440)
  status: 'planned' | 'done' | 'missed';
  createdAt: Date;
  updatedAt: Date;
}
```

Index: `{ userId, date }`, `{ userId, sourceType, sourceId }`.

**Quy tắc:**

- `endTime` không lưu — tính từ `startTime + duration`.
- Khi `sourceId` (task/quest) bị xóa/archive → cascade xóa các block của nó.
- `status: missed` set khi `date < hôm nay` mà chưa `done` (job hoặc tính lazy lúc đọc).

---

## Task Progress

```txt
progress = Σ(duration block status=done) / task.duration (estimate)
```

- Trả về trong response của Task (field tính toán, không lưu): `{ plannedMinutes, completedMinutes, progressPct }`.
- Nếu task không có `duration` → progress = null (không hiển thị %).

---

## API

```txt
GET    /api/v1/schedule-blocks?from=YYYY-MM-DD&to=YYYY-MM-DD   # list theo range
POST   /api/v1/schedule-blocks                                 # tạo block
PATCH  /api/v1/schedule-blocks/:id                             # đổi date/startTime/duration/status
DELETE /api/v1/schedule-blocks/:id
```

POST body:

```jsonc
{
  "sourceType": "task",
  "sourceId": "<taskId>",
  "date": "2026-06-03",
  "startTime": "08:00",
  "duration": 120,
}
```

Validation: Zod qua `src/server/validate.ts`. Block phải thuộc task/quest của chính user.

---

## Quan hệ với schema Task hiện tại

- Giữ nguyên `Task.startTime` (legacy single-session) — coi như task có **0 hoặc 1** block ngầm.
- Khi task có ≥1 ScheduleBlock thật → `startTime` legacy bị bỏ qua, dùng block làm nguồn sự thật.
- Migration: không bắt buộc — task cũ vẫn chạy với `startTime`.

---

## Out of scope (file này)

- Hiển thị block trên Day/Week View → thuộc [calendar-item](./calendar-item.md).
- Phát hiện 2 block trùng giờ → thuộc [conflict-detection](./conflict-capacity.md).
- Tự động chia block (auto time-blocking) → Phase sau (AI Planner).

---

## Trạng thái hiện tại

❌ Chưa có model, API, hay khái niệm "phiên làm việc". Task chỉ có 1 `startTime`.
