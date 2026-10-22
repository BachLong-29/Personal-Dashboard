# BUG-029 — `GET /notifications` vẫn chờ tạo thông báo xong mới trả

|            |                                                                       |
| ---------- | --------------------------------------------------------------------- |
| Mức độ     | Thấp                                                                  |
| Loại       | Cần quyết định                                                        |
| Trạng thái | Mở                                                                    |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                               |
| Spec       | [notification-center.md](../docs/requirements/notification-center.md) |

## Hiện tượng

Hai bước tự tạo thông báo (giới hạn chạy 5 phút một lần) vẫn chạy trước khi `GET /notifications` trả kết quả. Chỉ phía client là không bị chặn, nhờ optimistic update.

## Vị trí trong code

- `src/app/api/v1/notifications`

## Hướng sửa đề xuất

Nếu cần nhanh hơn: chạy bước tạo sau khi đã trả response (`after()` của Next) hoặc qua cron.
