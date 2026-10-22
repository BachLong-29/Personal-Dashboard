# BUG-011 — Modal phạt hiện mức XP khác với mức server áp dụng

|            |                                               |
| ---------- | --------------------------------------------- |
| Mức độ     | Trung bình                                    |
| Loại       | Bug                                           |
| Trạng thái | Mở                                            |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code       |
| Spec       | [penalty.md](../docs/requirements/penalty.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Modal hiển thị mức phạt 200…2000 XP, trong khi server chỉ trừ 100…500.

## Vị trí trong code

- Component modal phạt trong `src/features/dashboard`
- `src/app/api/v1/penalty`

## Hướng sửa đề xuất

Đưa bảng mức phạt về một hằng số dùng chung cho cả server và client.
