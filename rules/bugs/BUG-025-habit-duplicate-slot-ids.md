# BUG-025 — Hai slot habit cùng một ngày tạo ra trùng id lịch

|            |                                                           |
| ---------- | --------------------------------------------------------- |
| Mức độ     | Trung bình                                                |
| Loại       | Bug                                                       |
| Trạng thái | Mở                                                        |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                   |
| Spec       | [calendar-item.md](../docs/requirements/calendar-item.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Id của mỗi mục lịch được tạo từ habit và ngày. Hai slot trong cùng một ngày cho ra cùng một id. Form đã chặn trường hợp này, nhưng API và trợ lý thì không.

## Vị trí trong code

- `src/app/api/v1/habits` (validate schedule)
- Phần build calendar item cho habit

## Hướng sửa đề xuất

Validate ở server (không trùng ngày giữa các slot), hoặc đưa giờ của slot vào id.
