# Finance — Budget — hạn mức chi tiêu theo tháng

<role>Fullstack engineer cho tính năng ngân sách của module Finance</role>

<context>
Budget là hạn mức chi user tự đặt cho một tháng — tổng hoặc theo category expense — để thấy trước
khi tiêu quá, và được nhắc khi đã quá. Chỉ cảnh báo, **không** trừ XP/coins, không phạt.

Phần lớn khoản chi lặp lại y hệt mỗi tháng, nên đặt lại 16 hạn mức mỗi đầu tháng là việc thừa:
budget có cờ `recurring` để tự áp cho các tháng sau. Nhập cả tháng một lần qua bảng:
[finance-budget-import.md](./finance-budget-import.md).
</context>

<task>
Model `Budget`, `spent` suy ra từ ledger, budget lặp sang tháng sau, cảnh báo vượt mức, trang
`/finance/budget`.
</task>

<requirement>

## Dữ liệu — `src/server/models/budget.model.ts`

| Field        | Kiểu                         | Ghi chú                                          |
| ------------ | ---------------------------- | ------------------------------------------------ |
| `categoryId` | ObjectId? → category expense | **Bỏ trống = budget tổng** của tháng             |
| `month`      | `YYYY-MM`                    | Tháng **đầu tiên** budget áp dụng                |
| `limit`      | number ≥1                    |                                                  |
| `recurring`  | boolean, default `false`     | Áp cả các tháng sau `month` chưa có budget riêng |

Unique `(userId, categoryId, month)` — Mongo index `categoryId` thiếu như `null`, nên vẫn chặn
được "hai budget tổng trong một tháng". Chỉ có budget cho expense.

## Budget đang hiệu lực của một tháng

`resolveActiveBudgets()` (`src/server/services/finance-budget.ts`):

1. Mọi budget có `month` đúng tháng đó (explicit)
2. Với mỗi category (và budget tổng) **chưa** có explicit: lấy budget `recurring` có `month` gần
   nhất **trước** tháng đó

Explicit luôn thắng — đó là cách ghi đè một tháng. Budget kế thừa trả về với `month` = **tháng
đang xem** (spent cũng tính theo tháng đó), nhưng `id` vẫn là bản ghi gốc — nên **sửa limit của
budget kế thừa là sửa luôn bản gốc**, ảnh hưởng mọi tháng kế thừa nó. Form nói rõ điều này
("↻ Recurring — editing the limit also updates every later month that inherits it").

## `spent` — suy ra, không lưu, không cache

Σ `amount` các transaction `expense` trong tháng (UTC `monthRange`), **trừ** category
`excludeFromTotals` và transaction `overdraft` ([finance.md](./finance.md)); lọc theo `categoryId`
nếu có, ngược lại là toàn bộ expense. `percentage = round(spent / limit × 100)`.

## API

| Method   | Endpoint                         | Ghi chú                                                                  |
| -------- | -------------------------------- | ------------------------------------------------------------------------ |
| `GET`    | `/api/v1/finance/budgets?month=` | Budget hiệu lực + spent; default tháng hiện tại                          |
| `POST`   | `/api/v1/finance/budgets`        | `categoryId? month limit recurring?`; trùng explicit → **409**           |
| `PATCH`  | `/api/v1/finance/budgets/:id`    | **Chỉ `limit`**                                                          |
| `DELETE` | `/api/v1/finance/budgets/:id`    | Hard delete — xoá bản gốc recurring thì các tháng kế thừa mất theo       |
| `POST`   | `/api/v1/finance/budgets/import` | Upsert cả tháng — [finance-budget-import.md](./finance-budget-import.md) |

Item: `{ id, categoryId | null, categoryName ('Overall' cho budget tổng), month, limit,
recurring, spent, percentage, createdAt, updatedAt }`, sort theo `createdAt`.

Xoá category bị chặn (409) nếu còn budget ở tháng hiện tại/tương lai trỏ vào nó.

## Cảnh báo vượt ngân sách

`generateBudgetNotifications()` (`budget-notifications.ts`) chạy **lúc `GET /budgets`** (best-effort,
lỗi chỉ log) — repo không có scheduler. Throttle 5 phút trong tiến trình; chỉ xét **tháng hiện
tại**. Budget ≥100% → upsert notification `type: 'system'`, title `⚠ Budget Exceeded`, message
`{category} vượt ngân sách {số vượt}₫ ({%}%)`, `dedupeKey = budget:{id}:{month}` — một lần mỗi
tháng mỗi budget. Sau đó `enforceNotificationCap`.

Hệ quả: siết limit giữa tháng **không** bắn lại nếu budget đó đã cảnh báo tháng này.

## UI — `/finance/budget` (`BudgetPage.tsx`)

- Header: `MonthStepper`, tổng spent / `monthBudgetLimit()` (budget tổng thắng, không thì cộng
  category — xem [finance-stats.md](./finance-stats.md)), nút tải template + Import + `＋ Set Budget`
- **Tháng quá khứ: chỉ xem** — nút tạo và Import disable (`budget.pastMonth`)
- `BudgetList`: card mỗi budget, màu progress `<80%` mint · `80–99%` gold · `≥100%` danger; hiệu
  ứng shimmer trên thanh chưa đầy; biểu tượng ↻ cho budget recurring
- Xoá qua confirm modal của app, toast kết quả

**`BudgetFormModal`**:

- Option "Overall" + category expense, **ẩn category `excludeFromTotals`** (hạn mức trên nó sẽ 0% mãi)
- Category đã có budget tháng này bị **disable và đẩy xuống cuối** list
- "Applies to" một lần / recurring **chỉ khi tạo**; khi sửa chỉ còn limit (+ ghi chú ↻ nếu
  recurring); nút `＋ New category` (khoá expense)

**Overview**: `BudgetProgressCard` ẩn budget đã đầy; `LeftToSpendCard` dùng budget tổng
([finance-stats.md](./finance-stats.md)).

## Edge cases

| Case                                         | Xử lý                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| Budget kế thừa + tạo explicit cùng category  | Explicit thắng từ tháng đó; tháng sau vẫn kế thừa bản recurring gần nhất trước nó |
| Category của budget bị xoá (budget tháng cũ) | `categoryName: 'Unknown'`                                                         |
| `POST` cho tháng quá khứ                     | **Server không chặn** — chỉ UI chặn                                               |

## Ngoài phạm vi

Budget cho income · theo tuần/năm · rollover phần dư sang tháng sau · tắt recurring cho một bản đã
lưu (PATCH chỉ nhận `limit`).

</requirement>

<tone>Concise, technical. Không over-engineer.</tone>
