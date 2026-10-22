# BUG-039 — TaskWeekView, WeekStats và các hộp thoại Strict/Flexible không còn được hiển thị

|            |                                                                             |
| ---------- | --------------------------------------------------------------------------- |
| Mức độ     | Thấp                                                                        |
| Loại       | Code chết                                                                   |
| Trạng thái | Mở                                                                          |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                                     |
| Spec       | [week-view-rescheduling.md](../docs/requirements/week-view-rescheduling.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Các component này không được hiển thị ở đâu từ 24/06. `scheduleMode` vẫn được lưu nhưng không ai đọc.

## Vị trí trong code

- `src/features/tasks/components/week`
- `week-stats.md`

## Hướng sửa đề xuất

Xoá, hoặc đưa lại vào dashboard.
