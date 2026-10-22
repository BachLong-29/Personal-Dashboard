# BUG-033 — File gỡ khỏi task vẫn nằm trên Cloudinary

|            |                                                                 |
| ---------- | --------------------------------------------------------------- |
| Mức độ     | Thấp                                                            |
| Loại       | Dữ liệu                                                         |
| Trạng thái | Mở                                                              |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                         |
| Spec       | [task-attachments.md](../docs/requirements/task-attachments.md) |

## Hiện tượng

Gỡ đính kèm (hoặc thay icon ảnh) chỉ xoá URL trong DB; file trên Cloudinary không bị xoá.

## Vị trí trong code

- `src/app/api/v1/upload`
- `src/features/tasks` — luồng attachments

## Hướng sửa đề xuất

Xoá file trên Cloudinary theo `public_id` khi gỡ (nhớ kiểm tra file không còn được icon library hay item khác dùng).
