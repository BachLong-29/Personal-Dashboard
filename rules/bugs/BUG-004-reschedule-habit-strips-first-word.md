# BUG-004 — Reschedule habit cắt mất từ đầu tiên của tên

|            |                                                                 |
| ---------- | --------------------------------------------------------------- |
| Mức độ     | Cao                                                             |
| Loại       | Bug                                                             |
| Trạng thái | Mở                                                              |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                         |
| Spec       | [reschedule-habit.md](../docs/requirements/reschedule-habit.md) |

## Hiện tượng

Code bỏ từ đầu tiên của tên bằng `title.replace(/^\S+\s+/, '')`, vì trước đây tiêu đề habit bắt đầu bằng icon. Giờ icon là field riêng, nên "Morning Run" thành task "Run".

## Vị trí trong code

- `src/features/dashboard/hooks/useScheduleDayTasks.ts:556`
- `src/features/tasks/components/day/RescheduleHabitModal.tsx:61`
- `src/features/tasks/components/day/ScheduleStrip.tsx:253` (cắt khi `entry.icon` có giá trị)

## Hướng sửa đề xuất

Dùng thẳng `title` (icon đã ở field riêng). Kiểm tra lại cả `ScheduleStrip`.
