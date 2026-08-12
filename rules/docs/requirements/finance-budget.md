# Finance — Budget

<role>Fullstack engineer thêm tính năng ngân sách cho module Finance</role>

<context>
[finance.md](./finance.md) đã có `Transaction` với `categoryId`, `type`, `amount`, `date`.
Budget là hạn mức chi tiêu user tự đặt theo tháng — tổng hoặc theo từng category — để cảnh báo
khi chi vượt mức. Không liên quan XP/coins.
</context>

<task>
Model `Budget`, API CRUD, tính `spent` từ Transaction, cảnh báo khi vượt ngưỡng (notification,
không phạt).
</task>

<requirement>

## Model: Budget

```
Budget {
  userId: ObjectId
  categoryId?: ObjectId   // ref FinanceCategory (type='expense'); null = ngân sách TỔNG chi tiêu
  month: string           // "YYYY-MM", required
  limit: number           // min 1
  createdAt / updatedAt
}
```

- `(userId, categoryId, month)` unique — kể cả khi `categoryId` null (ngân sách tổng, mỗi tháng
  chỉ 1 bản ghi).
- Budget chỉ áp dụng cho **expense** — không có ngân sách cho income.
- Không cascade khi xoá category đang có budget — chặn xoá category nếu còn budget tháng hiện
  tại/tương lai tham chiếu (409), tương tự rule Category hiện có.

## Tính `spent` (derived, không lưu)

```
spent = SUM(Transaction.amount)
  WHERE userId, type='expense', date trong [month-01, month cuối],
        categoryId = budget.categoryId (nếu có, ngược lại tất cả expense)
```

Tính server-side khi trả list budget, không cache.

## API

| Method   | Endpoint                      | Mô tả                                                                                  |
| -------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `GET`    | `/api/v1/finance/budgets`     | List budget theo `?month=YYYY-MM` (default tháng hiện tại), kèm `spent` + `percentage` |
| `POST`   | `/api/v1/finance/budgets`     | Tạo budget — 409 nếu đã tồn tại `(categoryId, month)`                                  |
| `PATCH`  | `/api/v1/finance/budgets/:id` | Sửa `limit`                                                                            |
| `DELETE` | `/api/v1/finance/budgets/:id` | Xoá budget                                                                             |

Response mỗi budget item:

```jsonc
{
  "_id": "...",
  "categoryId": "..." /* hoặc null */,
  "categoryName": "Ăn uống" /* hoặc "Tổng chi tiêu" */,
  "month": "2026-08",
  "limit": 3000000,
  "spent": 3200000,
  "percentage": 107, // round(spent/limit*100)
}
```

## Cảnh báo vượt ngân sách

- Tính lazy-on-load (giống pattern [overdue-task-handling](./overdue-task-handling.md)): khi
  FinancePage/BudgetPanel mount, so `spent/limit` của tháng hiện tại.
- Ngưỡng: **>= 100%** → tạo notification `type: 'system'`, title `"⚠ Budget Exceeded"`, message
  ghi tên category + số tiền vượt. `dedupeKey`: `budget:${budgetId}:${month}` (chỉ tạo 1 lần/tháng).
- **Không** trừ XP/coins, không phạt — chỉ cảnh báo thông tin.

## UI — BudgetPanel (trong trang `/finance`, tab hoặc section riêng)

- List budget dạng progress bar: tên category (hoặc "Tổng chi tiêu"), `spent / limit`, % .
  - `< 80%`: bar màu mint. `80–99%`: amber. `>= 100%`: rose.
- Nút "+ Set Budget" mở modal: chọn category (dropdown, hoặc "Tổng chi tiêu"), nhập limit.
  Chặn tạo trùng `(category, month)` đã có (disable option trong dropdown nếu đã set).
- Tháng mặc định = tháng hiện tại; có control chuyển tháng (prev/next) để xem budget tháng khác
  (chỉ xem, không tạo mới cho tháng quá khứ).
- Responsive: list 1 cột trên mobile, 2 cột `md:` trở lên.

## Trạng thái hiện tại

❌ Chưa có gì — toàn bộ model, API, UI đều mới.

</requirement>

<tone>Concise, technical. Không over-engineer — không cần rollover ngân sách qua tháng sau, không cần budget theo tuần/năm.</tone>
