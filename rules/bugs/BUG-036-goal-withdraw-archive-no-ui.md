# BUG-036 — Rút tiền khỏi goal tiết kiệm và archive goal không có nút trên web

|            |                                                           |
| ---------- | --------------------------------------------------------- |
| Mức độ     | Thấp                                                      |
| Loại       | Thiếu UI                                                  |
| Trạng thái | Mở                                                        |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                   |
| Spec       | [finance-goals.md](../docs/requirements/finance-goals.md) |

## Hiện tượng

API đã hỗ trợ rút tiền khỏi goal và archive goal, nhưng web không có nút cho hai thao tác này.

## Vị trí trong code

- `src/app/api/v1/finance/goals`
- `src/app/[locale]/(protected)/finance/goals`

## Hướng sửa đề xuất

Thêm hành động vào menu của goal card.
