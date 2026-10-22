# BUG-026 — Dòng done/total khi share tính cả event

|            |                                                         |
| ---------- | ------------------------------------------------------- |
| Mức độ     | Thấp                                                    |
| Loại       | Bug                                                     |
| Trạng thái | Mở                                                      |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                 |
| Spec       | [share-agenda.md](../docs/requirements/share-agenda.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Tổng trong dòng done/total có cả event, mà event không bao giờ "done", nên không ngày nào đạt 100%.

## Vị trí trong code

- `src/features/share`

## Hướng sửa đề xuất

Bỏ event khỏi tổng.
