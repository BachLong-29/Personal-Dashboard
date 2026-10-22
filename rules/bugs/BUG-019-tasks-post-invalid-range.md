# BUG-019 — `POST /tasks` với `endDate < startDate` vẫn trả 200

|            |                                           |
| ---------- | ----------------------------------------- |
| Mức độ     | Trung bình                                |
| Loại       | Bug                                       |
| Trạng thái | Mở                                        |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code   |
| Spec       | [tasks.md](../docs/requirements/tasks.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Gửi `endDate` trước `startDate` thì API trả 200 với `data: null` thay vì báo lỗi validate.

## Vị trí trong code

- `src/app/api/v1/tasks/route.ts` — POST

## Hướng sửa đề xuất

Thêm `refine` trong Zod: `endDate >= startDate`, trả 400.
