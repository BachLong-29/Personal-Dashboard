# BUG-028 — Trang và form Events vẫn ghi cứng tiếng Anh

|            |                                           |
| ---------- | ----------------------------------------- |
| Mức độ     | Thấp                                      |
| Loại       | i18n                                      |
| Trạng thái | Mở                                        |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code   |
| Spec       | [event.md](../docs/requirements/event.md) |

## Hiện tượng

`EventsPage` và `EventFormModal` dùng chuỗi tiếng Anh viết thẳng trong code, không qua next-intl.

## Vị trí trong code

- `src/features/events/components/EventsPage.tsx`
- `src/features/events/components/EventFormModal.tsx`

## Hướng sửa đề xuất

Chuyển sang `useTranslations`, thêm key cho en/vi/th.
