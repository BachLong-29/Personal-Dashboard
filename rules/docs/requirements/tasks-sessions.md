# Task Sessions — giữ lịch làm việc khớp khi task đổi ngày

<role>Fullstack engineer giữ các luồng "sau khi lưu task" của Task và Session Planner</role>

<context>
Giờ làm của task nằm ở `ScheduleBlock` (session), không nằm trên task (xem [tasks](./tasks.md),
[schedule-block](./schedule-block.md)). Hệ quả: đổi `startDate` của task **không** tự dời session.
Trước đây có ba lối dời ngày (edit modal, overdue review, kéo ở week view) thì mỗi lối hoặc im lặng
để session nằm lại ngày cũ, hoặc chỉ có một nút OK mở Planner — trong khi gần như luôn luôn user
chỉ muốn "đưa session sang ngày mới".
</context>

<task>
Sau mỗi lần task đổi ngày / mở lại / tạo mới, hỏi đúng một câu phù hợp: lên lịch (Planner) hoặc dời
session hiện có (`SessionUpdatePrompt`).
</task>

<requirement>

## Thành phần

| File                                                           | Vai trò                                 |
| -------------------------------------------------------------- | --------------------------------------- |
| `src/features/tasks/components/shared/SessionUpdatePrompt.tsx` | Prompt dùng chung cho cả 3 lối dời ngày |
| `src/features/schedule/components/SessionPlanner.tsx`          | Tạo / sửa session                       |
| `src/features/tasks/components/shared/EditTaskModal.tsx`       | Quyết định nhánh nào sau khi lưu        |
| `src/features/tasks/components/shared/OverdueReviewModal.tsx`  | Reschedule task quá hạn                 |
| `src/features/dashboard/components/schedule/WeekView.tsx`      | Kéo task sang ngày khác                 |

## `SessionUpdatePrompt`

Input: `{ blockIds, plannerData, dateMoved }`. Ba nút **xếp dọc ở mọi độ rộng** (nhãn có ngày +
hai chữ, dialog chỉ 380px — xếp ngang thì vỡ thành nút hai dòng):

1. **Move to <date>** (primary) — PATCH từng block sang `plannerData.startDate`, **giữ nguyên giờ**
   của từng session. Chỉ hiện khi `dateMoved`: nếu chỉ đổi duration thì session đã đúng ngày,
   dời sang cùng ngày là vô nghĩa.
2. **Manage Schedule** — đóng prompt, mở Planner.
3. **Later** — đóng.

Dời thất bại → prompt **giữ nguyên**, hiện lỗi đỏ để thử lại hoặc mở Planner; không đóng rồi bỏ
user ở chỗ không lời giải thích. `blockIds` được đọc **trước** khi ghi để khỏi phải fetch lại
(mutation sẽ invalidate list đó).

## Sau khi lưu ở EditTaskModal

Tính trước khi gọi `onSave`, rồi mở trong `onSuccess`:

- `startDateMoved` = có `startDate` mới khác ngày cũ.
- `reopened` = task đang done và status mới khác `done`.
- **Planner** khi: task chưa có block **và** có `startDate` hiệu lực **và** status ≠ `done`
  **và** (trước đó chưa có ngày **hoặc** `startDateMoved` **hoặc** `reopened`). Không đòi
  `duration` — task chưa ước lượng chính là task cần ngồi xếp tay.
- Ngược lại **prompt** khi: task có block **và** (`startDateMoved` hoặc duration đổi).

Vì sao `reopened`: task đã xong bị kéo lại `todo` cho hôm nay thì session cũ đã tiêu, nó cần lên
lịch lại không kém một task đổi ngày (fix `e2e1e61`).

**Luật mount:** `EditTaskModal` phải luôn được render và điều khiển bằng `open`, **không** render
có điều kiện theo `task`. Save xoá `task` trước khi dialog tiếp theo hiện; modal giữ dialog đó bằng
`if (!task) return postSaveModals`. Render có điều kiện sẽ unmount và nuốt mất dialog (lỗi cũ ở
Global Search và MainDashboard).

Header modal có nút **Manage Schedule** khi task đã có `startDate`, mở Planner bất cứ lúc nào.

## Các lối khác

- **Tạo task** (`AddTaskModal`): tạo xong mà task có cả `duration` và `startDate` → mở Planner.
- **Overdue review**: reschedule (PATCH `startDate`, `endDate: null`) thành công và task có block →
  `SessionUpdatePrompt` với `dateMoved: true`.
- **Week view kéo-thả**: kéo task sang ngày khác chỉ đổi `startDate`; có block thì cùng prompt
  theo sau, không có thì dời im lặng. Task có `endDate` (span nhiều ngày) **không kéo được** —
  kéo một ngày của dải là cách mơ hồ để dời cả dải; sửa ngày trong form.

## Session Planner — giờ mặc định

Thêm session mặc định giờ **hiện tại** (không còn cố định 09:00). Planner luôn mounted nên giờ
được đọc lại mỗi lần mở, không phải lúc mount. Auto-fill: phần còn lại bắt đầu ngay sau block
trước đó thay vì cố định 13:00, để không chồng nhau khi giờ bắt đầu thay đổi.

## Open questions

- Prompt dời mọi block sang **một** ngày `startDate`; task multi-day có session rải nhiều ngày sẽ
  bị gom về một ngày. Có cố ý không?

</requirement>
