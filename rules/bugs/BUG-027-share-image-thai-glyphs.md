# BUG-027 — Ảnh tải về khi share hiện chữ Thái thành ô vuông

|            |                                                         |
| ---------- | ------------------------------------------------------- |
| Mức độ     | Thấp                                                    |
| Loại       | Bug                                                     |
| Trạng thái | Mở                                                      |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                 |
| Spec       | [share-agenda.md](../docs/requirements/share-agenda.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Ảnh được vẽ bằng font không có glyph tiếng Thái.

## Vị trí trong code

- `src/features/share`

## Hướng sửa đề xuất

Nạp font hỗ trợ tiếng Thái (ví dụ Noto Sans Thai) trước khi vẽ ảnh.
