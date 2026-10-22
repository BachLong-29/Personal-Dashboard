# BUG-040 — ThemeToggle và RootLayout không còn được dùng

|            |                                           |
| ---------- | ----------------------------------------- |
| Mức độ     | Thấp                                      |
| Loại       | Code chết                                 |
| Trạng thái | Mở                                        |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code   |
| Spec       | [theme.md](../docs/requirements/theme.md) |

## Hiện tượng

Hai component không được import ở đâu.

## Vị trí trong code

- `src/components/common/ThemeToggle.tsx`
- `src/components/layouts/RootLayout.tsx`

## Hướng sửa đề xuất

Xoá.
