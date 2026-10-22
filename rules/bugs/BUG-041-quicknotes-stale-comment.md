# BUG-041 — Comment đầu file QuickNotes nhắc menu ＋ trên topbar đã bị gỡ

|            |                                                       |
| ---------- | ----------------------------------------------------- |
| Mức độ     | Thấp                                                  |
| Loại       | Code chết                                             |
| Trạng thái | Mở                                                    |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code               |
| Spec       | [quick-notes.md](../docs/requirements/quick-notes.md) |

## Hiện tượng

Comment trong `QuickNotes.tsx` vẫn nhắc menu ＋ trên topbar desktop, đã bị gỡ ở commit da7dff8.

## Vị trí trong code

- `src/features/notes/components/QuickNotes.tsx`

## Hướng sửa đề xuất

Sửa comment cho đúng (lối vào hiện tại là `QuickCreateFab`).
