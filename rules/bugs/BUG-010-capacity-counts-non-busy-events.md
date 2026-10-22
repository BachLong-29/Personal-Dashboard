# BUG-010 — Insights tính cả event không bận vào tổng thời gian đã dùng

|            |                                                                   |
| ---------- | ----------------------------------------------------------------- |
| Mức độ     | Trung bình                                                        |
| Loại       | Bug                                                               |
| Trạng thái | Mở                                                                |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                           |
| Spec       | [conflict-capacity.md](../docs/requirements/conflict-capacity.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Phần insights tính cả event `busy: false` và task không có giờ vào tổng thời gian đã dùng trong ngày. Thanh hiển thị mức dùng trong ngày ở week view thì không tính hai loại này, nên hai con số lệch nhau.

## Vị trí trong code

- API insights được mô tả trong `conflict-capacity.md`
- Thanh hiển thị mức dùng trong ngày ở week view của dashboard

## Hướng sửa đề xuất

Thống nhất một hàm tính dùng chung, bỏ event không bận.
