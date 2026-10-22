# BUG-034 — Nhiều cài đặt được lưu nhưng không có tác dụng

|            |                                                         |
| ---------- | ------------------------------------------------------- |
| Mức độ     | Thấp                                                    |
| Loại       | Code chết                                               |
| Trạng thái | Mở                                                      |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                 |
| Spec       | [user-setting.md](../docs/requirements/user-setting.md) |

## Hiện tượng

`scheduleMode`, `streakProtection`, `language`, `compactMode` và 6 công tắc preferences lưu được nhưng không có code nào đọc chúng.

## Vị trí trong code

- `src/server/models/user-setting.model.ts:15,45,49,52`
- `src/features/profile/components/sections/PrefsSection.tsx`

## Hướng sửa đề xuất

Với từng cài đặt: cài đặt hành vi, hoặc gỡ khỏi UI và model.
