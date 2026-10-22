# Reschedule Habit → Task — dời một lần xuất hiện của habit

<role>Fullstack engineer cho phép dời giờ một buổi habit mà không đụng lịch gốc</role>

<context>
Habit có lịch tuần cố định (T2-4-6 lúc 07:00 — xem [habits](./habits.md)). Thỉnh thoảng user muốn
làm buổi **hôm nay** sớm hoặc muộn hơn mà các ngày khác giữ nguyên. Sửa schedule của habit là
sai công cụ — nó đổi mọi tuần.

Cơ chế này cũng là tiền lệ cho override của [event](./event.md): bản ghi thay thế trỏ ngược về
nguồn gốc, thay vì một collection override riêng.
</context>

<task>
Từ Day view, dời một occurrence habit sang giờ khác bằng cách sinh một Task có `habitRef` và một
ScheduleBlock mang giờ mới.
</task>

<requirement>

## Cơ chế

1. Tạo **Task** qua `POST /api/v1/tasks` (không có endpoint riêng):

   | Field                      | Giá trị                                    |
   | -------------------------- | ------------------------------------------ |
   | `name`                     | tên habit (xem câu hỏi mở về cách lấy tên) |
   | `icon` · `color` · `tagId` | của habit (`tagId` fallback `'habit'`)     |
   | `startDate`                | **hôm nay** (`todayStr`)                   |
   | `duration`                 | `habit.duration`, mặc định 15              |
   | `habitRef`                 | `habit._id`                                |

2. Tạo xong → `POST` ScheduleBlock `{ sourceType: 'task', sourceId, date: hôm nay, startTime:
giờ mới, duration: est ?? 30 }`. **Task không còn trường giờ** — giờ chỉ nằm trên block
   ([schedule-block](./schedule-block.md)), nên spec cũ "task có `startTime`" đã sai.
3. Lịch gốc của habit không đổi; các ngày khác chạy bình thường.

```
Habit (schedule gốc)
  └─ Task (habitRef → habit._id, startDate = hôm nay)
       └─ ScheduleBlock (date = hôm nay, startTime = giờ mới)
```

Code: `onRescheduleHabit` trong `src/features/dashboard/hooks/useScheduleDayTasks.ts`.

## Chống double count

- **Server** (`buildCalendar`): task có `habitRef` + `startDate` = D → bỏ occurrence habit ngày D.
- **Client** (`useScheduleDayTasks`, `useWeekTasks`): habit có task `habitRef` cùng **hôm nay**
  → card habit mang `cancelled: true`.
- Ngày đó task là nguồn sự thật: tick task → `status: 'done'` → **60 XP + 15 coin** (thưởng của
  task, không phải 30/10 của habit). Không tạo HabitLog.

## UI

**Lối vào:** nút `⏱ Reschedule` trong phần mở rộng của `QuestCard` cho item `source === 'habit'`,
ở Day view của cả `/tasks` (`TaskDayView`) lẫn dashboard (`ScheduleDayViewPanel` → `TaskDayView`).

**`RescheduleHabitModal`** — `src/features/tasks/components/day/RescheduleHabitModal.tsx`,
tiêu đề "Reschedule Ritual":

| Preset    | Glyph | Giờ   |
| --------- | ----- | ----- |
| Dawn      | ◐     | 07:00 |
| Deep Work | ❖     | 10:00 |
| Afternoon | ☉     | 14:00 |
| Twilight  | ☾     | 19:00 |

- Preset trùng giờ hiện tại: disabled, nhãn "current". Mặc định chọn preset đầu tiên khác giờ hiện tại.
- `<input type="time">` tuỳ ý — có giá trị thì đè preset.
- Preview `↷ [tên] will move to [HH:MM]`. Actions: Cancel · ↷ Reschedule.

**Optimistic:** card habit gốc chuyển `cancelled` → gạch ngang + badge **MOVED**; task tạm chèn
vào slot theo giờ (`<10` morning · `<13` deep · `<17` afternoon · còn lại evening). Lỗi → hoàn tác.

## Edge cases

- Reschedule cùng habit **nhiều lần** trong ngày → nhiều task `habitRef` — vẫn được phép.
- Habit bị xoá (hard delete) sau khi reschedule → task vẫn sống, `habitRef` trỏ vào habit không
  còn tồn tại; không ảnh hưởng gì.
- Xoá task reschedule → `buildCalendar` không còn thấy `habitRef`, occurrence habit tự hiện lại.

## Câu hỏi mở / lỗi phát hiện khi đối chiếu code

- **Tên bị cắt chữ đầu:** cả modal lẫn payload dùng `title.replace(/^\S+\s+/, '')` để bỏ emoji
  đầu title. Từ `0375a0c` title habit không còn mang icon → "Morning Run" thành "Run".
- **Luôn là hôm nay:** `startDate`/block dùng `todayStr`, không phải ngày đang xem. Bấm Reschedule
  trên habit của ngày khác sẽ tạo task cho hôm nay. Nên giới hạn nút ở hôm nay hay dùng ngày chọn?
- **Rollback lỗi:** nhánh `onError` nối `ts.filter(...)` với `ts.map(...)` → danh sách bị nhân đôi.
- Task tạo được nhưng block lỗi (bước 2) → task không giờ vẫn tồn tại, habit ngày đó đã bị ẩn;
  không có hoàn tác cho nhánh này.

</requirement>

<tone>Concise, technical. Không endpoint mới — dùng Task + ScheduleBlock sẵn có.</tone>
