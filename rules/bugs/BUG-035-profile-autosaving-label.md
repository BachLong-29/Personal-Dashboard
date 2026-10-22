# BUG-035 — Nhãn "Autosaving" ở `/profile` sai sự thật

|            |                                               |
| ---------- | --------------------------------------------- |
| Mức độ     | Thấp                                          |
| Loại       | UI                                            |
| Trạng thái | Mở                                            |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code       |
| Spec       | [profile.md](../docs/requirements/profile.md) |

## Hiện tượng

Trang Profile hiện "Autosaving"/"AUTOSAVED", nhưng thực tế phải bấm lưu mới lưu.

## Vị trí trong code

- `src/features/profile/components/ProfileSectionNav.tsx:88`
- `src/features/profile/components/ProfilePage.tsx:428`

## Hướng sửa đề xuất

Đổi nhãn theo trạng thái thật ("Chưa lưu"/"Đã lưu lúc …"), qua i18n.
