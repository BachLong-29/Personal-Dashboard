# BUG-017 — Tạo category trùng tên trả 500 thay vì 409

|            |                                                 |
| ---------- | ----------------------------------------------- |
| Mức độ     | Trung bình                                      |
| Loại       | Bug                                             |
| Trạng thái | Mở                                              |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code         |
| Spec       | [category.md](../docs/requirements/category.md) |

## Hiện tượng

Model có unique index `(userId, name)`. Tạo trùng tên làm Mongo ném lỗi E11000 mà route không bắt, nên client nhận 500.

## Vị trí trong code

- `src/server/models/category.model.ts:30`
- `src/app/api/v1/categories/route.ts` — POST

## Hướng sửa đề xuất

Bắt mã lỗi 11000 và trả 409 kèm thông báo rõ ràng.
