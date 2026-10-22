# Week View — lập kế hoạch tuần bằng kéo-thả và chọn task

<role>Fullstack engineer giữ Week View của tab Schedule trên dashboard</role>

<context>
Week View là chỗ **lập kế hoạch**: 7 cột ngày, mỗi cột là danh sách item sắp theo giờ (không phải
timeline). Component sống ở `src/features/dashboard/components/schedule/WeekView.tsx`, được
`ScheduleView.tsx` render ở sub-tab `week`.

`TaskWeekView` cũ (`src/features/tasks/components/week/`) **không còn được mount** từ 06/2026; các
dialog Strict/Flexible (`WeekDropDialog`) và "lần này / toàn bộ" (`HabitEditScopeDialog`) nằm ở đó
và hiện là code chết. Xem §Chưa có.
</context>

<task>
Hiển thị tuần đang xem từ 4 nguồn, cho kéo task/quest đổi ngày, và gắn task có sẵn vào một ngày.
</task>

<requirement>

## Nội dung một cột

| Nguồn | Lấy từ                                                         | Kéo được?                                  |
| ----- | -------------------------------------------------------------- | ------------------------------------------ |
| Task  | block trong tuần; không có block → span `[startDate, endDate]` | ✅ trừ task có `endDate` (span nhiều ngày) |
| Quest | `dueDate`, giờ `dueTime`                                       | ✅ → `moveQuest({dueDate})`                |
| Habit | `habit.schedule` khớp thứ trong tuần                           | ❌ — bấm mở tab Habits                     |
| Event | `useEventOccurrences`                                          | ❌ — bấm event lặp → hỏi bỏ buổi này       |

Item có giờ xếp tăng dần, item không giờ xuống cuối. Habit chỉ hiện ✓ ở cột hôm nay (chỉ đọc log
hôm nay). Event đang diễn ra hiện `EventFlame` (đồng hồ tick `LIVE_TICK_MS`). Task bị dependency chặn
hiện 🔒.

Vì sao task span không kéo được: nó xuất hiện trên **mọi** ngày nó phủ, kéo một ngày trong đó là cách
mơ hồ để dời cả khoảng. Sửa ngày qua edit modal. dnd-kit được tắt ở sensor nên không nhấc lên, cursor
cũng không gợi ý grab.

## Header ngày

- Cột hôm nay được tô nền đậm hơn (`dayColToday`) và nhãn ngày nổi bật.
- Bấm nhãn ngày → sang Day View ngày đó.
- Đồng hồ tải: `phút block task + phút event busy có giờ` / `settings.dailyCapacityMinutes`
  (default 600). Chỉ đếm cái **đang hiện** — tắt task/event thì giờ của chúng cũng rời đồng hồ; một
  tổng mà cột không giải thích được còn tệ hơn không có tổng.
- Nút `+` (`DayActionMenu`): **Add task** (mở `AddTaskModal` điền sẵn `startDate`) hoặc
  **Pick task**.

## Pick task — `TaskPickerModal.tsx`

- Ô tìm kiếm (`useTaskSearch`, 20 kết quả), lọc task active, chưa done, chưa có mặt trong ngày.
- Khi chưa gõ gì: khối **"✦ Suggested from backlog"** từ `useTaskSuggestions(date)`
  ([task-suggestion](./task-suggestion.md)); kết quả tìm kiếm không lặp lại task đã được gợi ý.
- Chọn → `PATCH /tasks/:id {startDate: day, endDate: day}` — gom task về đúng một ngày.

## Kéo task sang ngày khác

1. Thả cùng ngày → bỏ qua.
2. `PATCH` task: `startDate` (và `endDate` nếu có) dời theo số ngày chênh lệch.
3. Task có block trong tuần → mở `SessionUpdatePrompt` (Move to date · Manage schedule · Later), như
   ở edit modal và overdue review. Id block đọc **trước** khi ghi vì mutation invalidate danh sách.
   Không có block → dời im lặng.

Sensor: chuột cần kéo 8px; chạm cần giữ 250ms (tolerance 5px) để ngón tay vẫn cuộn được cột.

## Bộ lọc hiển thị

4 switch `showTasks · showQuests · showHabits · showEvents` (`useScheduleState`, lưu
`localStorage`, merge sâu với default để key mới không thành "tắt" với state cũ). Dùng chung cho Day
và Week. Khi có switch tắt → hiện nút "show all" màu cảnh báo. Màn hẹp gom 4 switch vào
`ScheduleDisplayMenu`, trigger vẫn hiện glyph sáng/tối. Chế độ "events-only" từng có rồi bị bỏ khi
có switch thứ tư — nó chỉ là ba switch kia tắt.

## Sub-tab

Chỉ `day` và `week` (`SUB_TABS` trong `ScheduleView.tsx`). **Month đang được cất**: code giữ nguyên,
thêm `'month'` lại vào list là hiện lại. State đã lưu `month` hoặc notification trỏ tới month đều
rơi về `day`.

## Chưa có (spec cũ, chưa nối vào view đang chạy)

- Validate task ngoài `[startDate, dueDate]` + chế độ **Strict / Flexible**. `scheduleMode` có trong
  `UserSetting.schedule` (default `flexible`) nhưng không ai đọc.
- Prompt "chỉnh lần này / toàn bộ habit" khi sửa habit — habit hiện không kéo được.
- `handleDragEnd` vẫn có nhánh habit (dời ngày trong `habit.schedule`) nhưng không có item habit nào
  draggable nên không chạy được.

## Open questions

- Xoá hẳn `TaskWeekView` + 2 dialog chết, hay nối Strict/Flexible vào `WeekView`?
- Pick task ghi đè `endDate` của task nhiều ngày — có cố ý không?

</requirement>

<tone>Mô tả đúng cái đang chạy; tách rõ phần chưa có.</tone>
