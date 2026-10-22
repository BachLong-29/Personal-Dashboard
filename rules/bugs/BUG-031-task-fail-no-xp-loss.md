# BUG-031 — Task bỏ dở quá 7 ngày không bị trừ XP như spec cũ mô tả

|            |                                                                           |
| ---------- | ------------------------------------------------------------------------- |
| Mức độ     | Thấp                                                                      |
| Loại       | Cần quyết định                                                            |
| Trạng thái | Mở                                                                        |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                                   |
| Spec       | [overdue-task-handling.md](../docs/requirements/overdue-task-handling.md) |

## Hiện tượng

Spec cũ có mức phạt XP cho task quá hạn hơn 7 ngày, nhưng code không trừ.

## Vị trí trong code

- `src/features/tasks/hooks/useOverdueReview.ts`
- `src/app/api/v1/penalty`

## Hướng sửa đề xuất

Cần quyết định: thêm lại mức phạt, hay bỏ hẳn khỏi thiết kế.
