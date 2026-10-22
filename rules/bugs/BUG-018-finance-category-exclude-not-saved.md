# BUG-018 — `POST /finance/categories` không lưu `excludeFromTotals`

|            |                                                                     |
| ---------- | ------------------------------------------------------------------- |
| Mức độ     | Trung bình                                                          |
| Loại       | Bug                                                                 |
| Trạng thái | Mở                                                                  |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                             |
| Spec       | [finance-categories.md](../docs/requirements/finance-categories.md) |

## Hiện tượng

Schema của POST nhận `excludeFromTotals`, nhưng giá trị không được ghi khi tạo. Phải sửa lại category sau khi tạo thì cờ này mới có.

## Vị trí trong code

- `src/app/api/v1/finance/categories/route.ts:49` (validate) và phần `create`

## Hướng sửa đề xuất

Truyền `excludeFromTotals` vào lệnh tạo.
