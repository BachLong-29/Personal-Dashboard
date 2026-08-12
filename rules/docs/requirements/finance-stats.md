# Finance — Statistics & Charts

<role>Fullstack engineer thêm thống kê trực quan cho module Finance</role>

<context>
[finance.md](./finance.md) đã có `Transaction` với `type`, `amount`, `categoryId`, `date`,
`walletId`. Cần biểu đồ để user nhìn nhanh xu hướng thu/chi thay vì đọc list giao dịch.
</context>

<task>
API tổng hợp số liệu theo tháng + theo category, và section biểu đồ trong trang `/finance`.
</task>

<requirement>

## API

| Method | Endpoint                | Mô tả                                           |
| ------ | ----------------------- | ----------------------------------------------- |
| `GET`  | `/api/v1/finance/stats` | Query `?month=YYYY-MM` (default tháng hiện tại) |

Response:

```jsonc
{
  "month": "2026-08",
  "totalIncome": 15000000,
  "totalExpense": 9200000,
  "balance": 5800000, // income - expense
  "byCategory": [
    {
      "categoryId": "...",
      "name": "Ăn uống",
      "type": "expense",
      "amount": 3200000,
      "percentage": 35,
    },
    // sort desc theo amount, chỉ type='expense'
  ],
  "trend": [
    // 6 tháng gần nhất kể cả tháng hiện tại
    { "month": "2026-03", "income": 14000000, "expense": 8000000 },
    { "month": "2026-04", "income": 14500000, "expense": 9000000 },
    // ...
  ],
}
```

- `byCategory`: aggregate `Transaction` theo `categoryId`, `type='expense'`, trong tháng query.
- `trend`: aggregate 6 tháng gần nhất (kể cả tháng hiện tại), group theo `type` + tháng.
- Tất cả tính server-side (MongoDB aggregation), không tính ở client.

## UI — StatsSection (trong trang `/finance`)

Theo `dataviz` skill khi implement — dùng palette chuẩn của skill, không tự bịa màu.

- **Summary row**: 3 stat tile — Total Income / Total Expense / Balance (tháng hiện tại), có
  control chuyển tháng (prev/next, giống BudgetPanel).
- **Donut/pie chart**: `byCategory` — phân bổ chi tiêu theo category tháng hiện tại. Legend kèm
  % bên cạnh, không chỉ trong tooltip (đọc được trên mobile không cần hover).
- **Bar/line chart**: `trend` — income vs expense 6 tháng, 2 series so sánh trực tiếp (income
  màu mint, expense màu rose — theo palette skill).
- Empty state: tháng chưa có transaction nào → hiện placeholder "Chưa có dữ liệu tháng này"
  thay vì chart rỗng.
- Responsive: 2 chart xếp cạnh nhau `lg:grid-cols-2`, xếp dọc full-width dưới `lg:`. Stat tile
  3 cột desktop → 1 cột mobile.

## Reuse

| File                                                     | Thay đổi             |
| -------------------------------------------------------- | -------------------- |
| `src/app/api/v1/finance/stats/route.ts` (mới)            | Aggregation endpoint |
| `src/features/finance/components/StatsSection.tsx` (mới) | Chart UI             |
| `src/features/finance/hooks/useFinanceStats.ts` (mới)    | React Query hook     |

## Trạng thái hiện tại

❌ Chưa có gì — endpoint aggregation và toàn bộ UI chart đều mới.

</requirement>

<tone>Concise, technical. Chỉ 2 loại chart (donut + trend) — không thêm biểu đồ thừa nếu user chưa yêu cầu.</tone>
