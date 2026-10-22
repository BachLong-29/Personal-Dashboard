# BUG-030 — Cài đặt "nhắc trước N phút" không ảnh hưởng thời điểm nhắc

|            |                                                                             |
| ---------- | --------------------------------------------------------------------------- |
| Mức độ     | Thấp                                                                        |
| Loại       | Bug                                                                         |
| Trạng thái | Mở                                                                          |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                                     |
| Spec       | [schedule-notifications.md](../docs/requirements/schedule-notifications.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Giá trị lead chỉ được chèn vào nội dung thông báo; thời điểm tạo thông báo không dùng nó.

## Vị trí trong code

- `src/app/api/v1/notifications` — generator

## Hướng sửa đề xuất

Dùng lead để tính thời điểm tạo, hoặc bỏ cài đặt này.
