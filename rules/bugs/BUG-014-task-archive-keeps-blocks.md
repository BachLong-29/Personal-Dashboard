# BUG-014 — Archive task (`active:false`) vẫn giữ session trong DB

|            |                                                             |
| ---------- | ----------------------------------------------------------- |
| Mức độ     | Trung bình                                                  |
| Loại       | Dữ liệu                                                     |
| Trạng thái | Mở                                                          |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                     |
| Spec       | [schedule-block.md](../docs/requirements/schedule-block.md) |

## Hiện tượng

`PATCH /tasks/:id` với `active: false` ẩn task đi nhưng không xoá ScheduleBlock của nó, khác với `DELETE`. Các block mồ côi vẫn có thể được tính vào thống kê hoặc mức dùng thời gian.

## Vị trí trong code

- `src/app/api/v1/tasks/[id]/route.ts:32,133`

## Hướng sửa đề xuất

Xoá (hoặc đánh dấu) các block khi task bị archive. Cần quyết định có khôi phục chúng khi task được mở lại không.
