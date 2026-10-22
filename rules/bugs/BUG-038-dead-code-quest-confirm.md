# BUG-038 — ConfirmQuestModal và luồng xác nhận quest không bao giờ được gọi

|            |                                             |
| ---------- | ------------------------------------------- |
| Mức độ     | Thấp                                        |
| Loại       | Code chết                                   |
| Trạng thái | Mở                                          |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code     |
| Spec       | [quests.md](../docs/requirements/quests.md) |

## Hiện tượng

`MainDashboard` không nối `handleToggleQuest`, nên `ConfirmQuestModal`, tuỳ chọn bỏ qua xác nhận và thưởng +5 gem cho quest hạng S không bao giờ chạy. `allQuests` cũng không ai dùng.

## Vị trí trong code

- `src/features/dashboard/components/schedule/ConfirmQuestModal.tsx`
- `src/features/dashboard/components/layout/DashboardOverlays.tsx:69`
- `src/features/dashboard/hooks/useQuestOrchestration.ts:162`

## Hướng sửa đề xuất

Cần quyết định: nối lại, hay xoá cả cụm.
