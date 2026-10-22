# BUG-006 — Reschedule habit lỗi thì danh sách bị nhân đôi

|            |                                                                 |
| ---------- | --------------------------------------------------------------- |
| Mức độ     | Cao                                                             |
| Loại       | Bug                                                             |
| Trạng thái | Mở                                                              |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                         |
| Spec       | [reschedule-habit.md](../docs/requirements/reschedule-habit.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Trước khi gọi API, code thêm task mới vào danh sách (optimistic update). Khi API lỗi, bước hoàn tác lại khôi phục cả danh sách cũ vào danh sách hiện tại, nên các dòng bị nhân đôi.

## Vị trí trong code

- `src/features/dashboard/hooks/useScheduleDayTasks.ts` — nhánh `onError` của `createTask.mutate` trong reschedule

## Hướng sửa đề xuất

Hoàn tác bằng snapshot đã lưu trước khi đổi (`setTasks(snapshot)`), hoặc chỉ gỡ `newTask` và bỏ cờ `cancelled`.
