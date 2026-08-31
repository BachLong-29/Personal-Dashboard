# Finance — Monthly Report

<role>Fullstack engineer thêm tính năng Báo cáo chi tiêu tháng (Monthly Report) cho module Finance</role>

<context>
[finance-budget.md](./finance-budget.md) đã có `Budget` model + `listBudgetsWithSpent()` (spent/limit/%
mỗi category, ngưỡng màu mint <80% / amber 80–99% / rose >=100%, dùng trong `BudgetList.tsx`). User muốn 1
trang tổng kết trực quan, nhiều animation, cho **một tháng đã kết thúc** — không áp dụng cho tháng đang
diễn ra, vì số liệu tháng chưa xong là chưa "chốt".
</context>

<task>
Page mới `/finance/monthly-report?month=YYYY-MM`, dạng "sách" 2 trang (page-flip) tổng hợp thu/chi + budget
của 1 tháng đã qua. Nút vào page này chỉ xuất hiện khi tháng đang xem (qua `MonthStepper` ở Overview) đã
kết thúc.
</task>

<requirement>

## Điều kiện truy cập

- Chỉ `month < currentMonthKey()` (tháng đã kết thúc hoàn toàn) mới có nút/entry point.
- Vào thẳng URL với tháng hiện tại/tương lai → redirect về `/finance`.

## Entry point — nút "Xem báo cáo"

- Overview page: khi `MonthStepper` đang ở tháng đã qua, hiện banner CTA phía trên các card: "📊 Báo cáo
  tháng {Tên tháng}" → `Link` tới `/finance/monthly-report?month=...`.
- Khi đang xem tháng hiện tại (mặc định khi mở Overview), thêm 1 banner riêng mời xem báo cáo **tháng
  trước** — đúng ý "đầu tháng có nút" mà không bắt user tự bấm prev. Dismiss theo session (giống
  `OverdueReviewModal`'s `dismissModal`/`sessionStorage` pattern), không hỏi lại trong cùng phiên.

## API — không cần route mới

`useFinanceOverview(month)` (`GET /finance/overview`) đã trả `income`/`expense`/`net`/`topCategories`
(`OverviewCategorySlice[]`, có sẵn `icon`/`color`/`amount`/`percentage`). `useBudgets(month)`
(`GET /finance/budgets`) đã trả đúng `BudgetWithSpent` shape (spent/limit/percentage/categoryName). Trang
report chỉ cần **gọi lại 2 hook này trên client**, KHÔNG viết endpoint mới:

- `overallBudget = budgets.find(b => b.categoryId === null)`.
- `totalBudgetLimit = overallBudget?.limit ?? sum(limit của budget có categoryId)`.
- `savings = totalBudgetLimit > 0 && overview.expense < totalBudgetLimit ? totalBudgetLimit - overview.expense : null`.
- `overBudget = budgets.filter(b => b.percentage >= 100)`.
- `topCategories = overview.topCategories` — dùng thẳng cho donut chart.

Validate "tháng đã kết thúc" ở **route `page.tsx`** (so `month` param với `currentMonthKey()`), không phải
ở API — vì không có API riêng.

## UI — 2 "trang" kiểu sách, page-flip

### Trang 1 — Tổng quan

- Header: tên tháng + khoảng ngày.
- 3 stat lớn: Tổng thu / Tổng chi / Số dư ròng — count-up khi vào trang (reuse `useCountUp`).
- `savings != null` → banner mint "🎉 Tiết kiệm được {savings}₫ ({%} ngân sách)".
- `overBudget.length > 0` → list cảnh báo rose, mỗi dòng: tên category, số tiền vượt (`spent - limit`), %,
  icon ⚠.
- Donut chart (recharts) — `topCategories`.

### Trang 2 — Chi tiết ngân sách

- Full list `budgets`: progress bar spent/limit, màu theo đúng ngưỡng của `BudgetList.tsx` (reuse, không
  bịa ngưỡng mới).
- `budgets.length === 0` → empty state "Tháng này chưa đặt ngân sách nào."
- % mỗi budget category trong `totalBudgetLimit` — bar ngang hoặc donut thứ 2.

### Điều hướng + animation (Framer Motion — đã là dependency, xem `BudgetPage.tsx`/`SectionCard.tsx`)

- Vào trang: stagger fade + slide-up từng section, cùng nhịp với convention hiện có.
- Chuyển trang 1↔2: page-flip 3D (`rotateY`) — đúng cảm giác "lật trang sách"; nút ◂ 1/2 ▸ dưới cùng +
  swipe (touch drag) trên mobile.
- Responsive: mobile full-screen từng trang; `lg:` trở lên cân nhắc hiện cả 2 trang cạnh nhau kiểu sách mở
  nếu đủ chỗ — quyết định cụ thể lúc code theo nội dung thực tế.

## Reuse

| File / hook                                               | Vai trò                                            |
| --------------------------------------------------------- | -------------------------------------------------- |
| `listBudgetsWithSpent()` (`finance-budget.ts`)            | Nguồn spent/limit/percentage — không viết lại      |
| `BudgetList.tsx` (màu progress bar)                       | Đồng bộ ngưỡng mint/amber/rose                     |
| `useCountUp`                                              | Count-up số tổng thu/chi/balance                   |
| `SectionCard.tsx`, `BudgetPage.tsx`                       | Convention Framer Motion hiện có                   |
| `MonthStepper`, `currentMonthKey()`, `formatMonthLabel()` | Dùng lại nguyên, không viết bản mới                |
| `dataviz` skill                                           | Đọc trước khi viết chart code (palette, mark spec) |

## Trạng thái hiện tại

❌ Chưa có gì — route `/finance/monthly-report`, API, và toàn bộ UI 2-trang đều mới.

</requirement>

<tone>Concise, technical. Không vẽ thêm chart/số liệu ngoài yêu cầu — chỉ overview + budget breakdown +
savings + warnings. "Nhiều animation" nghĩa là mượt và có chủ đích (enter + page-turn + tương tác), không
phải hiệu ứng thừa gây rối mắt hay nặng máy yếu.</tone>
