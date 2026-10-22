# BUG-013 — `streak` không bao giờ tăng

|            |                                                   |
| ---------- | ------------------------------------------------- |
| Mức độ     | Trung bình                                        |
| Loại       | Bug                                               |
| Trạng thái | Mở                                                |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code           |
| Spec       | [character.md](../docs/requirements/character.md) |

## Hiện tượng

`UserProfile.streak` (mặc định 0) không có đoạn code nào tăng nó, nên streak trên UI luôn đứng yên. Cài đặt `streakProtection` cũng không có tác dụng.

## Vị trí trong code

- `src/server/models/user-profile.model.ts:80`

## Hướng sửa đề xuất

Định nghĩa luật streak (hoàn thành ≥1 quest mỗi ngày?) rồi cập nhật ở bước khởi tạo ngày (`useDailyInit`) hoặc phía server.
