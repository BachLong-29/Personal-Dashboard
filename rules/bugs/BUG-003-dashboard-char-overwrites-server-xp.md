# BUG-003 — Dashboard ghi đè XP/coin mà server vừa thay đổi

|            |                                                   |
| ---------- | ------------------------------------------------- |
| Mức độ     | Cao                                               |
| Loại       | Dữ liệu                                           |
| Trạng thái | Mở                                                |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code           |
| Spec       | [character.md](../docs/requirements/character.md) |

## Hiện tượng

Dashboard nạp `char` từ profile **một lần** (`charInitialized`). Sau đó, khi server trừ XP do phạt hoặc cộng thưởng khi xong project, `char` phía client vẫn giữ số cũ. Lần lưu tiến độ tiếp theo PUT số cũ lên, xoá mất thay đổi của server.

## Vị trí trong code

- `src/features/dashboard/components/layout/MainDashboard.tsx:67` — `setChar(profileToCharacter(profile))` chỉ chạy lần đầu
- `src/features/dashboard/hooks/useCharacterProgress.ts` — PUT toàn bộ char

## Hướng sửa đề xuất

Server cộng/trừ theo delta (`$inc`) thay vì PUT giá trị tuyệt đối; client nạp lại profile sau mỗi thay đổi phía server.
