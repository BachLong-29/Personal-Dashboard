# BUG-023 — Dời session của task nhiều ngày thì mọi session dồn về một ngày

|            |                                                             |
| ---------- | ----------------------------------------------------------- |
| Mức độ     | Trung bình                                                  |
| Loại       | Bug                                                         |
| Trạng thái | Mở                                                          |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                     |
| Spec       | [tasks-sessions.md](../docs/requirements/tasks-sessions.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Prompt "dời session sang ngày mới" đặt mọi session của task nhiều ngày vào cùng một ngày, thay vì giữ khoảng cách tương đối giữa chúng.

## Vị trí trong code

- `SessionUpdatePrompt` trong `src/features/tasks`

## Hướng sửa đề xuất

Dời theo độ lệch (`newStart - oldStart`) cho từng session.
