# Task Defer — dời task kèm lý do, ngay trong EditTaskModal

<role>Fullstack engineer giữ tính năng "Cannot complete today" của task</role>

<context>
User đôi khi không xong task trong ngày. Thay vì để tồn đọng hay xoá, họ ghi lại lý do và dời
sang ngày khác — trong `EditTaskModal` có sẵn, không mở modal mới. Dời task quá hạn hàng loạt là
việc của [overdue-task-handling](./overdue-task-handling.md), không phải ở đây.
</context>

<task>
Checkbox bật chế độ defer → chọn lý do + ngày → lưu `startDate` mới và `deferReason`.
</task>

<requirement>

## Dữ liệu

`Task.deferReason?: string` — trim, ≤200 ký tự.

`PATCH /api/v1/tasks/:id`: `deferReason: z.string().max(200).optional().nullable()` —
`null` → `$unset`, string → `$set`. Response của `PATCH` và `GET /tasks/:id` có `deferReason`;
response list `GET /tasks` và `POST` thì **không** serialize field này.

## UI — `EditTaskModal.tsx`

Section nằm **dưới `TaskForm`**, ngăn bằng border-top, và **chỉ hiện với task single-day**
(`!endDate || endDate === startDate`). Task multi-day không có defer — dời một ngày của dải
không có nghĩa rõ ràng.

- Checkbox: "Cannot complete today" (`tasks.defer.checkboxLabel`). Bỏ tick → reset toàn bộ state
  defer.
- **Chip lý do** (chọn một, bấm lại để bỏ), key i18n `tasks.defer.reasons.*`:
  `tooBusy` · `blocked` · `priorityShift` · `health`.
- **Ô lý do tự nhập** (≤200): có chip → ô bị disable và hiện text của chip.
- **DatePicker** "Reschedule to": mặc định **ngày mai**, chọn ngày trước hôm nay bị bỏ qua.
- Nút submit: "↺ Reschedule" khi defer bật, "✦ Save Changes" khi tắt.

State defer reset khi đóng modal.

## Payload khi submit

```
defer ON:  deferReason = <text chip đã dịch> ?? custom.trim() || <text checkbox đã dịch>
           startDate   = deferDate (YYYY-MM-DD, giờ local)
defer OFF: task đang có deferReason → deferReason = null (xoá)
```

`endDate` và các field form khác gửi như lưu bình thường. Lý do được lưu **bằng chữ đã dịch theo
ngôn ngữ lúc lưu**, không phải key — đổi ngôn ngữ sau đó không dịch lại lý do cũ.

**Lưu không defer sẽ xoá `deferReason` cũ** — tức là mỗi lần sửa task đã dời mà không tick lại
checkbox, dấu vết "đã dời" mất đi.

## Sau khi lưu

Ngày đổi nên đi qua đúng luồng của [tasks-sessions](./tasks-sessions.md): task đã có session →
`SessionUpdatePrompt` (dời session sang ngày mới); chưa có → Session Planner.

## Không có (spec cũ ghi sai)

- **Badge "↺ Rescheduled" trên card**: không chỗ nào render `deferReason`. Adapter
  `taskToUITask` có map `deferReason` vào `UITask` nhưng không component nào đọc.
- Lịch sử các lần dời — chỉ giữ lý do gần nhất.

## Open questions

- Có làm lại badge "Rescheduled" không, và đặt ở đâu khi day view của `/tasks` đang ẩn?
- Lưu bình thường xoá `deferReason` có phải ý muốn, hay chỉ nên xoá khi task xong?

</requirement>

<tone>Ngắn gọn, đủ để implement.</tone>
