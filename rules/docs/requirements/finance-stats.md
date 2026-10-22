# Finance — Overview & Stats — số liệu một tháng trên một màn

<role>Fullstack engineer cho trang tổng quan Finance</role>

<context>
Thiết kế đầu là một endpoint `/finance/stats` (donut theo category + trend 6 tháng thu/chi) và một
`StatsSection`. **Cái đó không được build.** Thay vào đó Overview (`/finance`, `FinancePage.tsx`)
được dựng lại thành dashboard theo đúng câu hỏi user hỏi trong tháng: đang có bao nhiêu, tháng này
đã tiêu bao nhiêu, hôm nay còn tiêu được bao nhiêu, mục tiêu có kịp không, số dư đang đi về đâu.
</context>

<task>
Hai endpoint tổng hợp server-side (`overview`, `forecast`), các card của Overview, và cách xếp
chúng để vừa một màn điện thoại.
</task>

<requirement>

## Nguyên tắc

Mọi con số đều **suy ra từ ledger lúc đọc**, không lưu gì. Mọi phép tổng đều loại category
`excludeFromTotals` và transaction `overdraft` — luật ở [finance.md](./finance.md).

## `GET /api/v1/finance/overview?month=YYYY-MM&today=YYYY-MM-DD`

`today` là **ngày local của client**: nó quyết định "hôm nay" và "tuần này", để "spent today"
khớp với ngày user chọn trong form transaction chứ không phải ngày UTC của server.
Service: `getFinanceOverview()` (`src/server/services/finance-overview.ts`).

| Field                      | Nghĩa                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `income`, `expense`, `net` | Tổng tháng; `net` có thể âm                                                         |
| `savingsRate`              | `round(net / income × 100)`; **`null` khi không có income** — tỉ lệ trên 0 vô nghĩa |
| `spentToday`, `spentWeek`  | Chi hôm nay / từ thứ Hai tuần này tới hôm nay                                       |
| `daysInMonth`, `daysLeft`  | `daysLeft` tính cả hôm nay; tháng đã qua = 0, tháng tương lai = cả tháng            |
| `topCategories`            | Top **5** category expense: `name icon color amount percentage`                     |
| `recent`                   | 5 transaction mới nhất của tháng                                                    |

## `GET /api/v1/finance/forecast?today=`

`getBalanceForecast()` (`finance-forecast.ts`), `back = 3`, `ahead = 6`:

- `current` = Σ balance ví active (**không** cộng vàng)
- `avgNet` = trung bình net của **các tháng đã xong** có dữ liệu trong 3 tháng trước — tháng hiện
  tại còn đang cộng dồn, tính vào sẽ kéo trung bình xuống đầu tháng
- Điểm quá khứ: đi lùi từ số dư hôm nay, trừ dần net từng tháng (`actual: true`)
- Điểm tương lai: `current + avgNet × i` (`actual: false`)

**Cố ý là đường thẳng** — không mùa vụ, không mô hình goal hay recurring. Cái gì khéo hơn sẽ trông
chính xác mà không đúng hơn. `basedOnMonths = 0` → đường phẳng.

## Card

| Card                     | Nội dung + luật                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `BalanceCard`            | Tổng ví + vàng, breakdown, giá SJC, nút ẩn số ([finance-wallets.md](./finance-wallets.md))                  |
| `MonthSummaryCard`       | Income · Expense · Savings · Savings rate · **Savings vs plan** · plan rate                                 |
| `BudgetProgressCard`     | Budget tháng, **ẩn budget đã ≥100%**; tất cả đều đầy → câu "all budgets full", không phải "chưa đặt budget" |
| `LeftToSpendCard`        | Còn tiêu được từ **budget tổng** + mức/ngày                                                                 |
| `TopSpendingCard`        | `topCategories` dạng thanh tỉ lệ                                                                            |
| `RecentTransactionsCard` | 5 dòng mới nhất + ô quick add ([finance-quick-add-transaction.md](./finance-quick-add-transaction.md))      |
| `SavingsGoalsCard`       | [finance-goals.md](./finance-goals.md)                                                                      |
| `BalanceForecastCard`    | Recharts `AreaChart`, trục rút gọn `87tr` / `850k`                                                          |

Phía trên các card: `MonthStepper`, `MonthlyReportBanner`
([finance-monthly-report.md](./finance-monthly-report.md)), `AllocationBanner` (goals).

## Savings vs plan

Savings thật = income − đã tiêu. Đầu tháng con số này gần bằng cả income, chẳng nói lên gì vì
chưa tiêu gì. Nên cạnh nó có thêm **income − budget tháng**: đọc tháng đang chạy theo **kế hoạch**,
không chỉ theo một tổng chưa xong.

Budget tháng = `monthBudgetLimit()` (`src/features/finance/utils.ts`) — dùng chung với Budget page
và Monthly Report: có budget tổng thì **budget tổng thắng**, không thì cộng các category. Cộng tất
cả các dòng sẽ đếm budget tổng chồng lên chính các category nó bao — lỗi này từng làm Budget page
gấp đôi tổng.

**Không có budget → hiện `—`, không phải 0.** Không có kế hoạch không phải kế hoạch tiêu 0 đồng.

## Left to spend

Chỉ dựa trên **budget tổng** (`categoryId: null`); chưa đặt → CTA tới `/finance/budget`.

- `remaining = limit − spent`; âm → màu crimson + "vượt X"
- `perDay = floor(remaining / daysLeft)` khi còn ngày và còn tiền
- `basePerDay = floor(limit / daysInMonth)`; `carriedOver = max(0, perDay − basePerDay)` — phần
  những ngày trước tiêu dưới mức, hiện màu mint
- `<details>` "How it's calculated" giải thích công thức; kèm spent today / this week

## Bố cục

- `lg+`: lưới hai cột, giữ nguyên
- Dưới `lg`: `BalanceCard` + `MonthSummaryCard` luôn hiện; sáu card còn lại gom vào **3 tab pill**
  — **Budget** (progress, left to spend) · **Spending** (top, recent) · **Goals** (goals, forecast)
  — để Overview vừa một màn điện thoại không phải cuộn
- Chọn layout bằng `matchMedia` + `useSyncExternalStore`, **không** `lg:hidden`: chart chỉ mount một
  lần, đo trên một box thật chứ không phải box `display:none`

## Không làm

Endpoint `/finance/stats` · trend thu/chi 6 tháng · donut ở Overview (donut chỉ có ở Monthly Report).

</requirement>

<tone>Concise, technical. Không thêm chart nếu chưa có câu hỏi nào nó trả lời.</tone>
