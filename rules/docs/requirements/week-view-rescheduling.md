# Week View Rescheduling (Strict / Flexible)

<role>Hành vi kéo-thả nâng cao trong Week View: xử lý task ngoài phạm vi & sửa habit.</role>

<context>
[TaskWeekView.tsx](../../../src/features/tasks/components/week/TaskWeekView.tsx) đã có drag đổi ngày
(`onMoveToDay`) nhưng **không validate phạm vi** task và **không** hỏi "lần này vs toàn bộ" khi sửa
habit. Spec [schedule-engine](./schedule-engine.md) mục 10 yêu cầu chế độ Strict/Flexible và lựa
chọn sửa habit.
</context>

<task>
Bổ sung validate phạm vi khi kéo Task/Block ra ngoài `[startDate, dueDate]`, và prompt sửa habit.
</task>

---

## 1. Drag & Drop scope (mục 10)

| Loại       | Kéo-thả?                         |
| ---------- | -------------------------------- |
| Quest      | ✅                               |
| Task Block | ✅                               |
| Habit      | ❌ (phải qua prompt sửa, xem §3) |

---

## 2. Task ngoài phạm vi

Task: `startDate 01/06 → dueDate 05/06`. User kéo block sang **07/06** (ngoài range).

### Chế độ Strict

Không cho phép — block bật lại vị trí cũ, toast "Ngoài phạm vi task".

### Chế độ Flexible

Hiện dialog 3 lựa chọn:

```txt
Lịch mới nằm ngoài phạm vi Task.
Bạn muốn:
  • Gia hạn Task   → cập nhật task.dueDate = 07/06
  • Di chuyển lịch → giữ task range, chỉ dời block (cho phép lệch)
  • Huỷ            → revert
```

Chế độ lưu ở UserSetting: `scheduleMode: 'strict' | 'flexible'` (default `flexible`).

---

## 3. Sửa Habit trong Week View

Khi user đổi một habit occurrence (kéo / mở edit), hiện lựa chọn (mục 10):

```txt
Chỉnh lần thực hiện này   → cơ chế reschedule-habit hiện tại (tạo `habitRef` task)
Chỉnh toàn bộ Habit       → PATCH habit.schedule
```

→ Nhánh "lần này" dùng lại cơ chế reschedule-habit ([reschedule-habit](./reschedule-habit.md)).

---

## 4. Component

- `WeekDropDialog` — dialog Strict/Flexible cho task ngoài range.
- `HabitEditScopeDialog` — dialog "lần này / toàn bộ".
- Cập nhật `onMoveToDay` / `handleMoveToSlot` trong
  [TaskManagement.tsx](../../../src/features/tasks/components/TaskManagement.tsx) để gọi validate
  phạm vi trước khi persist.

---

## 5. Validate phạm vi (pure helper)

```typescript
function isInRange(date: Date, startDate: Date, dueDate?: Date): boolean;
// dueDate undefined → open-ended, luôn hợp lệ
```

---

## Trạng thái hiện tại

🟡 Một phần: drag đổi ngày (`onMoveToDay`), reschedule habit 1 occurrence qua `habitRef`-task.
❌ Chưa có: validate phạm vi, dialog Strict/Flexible, prompt "lần này vs toàn bộ", `scheduleMode`
trong UserSetting.
