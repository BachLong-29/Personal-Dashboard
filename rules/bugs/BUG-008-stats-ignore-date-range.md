# BUG-008 — API thống kê bỏ qua khoảng ngày được yêu cầu

|            |                                                                       |
| ---------- | --------------------------------------------------------------------- |
| Mức độ     | Trung bình                                                            |
| Loại       | Bug                                                                   |
| Trạng thái | Mở                                                                    |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                               |
| Spec       | [schedule-statistics.md](../docs/requirements/schedule-statistics.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

`GET /api/v1/stats` luôn tính 7 ngày gần nhất, bỏ qua `?from=&to=` mà client gửi.

## Vị trí trong code

- `src/app/api/v1/stats/route.ts`

## Hướng sửa đề xuất

Đọc và validate `from`/`to`, giữ 7 ngày làm giá trị mặc định.
