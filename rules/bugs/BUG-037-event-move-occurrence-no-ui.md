# BUG-037 — Dời một lần của event lặp chỉ làm được qua trợ lý

|            |                                           |
| ---------- | ----------------------------------------- |
| Mức độ     | Thấp                                      |
| Loại       | Thiếu UI                                  |
| Trạng thái | Mở                                        |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code   |
| Spec       | [event.md](../docs/requirements/event.md) |

## Hiện tượng

API override (`move_occurrence`, `cancel_occurrence`) đã có, nhưng trang Events và week view không có thao tác này.

## Vị trí trong code

- `src/features/events`
- `src/server/services/event-override`

## Hướng sửa đề xuất

Thêm "Dời lần này / Bỏ lần này" vào menu của event trong week view.
