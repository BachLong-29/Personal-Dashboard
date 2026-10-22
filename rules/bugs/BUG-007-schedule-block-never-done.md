# BUG-007 — Session không bao giờ được đánh dấu xong, tiến độ luôn 0

|            |                                                             |
| ---------- | ----------------------------------------------------------- |
| Mức độ     | Trung bình                                                  |
| Loại       | Bug                                                         |
| Trạng thái | Mở                                                          |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                     |
| Spec       | [schedule-block.md](../docs/requirements/schedule-block.md) |

## Hiện tượng

`completedMinutes` được tính từ các block có `status: 'done'`, nhưng không có đường nào đặt `done`/`missed` (kể cả khi tick xong task). Tiến độ theo giờ của task/project vì vậy luôn bằng 0.

## Vị trí trong code

- `src/server/helpers/schedule-block.helpers.ts:22-46`
- Các route/hook tick task (`useScheduleDayTasks`, `/api/v1/tasks/:id`)

## Hướng sửa đề xuất

Quyết định luật: tick task thì đánh dấu các block đã qua là `done`? Hay thêm nút đánh dấu từng session? Sau đó cài đặt và bổ sung vào spec.
