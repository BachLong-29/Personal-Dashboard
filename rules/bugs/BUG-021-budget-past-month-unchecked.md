# BUG-021 — Server cho tạo ngân sách cho tháng đã qua

|            |                                                             |
| ---------- | ----------------------------------------------------------- |
| Mức độ     | Trung bình                                                  |
| Loại       | Bug                                                         |
| Trạng thái | Mở                                                          |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                     |
| Spec       | [finance-budget.md](../docs/requirements/finance-budget.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Việc chặn tạo ngân sách cho tháng đã qua chỉ có ở giao diện; gọi API thẳng vẫn tạo được.

## Vị trí trong code

- `src/app/api/v1/finance/budgets`

## Hướng sửa đề xuất

Kiểm tra tháng ở server, trả 400.
