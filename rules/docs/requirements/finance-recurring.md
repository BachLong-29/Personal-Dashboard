# Finance — Recurring Transactions — CHƯA LÀM

<role>Fullstack engineer thêm giao dịch định kỳ cho module Finance</role>

<context>
Khoản thu/chi lặp cố định (tiền nhà, lương, subscription) đang phải gõ tay mỗi kỳ. Doc này mô tả
**đề xuất**; tính năng **chưa được build**. Trạng thái code tại 2026-10-22:

| Có trong code                                                                         | Không có                                  |
| ------------------------------------------------------------------------------------- | ----------------------------------------- |
| `Transaction.source` enum có `'recurring'`                                            | Model `RecurringTransaction`              |
| `Transaction.recurringId` ref `'RecurringTransaction'`                                | Route `/api/v1/finance/recurring*`        |
| Budget có cờ `recurring` — **khác hẳn**, xem [finance-budget.md](./finance-budget.md) | Hook `useRecurringSync`, `RecurringPanel` |

Không route nào ghi `source: 'recurring'` — `POST /transactions` luôn ghi `'manual'`, webhook ghi
`'sepay'`. `finance-forecast.ts` cũng nói rõ là **không** mô hình hoá recurring.

Repo **không có cron**; mọi cơ chế theo thời gian (notification, budget alert, cash reminder) đều
sinh lúc đọc. Recurring phải theo cùng pattern đó.
</context>

<task>
Khi làm: model `RecurringTransaction`, CRUD, và sinh transaction lazy lúc user mở Finance.
</task>

<requirement>

## Model đề xuất: `RecurringTransaction`

| Field                                               | Kiểu                    | Ghi chú                                                      |
| --------------------------------------------------- | ----------------------- | ------------------------------------------------------------ |
| `walletId`, `categoryId`, `type`, `amount`, `note?` | như Transaction         |                                                              |
| `frequency`                                         | `'monthly' \| 'weekly'` | Không `daily`/`yearly` — chưa ai cần                         |
| `dayOfMonth`                                        | 1–31                    | Bắt buộc khi monthly; 31 vào tháng 30 ngày → ngày cuối tháng |
| `dayOfWeek`                                         | 0–6 (CN = 0)            | Bắt buộc khi weekly                                          |
| `startDate`, `endDate?`                             | Date                    | `endDate` trống = vô hạn                                     |
| `lastGeneratedDate`                                 | Date?                   | Chỉ server ghi                                               |
| `active`                                            | boolean                 | Soft-delete; transaction đã sinh giữ nguyên                  |

## Sinh lazy — `POST /api/v1/finance/recurring/sync`

- Mỗi rule active: occurrence từ `max(lastGeneratedDate + 1, startDate)` tới `min(today, endDate)`
- Mỗi occurrence → transaction `source: 'recurring'`, `recurringId`, `$inc` balance
- Xong → `lastGeneratedDate = today`; chạy lại trong ngày không sinh trùng
- Bù tối đa **90 ngày**; cũ hơn bỏ qua + log
- Trả `{ generated }`; client gọi một lần khi `FinancePage` mount, `generated > 0` → invalidate
  `transactions` + `wallets`, toast

## Câu hỏi phải trả lời trước khi build

Những luật này ra đời **sau** đề xuất gốc và đề xuất chưa tính tới:

- **Ví không âm** ([finance.md](./finance.md)): occurrence làm ví xuống âm thì chặn (như gõ tay)
  hay ghi + gắn `overdraft` (như từ ngân hàng)? Chặn thì `lastGeneratedDate` có tiến không?
- **`today` của ai**: overview/goals nhận `today` từ client; sync cũng phải vậy, không dùng UTC server
- **Category `excludeFromTotals`** dùng cho rule chuyển tiền giữa ví — có cần cặp transaction?
- Một khoản đã trả qua ngân hàng (SePay) **và** có rule recurring → đếm hai lần; cần chống trùng
  hay để user tắt rule?

## API CRUD đề xuất

`GET / POST /api/v1/finance/recurring`, `PATCH / DELETE /api/v1/finance/recurring/:id` (`PATCH`
không được sửa `lastGeneratedDate`; `DELETE` = `active: false`).

## UI đề xuất

Panel trong `/finance` (hoặc tab riêng): list rule (icon category, note, số tiền, "Hàng tháng ngày
N" / "Hàng tuần thứ N", ví), switch active, modal thêm/sửa, xoá qua confirm modal của app.
Mobile-first, một cột trên điện thoại.

</requirement>

<tone>Concise, technical. Không cron/queue — bám pattern sinh-lúc-đọc đã có.</tone>
