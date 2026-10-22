# BUG-012 — Hoàn thành goal không cộng XP/coin

|            |                                           |
| ---------- | ----------------------------------------- |
| Mức độ     | Trung bình                                |
| Loại       | Bug                                       |
| Trạng thái | Mở                                        |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code   |
| Spec       | [goals.md](../docs/requirements/goals.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Goal có phần thưởng theo rank, nhưng khi hoàn thành thì XP/coin không được cộng vào profile.

## Vị trí trong code

- `src/app/api/v1/goals`
- `src/features/achievements` — luồng complete

## Hướng sửa đề xuất

Cộng thưởng phía server (`$inc` trên UserProfile) ngay trong route complete, chỉ một lần cho mỗi goal.
