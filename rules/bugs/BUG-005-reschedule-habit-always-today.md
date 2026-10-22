# BUG-005 — Reschedule habit luôn tạo task cho hôm nay

|            |                                                                 |
| ---------- | --------------------------------------------------------------- |
| Mức độ     | Cao                                                             |
| Loại       | Bug                                                             |
| Trạng thái | Mở                                                              |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                         |
| Spec       | [reschedule-habit.md](../docs/requirements/reschedule-habit.md) |

## Hiện tượng

Task được tạo với `startDate: todayStr`. Bấm reschedule khi đang xem ngày khác thì task vẫn rơi vào hôm nay, và deadline vẫn ghi `Today · HH:MM`.

## Vị trí trong code

- `src/features/dashboard/hooks/useScheduleDayTasks.ts:548-560`

## Hướng sửa đề xuất

Dùng ngày đang xem (`date` của hook) cho `startDate`, block và nhãn deadline.
