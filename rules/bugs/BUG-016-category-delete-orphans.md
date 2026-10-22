# BUG-016 — Xoá category làm task/event mất nhãn

|            |                                                 |
| ---------- | ----------------------------------------------- |
| Mức độ     | Trung bình                                      |
| Loại       | Dữ liệu                                         |
| Trạng thái | Mở                                              |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code         |
| Spec       | [category.md](../docs/requirements/category.md) |

## Hiện tượng

`DELETE /categories/:id` xoá category nhưng không kiểm tra hay cập nhật các Task/Habit/Event đang dùng `tagId` đó.

## Vị trí trong code

- `src/app/api/v1/categories/[id]/route.ts:57-76`

## Hướng sửa đề xuất

Trả 409 khi category đang được dùng (như finance categories), hoặc gán các mục đó sang một category mặc định.
