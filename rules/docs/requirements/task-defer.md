<role>
Product owner định nghĩa tính năng "Dời task" cho hệ thống gamified dashboard.
</role>

<context>
User đôi khi không thể hoàn thành task trong ngày. Thay vì để task tồn đọng hoặc xoá đi,
họ muốn ghi lại lý do và dời task sang ngày khác — tất cả trong EditTaskModal hiện có,
không mở thêm modal mới.
</context>

<task>
Thêm tính năng "Dời task" (defer) vào EditTaskModal:
- Checkbox để kích hoạt chế độ defer
- Chọn lý do (chip cố định + input tuỳ chỉnh)
- Chọn ngày dời (date picker, mặc định ngày mai)
- Khi submit: cập nhật startDate + lưu deferReason riêng
- Hiển thị badge "Rescheduled" trên TaskCard nếu deferReason tồn tại
</task>

<requirement>

## UI — EditTaskModal

### Trigger

- Checkbox label: "Không thể hoàn thành hôm nay"
- Nằm ở cuối form, trước footer
- Khi checked: mở rộng section defer bên dưới checkbox

### Defer Section

- **Reason chips** (4 lý do cố định, chọn 1):
  - "Quá bận / hết thời gian"
  - "Bị chặn / chờ người khác"
  - "Ưu tiên thay đổi đột xuất"
  - "Sức khỏe / cá nhân"
- **Custom reason input**: text input tuỳ chỉnh, max 200 ký tự
  - Nếu chip đã chọn → input disabled, hiện chip value
  - Nếu không chọn chip → input enabled
- **Date picker**: chọn ngày dời, mặc định ngày mai
  - Không cho phép chọn ngày trong quá khứ

### Submit Button

- Defer OFF: label "✦ Save Changes" (mặc định)
- Defer ON: label "↺ Reschedule"

## Data Flow

### Khi defer = ON và submit:

```
payload.deferReason = selectedChip ?? customReason.trim() || 'Dời task'
payload.startDate   = deferDate (YYYY-MM-DD)
```

- `startTime` và `endDate` giữ nguyên theo form hiện tại

### Khi defer = OFF và submit:

- Payload như bình thường, không có `deferReason`

## API — PATCH /api/v1/tasks/:id

### Schema mới

```
deferReason: z.string().max(200).optional().nullable()
```

- null → $unset deferReason
- string → $set deferReason

## Database — Task Model

```typescript
deferReason?: string  // max 200 chars, optional
```

## UI — TaskCard

- Hiển thị badge "↺ Rescheduled" sau tagLabel badge khi `task.deferReason` truthy
- Style: amber/gold accent, nhỏ hơn hoặc bằng các badge hiện có

## Types cần thêm

| File                                    | Thay đổi                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `src/types/task.ts`                     | `Task.deferReason?: string` + `UpdateTaskPayload.deferReason?: string \| null` |
| `src/features/dashboard/types/index.ts` | `Task.deferReason?: string`                                                    |
| `src/features/tasks/data/mock.ts`       | `UITask.deferReason?: string`                                                  |
| `src/features/tasks/data/adapters.ts`   | map `t.deferReason` trong `taskToUITask()`                                     |

</requirement>

<tone>
Ngắn gọn, đủ để implement. Không giải thích lý do business ngoài những gì đã ghi.
</tone>
