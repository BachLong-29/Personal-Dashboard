# BUG-009 — Event làm tụt tỉ lệ hoàn thành trong thống kê

|            |                                                                       |
| ---------- | --------------------------------------------------------------------- |
| Mức độ     | Trung bình                                                            |
| Loại       | Bug                                                                   |
| Trạng thái | Mở                                                                    |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                               |
| Spec       | [schedule-statistics.md](../docs/requirements/schedule-statistics.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Event được tính vào thời gian đã lên lịch nhưng không bao giờ được tính là xong, nên tỉ lệ hoàn thành bị kéo xuống ở những tuần có nhiều event.

## Vị trí trong code

- `src/app/api/v1/stats/route.ts`
- `src/server/services` — phần tính số liệu

## Hướng sửa đề xuất

Bỏ event khỏi mẫu số của tỉ lệ hoàn thành, hoặc coi event đã qua là xong.
