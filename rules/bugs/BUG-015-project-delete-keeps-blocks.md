# BUG-015 — Xoá project không xoá session của các task con

|            |                                                 |
| ---------- | ----------------------------------------------- |
| Mức độ     | Trung bình                                      |
| Loại       | Dữ liệu                                         |
| Trạng thái | Mở                                              |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code         |
| Spec       | [projects.md](../docs/requirements/projects.md) |

## Hiện tượng

`DELETE /projects/:id` ẩn project và các task con, nhưng không xoá ScheduleBlock của chúng. Luồng archive thì có xoá.

## Vị trí trong code

- `src/app/api/v1/projects/[id]/route.ts:126-140`

## Hướng sửa đề xuất

Dùng chung đoạn dọn block của luồng archive.
