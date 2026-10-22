# Overdue Task Handling — leo thang, phạt, rồi dọn hàng loạt

<role>Fullstack engineer giữ vòng đời task trễ hạn trên dashboard gamified</role>

<context>
Task bị bỏ qua nhiều ngày trước đây chỉ có badge "overdue" và một con số trong stats — không có lý do
nào để quay lại xử lý. Tính năng này thêm ba lớp chạy khi dashboard load: **badge leo thang** theo số
ngày trễ, **penalty tự động** ([penalty](./penalty.md)), và **review modal** để giải quyết từng task.
Khi dời ngày một task đã có phiên, nó còn hỏi có dời luôn các phiên không.
</context>

<task>
Hook `useOverdueReview` + `computeOverdueLevel` + badge trên card + `OverdueReviewModal`, xếp hàng
sau penalty.
</task>

<requirement>

## Định nghĩa

- Overdue khi `active !== false`, `status !== 'done'`, và **due** < hôm nay.
- **Due** = `endDate ?? startDate`. Không có `startDate` (backlog) → **không bao giờ** overdue.
- `daysOverdue = -dayOffset(due)` (≥ 1).

`computeOverdueLevel(task)` — `src/features/tasks/data/adapters.ts`, gắn vào `UITask.overdueLevel`:

| Ngày trễ | Level      | Hệ quả                                                |
| -------- | ---------- | ----------------------------------------------------- |
| 1–2      | `late`     | badge `⚠` vàng                                        |
| 3–6      | `critical` | badge `!` hồng nhấp nháy + 1 notification mỗi session |
| ≥ 7      | `failed`   | auto-archive + notification "☠ Quest Failed"          |

Badge render trong `src/features/tasks/components/shared/QuestCard.tsx`, ẩn khi task done/cancelled
hoặc level `failed`.

## Hook — `src/features/tasks/hooks/useOverdueReview.ts`

`useOverdueReview()` tự đọc `useTasks()`, trả `{ overdueItems, isReady, showModal, dismissModal,
removeItem }`. Chạy **một lần** sau khi tasks load (`ranRef`):

1. Phân loại. Với mỗi `critical` chưa báo trong session (`sessionStorage`
   `overdue_critical_notified_<id>`) → `POST /notifications` type `reminder`, "🔴 Quest Critical".
2. Tuần tự `PATCH /tasks/:id {active:false}` cho mọi task `failed`, kèm notification `system`
   "☠ Quest Failed" có `entityId`. Bấm notification đó mở `EditTaskModal` để khôi phục
   (`MainDashboard.tsx`). Không trừ XP ở bước này — hình phạt nằm ở penalty.
3. `overdueItems` = task 1–6 ngày; `showModal = true` nếu có item và `sessionStorage`
   `overdue_reviewed` chưa set.

## Thứ tự với Penalty

`usePenaltyFlow` (`src/features/dashboard/hooks/usePenaltyFlow.ts`) nhận `overdueItems`: có item và
hôm nay chưa phạt (`localStorage` `aetheria_task_penalty_date`) → tự tạo penalty `source: 'task'`
(pool bài tập). Review modal chỉ mở khi **không** có penalty task đang chờ — penalty là modal chặn,
hai modal cùng lúc là một bức tường. `CashLogReminderModal` nhường cả hai.

## Review Modal — `src/features/tasks/components/shared/OverdueReviewModal.tsx`

- Title "⚠ Overdue Quests" + "N quest(s) missed their deadline". Mỗi dòng: icon, tên, badge level,
  số ngày trễ, `endDate` hoặc `startDate` gốc.
- 3 nút: **Reschedule** · **Done** · **Abandon**. Footer: **Dismiss** (set `overdue_reviewed`).
- **Reschedule** → `DatePicker` inline → `PATCH {startDate: mới, endDate: null}`.
- **Done** → `PATCH {status:'done'}` — không thưởng XP vì đã trễ.
- **Abandon** → confirm inline (bấm lần 2) → `PATCH {active:false}`.
- Xử lý xong, dòng biến mất. Hết dòng → "All caught up" rồi tự đóng sau 1.5s (không set
  `overdue_reviewed`, nhưng hook không chạy lại trong session nên không mở lại).

## Session prompt sau Reschedule

Task đã có block mà bị dời ngày thì các phiên vẫn nằm ở ngày cũ. Sau reschedule thành công, nếu
`useTaskBlocks(id)` có block → mở `SessionUpdatePrompt`
(`src/features/tasks/components/shared/SessionUpdatePrompt.tsx`):

- **Move to <date>** — `PATCH` mọi block sang `startDate` mới (id lấy từ trước, không refetch).
  Lỗi → giữ prompt mở, hiện "move failed" để thử lại.
- **Manage schedule** → mở SessionPlanner với ngày mới.
- **Later** → đóng.

Prompt và planner sống ở **modal cha**, không ở dòng — dòng bị unmount ngay khi reschedule xong.
Cùng prompt này được dùng ở `EditTaskModal` (đổi ngày/estimate) và khi kéo task qua ngày ở Week View.

## Edge cases

- Abandon/auto-archive dùng `PATCH active:false` → block của task **không** bị xoá (xem
  [schedule-block](./schedule-block.md)).
- Notification "Quest Failed" cũ thiếu `entityId` được backfill ở `GET /notifications` bằng cách
  parse tên task từ message.
- "Move" dời **mọi** block của task, kể cả block ngày đã qua.

## Open questions

- Spec cũ ghi "trừ XP" khi failed — code không trừ; có cần không, hay penalty là đủ?

</requirement>

<tone>Ngắn, nói rõ thứ tự các modal và lý do.</tone>
