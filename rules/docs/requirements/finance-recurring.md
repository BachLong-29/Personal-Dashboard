# Finance — Recurring Transactions

<role>Fullstack engineer thêm giao dịch định kỳ cho module Finance</role>

<context>
[finance.md](./finance.md) đã có `Transaction.source: 'manual' | 'sepay' | 'recurring'` và
`recurringId?: ObjectId`. Recurring là các khoản thu/chi lặp lại cố định (tiền nhà, lương,
subscription). Codebase **không có server cron** — các cơ chế theo thời gian hiện tại (VD
[overdue-task-handling](./overdue-task-handling.md)) đều dùng pattern **lazy-on-load**: tính
toán khi client gọi API, không chạy nền.
</context>

<task>
Model `RecurringTransaction`, API CRUD, và cơ chế lazy-generate transaction khi user mở trang
Finance (không dùng cron).
</task>

<requirement>

## Model: RecurringTransaction

```
RecurringTransaction {
  userId: ObjectId
  walletId: ObjectId
  categoryId: ObjectId
  type: 'income' | 'expense'
  amount: number
  note?: string
  frequency: 'monthly' | 'weekly'
  dayOfMonth?: number       // 1-31, required nếu frequency='monthly'
  dayOfWeek?: number        // 0-6 (CN=0), required nếu frequency='weekly'
  startDate: Date
  endDate?: Date             // null = vô thời hạn
  lastGeneratedDate?: Date   // ngày gần nhất đã sinh transaction, null nếu chưa lần nào
  active: boolean            // default true
  createdAt / updatedAt
}
```

- Chỉ hỗ trợ `monthly` và `weekly` (không cần `daily`/`yearly` — YAGNI).
- `dayOfMonth` > số ngày thực của tháng (VD 31 vào tháng 2) → sinh vào **ngày cuối cùng của
  tháng đó**.

## Cơ chế sinh transaction — lazy-on-load

Không có cron. Sinh khi user mở trang Finance, qua 1 API riêng gọi từ hook lúc mount:

### POST /api/v1/finance/recurring/sync

- Lấy tất cả `RecurringTransaction` active của user.
- Với mỗi rule: tính danh sách occurrence dates từ
  `max(lastGeneratedDate + 1 day, startDate)` đến `min(today, endDate ?? today)`.
- Với mỗi occurrence date: tạo `Transaction` (`source: 'recurring'`, `recurringId`, `date` =
  occurrence date), cộng/trừ `Wallet.balance`.
- Sau khi xong: `lastGeneratedDate = today`.
- Giới hạn an toàn: tối đa sinh bù **90 ngày** về trước (tránh loop dài nếu user không mở app
  lâu ngày) — occurrence cũ hơn 90 ngày bị bỏ qua, chỉ log warning.
- Response: `{ generated: number }` (số transaction vừa tạo, để hiện toast nếu > 0).
- Idempotent theo thiết kế: chạy lại nhiều lần trong cùng ngày không tạo trùng vì
  `lastGeneratedDate` đã cập nhật = today sau lần đầu.

### Hook — `useRecurringSync`

```typescript
// src/features/finance/hooks/useRecurringSync.ts
function useRecurringSync(): void;
```

- Gọi 1 lần khi `FinancePage` mount (effect empty-deps).
- Nếu `generated > 0`: invalidate `transactions` + `wallets` query, hiện toast
  `"Đã tự động ghi N giao dịch định kỳ"`.
- Không block render trang.

## API CRUD

| Method   | Endpoint                         | Mô tả                                                          |
| -------- | -------------------------------- | -------------------------------------------------------------- |
| `GET`    | `/api/v1/finance/recurring`      | List rule active của user                                      |
| `POST`   | `/api/v1/finance/recurring`      | Tạo rule (validate dayOfMonth/dayOfWeek theo frequency)        |
| `PATCH`  | `/api/v1/finance/recurring/:id`  | Sửa rule (không sửa `lastGeneratedDate` qua đây)               |
| `DELETE` | `/api/v1/finance/recurring/:id`  | Soft-delete (`active: false`) — transaction đã sinh giữ nguyên |
| `POST`   | `/api/v1/finance/recurring/sync` | Trigger lazy-generate (mô tả trên)                             |

## UI — RecurringPanel (section trong `/finance`)

- List rule: icon category, tên/note, amount, "Hàng tháng ngày N" / "Hàng tuần thứ N", wallet.
- Nút "+ Add Recurring" mở modal: chọn wallet, category, type, amount, note, frequency +
  dayOfMonth/dayOfWeek tương ứng, startDate, endDate (optional).
- Toggle active/inactive trực tiếp trên list item (switch).
- Xoá: confirm trước khi soft-delete.
- Responsive: list 1 cột mobile, giữ nguyên desktop (không cần grid phức tạp).

## Trạng thái hiện tại

❌ Chưa có gì — toàn bộ model, sync mechanism, API, UI đều mới.

</requirement>

<tone>Concise, technical. Không dùng cron/queue — bám đúng pattern lazy-on-load đã có trong codebase.</tone>
