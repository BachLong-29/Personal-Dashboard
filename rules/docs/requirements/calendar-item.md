# Calendar Item

<role>Lớp chuẩn hóa chung — đối tượng duy nhất mà Dashboard/Views hiển thị.</role>

<context>
Spec [schedule-engine](./schedule-engine.md) mục 3 & 8: Dashboard **không** làm việc trực tiếp với
Habit/Quest/Task. Mọi thứ được quy đổi về `Calendar Item`. Hiện tại các view đang đọc thẳng 3 model
khác nhau → logic trùng lặp, khó thêm conflict/capacity. Cần một lớp normalize tập trung.
</context>

<task>
Xây **Schedule Engine service** sinh ra danh sách `CalendarItem` cho một khoảng ngày, từ 3 nguồn:
Habit (trực tiếp), Task & Quest (qua [schedule-block](./schedule-block.md)).
</task>

---

## Luồng quy đổi

```txt
Habit  ──(schedule rule + override)──►  CalendarItem
Task   ──► ScheduleBlock ──►            CalendarItem
Quest  ──► ScheduleBlock ──►            CalendarItem
                                        (Quest chỉ-deadline → CalendarItem all-day)
```

---

## Shape (DTO, không nhất thiết lưu DB)

```typescript
interface CalendarItem {
  id: string; // ổn định: `${sourceType}:${sourceId}:${date}`
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string | null; // HH:MM, null = all-day / chỉ deadline
  endTime: string | null;
  status: 'planned' | 'done' | 'missed';
  sourceType: 'habit' | 'quest' | 'task';
  sourceId: string;
  icon: string;
  color: string;
  meta?: {
    // tùy nguồn
    isOverride?: boolean; // habit occurrence đã bị đổi
    blockId?: string; // nếu sinh từ ScheduleBlock
    deadline?: boolean; // quest dạng deadline-only
  };
}
```

---

## Engine API

```txt
GET /api/v1/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&view=day|week|month
```

Trả về `CalendarItem[]` đã merge + sort theo `(date, startTime)`.

**Logic sinh:**

1. **Habit** — với mỗi ngày trong range, áp `schedule` rule → occurrence. Nếu ngày đó có
   habit-reschedule task → bỏ occurrence gốc, dùng task (tránh double count — cơ chế `habitRef`).
2. **Task** — lấy ScheduleBlock trong range → mỗi block 1 item. Task không có block nhưng có
   `startDate` trong range → 1 item fallback (dùng `startTime` legacy).
3. **Quest** — có block → theo block; chỉ có `dueDate` → all-day item (`startTime: null`) đặt ở deadline.

---

## Status mapping

| Nguồn      | done khi                 | missed khi               |
| ---------- | ------------------------ | ------------------------ |
| habit      | có HabitLog done ngày đó | ngày qua, không log      |
| task block | block.status=done        | block.status=missed      |
| quest      | quest.done               | dueDate qua mà chưa done |

---

## Vì sao không lưu CalendarItem thành collection riêng

Spec mục 16 có bảng `calendar_items`, nhưng MVP nên **tính on-the-fly** (derived view) để tránh
đồng bộ 2 chiều phức tạp. Có thể cache sau. → Ghi chú: triển khai dạng service/derived, **không**
tạo collection vật lý ở giai đoạn này.

---

## Tiêu thụ bởi

- Day / Week / Month View (thay vì đọc thẳng Task/Habit/Quest).
- [conflict-capacity](./conflict-capacity.md), [schedule-statistics](./schedule-statistics.md),
  [schedule-notifications](./schedule-notifications.md).

---

## Trạng thái hiện tại

❌ Chưa có. Các view (`features/tasks`, `features/dashboard`) đang đọc trực tiếp từng model riêng.
