# Reschedule Habit → Task

Cơ chế cho phép user dời một lần xuất hiện của habit sang giờ khác mà không thay đổi lịch gốc của habit.

---

## Mục tiêu

Habit có lịch cố định (Mon/Wed/Fri lúc 07:00). Đôi khi user muốn thực hiện habit đó sớm hơn hoặc muộn hơn trong một ngày cụ thể mà không ảnh hưởng các ngày khác.

---

## Cơ chế

Khi reschedule một habit occurrence:

1. Tạo một **Task** mới với `habitRef: habit._id` trỏ về habit gốc.
2. Task mới có `startDate = ngày đó`, `startTime = giờ mới`, `endDate = null` (single-day).
3. Ngày đó, task log thay thế habit log — không double count XP/coins.
4. Lịch gốc của habit không bị ảnh hưởng — các ngày khác vẫn chạy bình thường.

**Quan hệ:**

```
Habit (schedule gốc)
  └─ Task (habitRef → habit._id, startDate = ngày cụ thể, startTime = giờ mới)
```

---

## UI — RescheduleHabitModal ("Reschedule Ritual")

Mở khi user click vào một habit occurrence trong **DayView** (Tasks page).

### Slot Presets

Modal cung cấp 4 preset nhanh:

| Preset    | Glyph | Giờ mặc định |
| --------- | ----- | ------------ |
| Dawn      | ◐     | 07:00        |
| Deep Work | ❖     | 10:00        |
| Afternoon | ☉     | 14:00        |
| Twilight  | ☾     | 19:00        |

Preset trùng với giờ hiện tại của habit sẽ bị disabled (label "current").

### Custom Time

Ngoài preset, user có thể nhập giờ tùy ý qua `<input type="time">`. Khi nhập custom time, nó override preset đang chọn.

### Preview

Khi đã chọn giờ (preset hoặc custom), hiển thị preview:

```
↷ [Habit name] will move to [HH:MM]
```

### Actions

- **Cancel** — đóng modal, không làm gì.
- **↷ Reschedule** — gọi `POST /api/v1/tasks` với `habitRef` và `startTime` mới.

---

## API

```
POST /api/v1/tasks
Body: {
  name:      string         // tên habit
  icon:      string         // icon habit
  tagId:     string         // tagId của habit
  color:     TaskColor      // color của habit
  startDate: "YYYY-MM-DD"   // ngày reschedule
  startTime: "HH:MM"        // giờ mới
  habitRef:  string         // habit._id
  status:    'todo'
}
```

Không có endpoint riêng — dùng `POST /api/v1/tasks` thông thường.

---

## Counting & Rewards

- Khi task được toggle done (qua `POST /api/v1/task-logs`), rewards giống task thường: **60 XP + 15 coins**.
- Habit log cho ngày đó **không được tạo thêm** — ngày đó, task log là nguồn sự thật.
- Logic tránh double count: dashboard check `habitRef` để biết habit này đã được handle bởi task.

---

## Edge Cases

- Nếu user reschedule cùng một habit **nhiều lần** trong cùng một ngày → nhiều tasks `habitRef` cùng ngày — behavior hiện tại cho phép, nhưng nên tránh.
- Nếu habit bị xóa (soft delete) sau khi đã tạo task reschedule → task vẫn tồn tại và hoạt động bình thường (không bị ảnh hưởng).

---

## Trạng thái hiện tại

✅ Đã implement: `habitRef` field trong Task model, RescheduleHabitModal UI với slot presets + custom time + preview.

🟡 Chưa làm:

- Logic tránh tạo nhiều reschedule task cho cùng 1 habit trong 1 ngày.
- Hiển thị rõ ràng trong DayView rằng habit đã được reschedule (phân biệt với habit occurrence gốc).
- Sync ngược: nếu task reschedule bị xóa, habit log của ngày đó có tự restore không.
