# Finance — Monthly Report — "cuốn sách" tổng kết một tháng đã xong

<role>Fullstack engineer cho Báo cáo tháng của module Finance</role>

<context>
Overview trả lời "tháng này đang thế nào". User muốn thêm một trang tổng kết trực quan, có
animation, cho **một tháng đã kết thúc** — không cho tháng đang chạy, vì số liệu chưa xong là chưa
"chốt", và một báo cáo đổi số mỗi lần mở thì không phải báo cáo.
</context>

<task>
Route `/finance/monthly-report?month=YYYY-MM`, dạng sách hai trang lật 3D: trang tổng quan thu/chi
và trang chi tiết ngân sách. Không có API mới.
</task>

<requirement>

## Điều kiện truy cập

Validate ở **server page** (`src/app/[locale]/(protected)/finance/monthly-report/page.tsx`), vì
không có API riêng để validate: thiếu `month`, sai `YYYY-MM`, hoặc `month >= tháng hiện tại` →
`redirect('/finance')`. Chỉ tháng **đã qua hoàn toàn** mới có báo cáo.

## Entry point — `MonthlyReportBanner` (Overview)

- `MonthStepper` đang ở tháng đã qua → banner 📊 "Báo cáo tháng {tháng}" → link tới report
- Đang ở **tháng hiện tại** (mặc định khi mở Overview) → banner mời xem báo cáo **tháng trước** —
  đúng ý "đầu tháng có nút" mà không bắt user tự bấm lùi. Nút đóng lưu
  `sessionStorage['finance_monthly_report_nudge_dismissed']`: không hỏi lại trong cùng phiên
- Đang ở tháng tương lai → không hiện gì

Không có link "Back to Finance" trong trang — tab Finance ở trên đã làm việc đó.

## Dữ liệu — tái dùng hook, tính ở client

`MonthlyReportPage.tsx` gọi `useFinanceOverview(month)` + `useBudgets(month)` và tự suy:

```ts
totalBudgetLimit = monthBudgetLimit(budgets); // budget tổng thắng, không thì cộng category
savings = totalBudgetLimit > 0 && expense < totalBudgetLimit ? totalBudgetLimit - expense : null;
savingsPercent = round((savings / totalBudgetLimit) * 100);
overBudget = budgets.filter((b) => b.percentage >= 100);
```

`monthBudgetLimit()` (`src/features/finance/utils.ts`) dùng chung với Overview và Budget page —
viết riêng ở đây từng là chỗ thứ ba trả lời câu "budget tháng là bao nhiêu" theo một cách khác.

Vì dẫn xuất từ overview + budgets, báo cáo **tự động** loại category `excludeFromTotals` và
transaction `overdraft` ([finance.md](./finance.md)). Không cần lọc gì thêm.

Lưu ý: `savings` ở đây là **so với ngân sách** (budget − đã chi), khác "Savings" ở
`MonthSummaryCard` (income − chi) — xem [finance-stats.md](./finance-stats.md).

## Trang 1 — Tổng quan (`ReportOverviewPage.tsx`)

- Header: tên tháng (`formatMonthLabel`)
- Ba stat: Thu (mint) / Chi (rose) / Net — count-up (`useCountUp`), stagger delay
- `savings != null` → banner mint "Tiết kiệm được {savings} ({%} ngân sách)"
- `overBudget.length > 0` → list cảnh báo ⚠ màu rose: category, số vượt (`spent − limit`), %
- Donut Recharts (`PieChart`) trên `overview.topCategories` (top 5)

## Trang 2 — Ngân sách (`ReportBudgetPage.tsx`)

- Toàn bộ `budgets`: progress spent/limit, **cùng ngưỡng màu với `BudgetList.tsx`**
  (`<80%` mint · `80–99%` gold · `≥100%` danger), % hiển thị chặn ở 999
- Mỗi dòng kèm % của nó trong `totalBudgetLimit`
- Không có budget → "Tháng này chưa đặt ngân sách nào."
- Trang **tự cuộn** khi list dài (từng không cuộn được với nhiều budget)

## Lật trang — `BookFlip.tsx` (Framer Motion)

- `rotateY` ±78° theo hướng lật, `perspective: 1600`; hướng đi qua `custom` + variants function
  — đặt cứng thì lật lùi chạy sai chiều (lỗi đã sửa)
- Điều hướng: nút ◂ / ▸ (`ArrowLeft` / `ArrowRight` icon asset của app), chấm từng trang
  (`aria-current`), và **swipe** ngang trên touch — kéo quá **80px** mới lật
- `prefers-reduced-motion` → bỏ perspective và xoay, chỉ còn fade
- Một trang mỗi lần ở **mọi** kích thước — chưa có chế độ hai trang cạnh nhau trên desktop

## Ngoài phạm vi

Báo cáo tháng đang chạy · xuất PDF/ảnh · so sánh nhiều tháng · chart ngoài donut và progress.

</requirement>

<tone>Concise, technical. "Nhiều animation" nghĩa là mượt và có chủ đích (vào trang, lật trang,
tương tác), không phải hiệu ứng thừa làm nặng máy yếu.</tone>
