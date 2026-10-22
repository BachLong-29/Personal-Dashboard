# Finance (Cash Flow) — sổ thu/chi cá nhân, nhiều ví

<role>Fullstack engineer + product designer cho gamified personal dashboard</role>

<context>
User theo dõi thu/chi cá nhân trên nhiều tài khoản (ngân hàng, tiền mặt, ví điện tử), đồng bộ
giao dịch ngân hàng qua SePay, đặt ngân sách tháng, tích luỹ mục tiêu tiết kiệm và theo dõi vàng.

Đây là module **thuần chức năng — không gắn XP/coins/quest**, tách hẳn khỏi gamification. Một
công cụ tiền cá nhân, không phải kế toán doanh nghiệp: không transfer, không đa tiền tệ thật
(`currency` có nhưng gần như luôn là `VND`), không sổ cái kép.
</context>

<task>
Doc gốc của module: 3 model nền (`Wallet`, `FinanceCategory`, `Transaction`), luật số dư, luật
"cái gì được tính vào tổng", và cấu trúc tab `/finance`. Chi tiết từng phần nằm ở doc con.
</task>

<requirement>

## Model: Transaction (`src/server/models/transaction.model.ts`)

| Field                | Kiểu                                 | Ghi chú                                                        |
| -------------------- | ------------------------------------ | -------------------------------------------------------------- |
| `walletId`           | ObjectId → Wallet                    | Bắt buộc                                                       |
| `categoryId`         | ObjectId → FinanceCategory           | Bắt buộc, `type` phải khớp `type` của category                 |
| `type`               | `'income' \| 'expense'`              |                                                                |
| `amount`             | number, `min 0.01`                   | Luôn dương — dấu nằm ở `type`                                  |
| `note`               | string?, ≤200                        |                                                                |
| `date`               | Date                                 | Ngày giao dịch, API trả `YYYY-MM-DD`                           |
| `source`             | `'manual' \| 'sepay' \| 'recurring'` | `POST` thường luôn ghi `'manual'`                              |
| `overdraft`          | boolean, default `false`             | Xem "Ví không âm" dưới                                         |
| `sepayTransactionId` | string?, unique sparse               | Chống trùng khi SePay retry                                    |
| `recurringId`        | ObjectId?                            | Chưa dùng — xem [finance-recurring.md](./finance-recurring.md) |

Index: `{userId, walletId, date:-1}`, `{userId, categoryId}`, `{sepayTransactionId}` unique sparse.

`Wallet` → [finance-wallets.md](./finance-wallets.md). `FinanceCategory` →
[finance-categories.md](./finance-categories.md).

## Số dư là running total, không phải giá trị suy ra

`Wallet.balance` được `$inc` mỗi lần tạo/sửa/xoá transaction (income `+`, expense `−`); sửa thì
đảo hiệu ứng cũ trên ví cũ rồi áp hiệu ứng mới lên ví mới. Ngoài ra user **đặt thẳng** số dư
được (ví mới nối SePay không có lịch sử để cộng dồn) — nên balance **không** bằng tổng ledger,
và không có job nào tính lại nó.

## Ví không âm — chặn khi gõ tay, ghi nhận khi từ ngân hàng

`POST`/`PATCH`/`DELETE /transactions` trả **400** `This would put the wallet below zero` nếu số
dư sau thao tác < 0. Cả sửa và xoá đều bị kiểm: tăng một khoản chi, chuyển sang ví mỏng hơn, hay
xoá một khoản thu đều làm âm y như tạo mới — chỉ chặn tạo mới là khoá cửa trước bỏ cửa sau.
`TransactionFormModal` hiện nguyên câu lỗi của server trong modal.

Từ webhook SePay thì khác: tiền **đã đi** ở ngân hàng, nên balance vẫn đi theo dù xuống âm —
số dư lệch sao kê còn tệ hơn số âm. Transaction đó được gắn `overdraft: true`:

- vẫn di chuyển balance, nhưng **bị loại khỏi** income/expense/budget/forecast/cash-reminder
- hiện dấu `!` ở `TransactionRow`; mở ra có hộp giải thích + nút **Count it anyway**
  (`PATCH { overdraft: false }`)

Ví âm gần như luôn có nghĩa số dư mở đầu chưa đặt đúng — cờ là thứ nói điều đó ra.

## Tiền không phải thu cũng không phải chi

Category có `excludeFromTotals: true` (chỉnh số dư cho khớp ngân hàng, chuyển tiền giữa các ví
của mình): transaction vẫn di chuyển ví, nhưng bị loại khỏi mọi phép tổng. Cờ nằm ở **category**,
không chép xuống từng transaction — bật cờ sau này thì row cũ cũng theo, bản sao trên row sẽ thành
dối. `excludedCategoryIds()` (`src/server/services/finance-exclusions.ts`) là nguồn duy nhất.

**Năm chỗ cộng tiền phải cùng lọc** cả hai luật (`categoryId $nin excluded`, `overdraft $ne
true`): `finance-overview.ts`, `finance-budget.ts`, `finance-forecast.ts`,
`cash-log-notifications.ts`, và Monthly Report (dẫn xuất từ hai cái đầu). Sót một chỗ là hai màn
hiện hai con số khác nhau. Bật cờ **không** viết lại quá khứ — row đã ghi là income thì phải đổi
category.

## API — Transactions

| Method   | Endpoint                           | Ghi chú                                                                                                        |
| -------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/v1/finance/transactions`     | `?walletId&categoryId&type&from&to&search` (regex trên `note`), sort `date↓`, **tối đa 500, không phân trang** |
| `POST`   | `/api/v1/finance/transactions`     | Ví phải active + thuộc user; category phải đúng `type`                                                         |
| `PATCH`  | `/api/v1/finance/transactions/:id` | Mọi field optional; `note: null` → `$unset`; `overdraft`                                                       |
| `DELETE` | `/api/v1/finance/transactions/:id` | Hard delete, hoàn balance                                                                                      |

## UI — Routing (`src/app/[locale]/(protected)/finance/`)

`layout.tsx` = `DashboardTopbar` + `FinanceTabs` (Link của App Router, không state nội bộ):

| Tab          | Route                            | Doc                                                      |
| ------------ | -------------------------------- | -------------------------------------------------------- |
| Overview     | `/finance`                       | [finance-stats.md](./finance-stats.md)                   |
| Accounts     | `/finance/wallets`               | [finance-wallets.md](./finance-wallets.md)               |
| Budget       | `/finance/budget`                | [finance-budget.md](./finance-budget.md)                 |
| Goals        | `/finance/goals`                 | [finance-goals.md](./finance-goals.md)                   |
| Transactions | `/finance/transactions`          | (dưới)                                                   |
| Categories   | `/finance/categories`            | [finance-categories.md](./finance-categories.md)         |
| —            | `/finance/monthly-report?month=` | [finance-monthly-report.md](./finance-monthly-report.md) |

**Transactions** (`TransactionsPage.tsx`): full ledger, `FinanceFilters` (search note, tab
all/income/expense, category, wallet) + chọn tháng trong 12 tháng gần nhất hoặc "tất cả"; nhóm
theo ngày (`formatDateGroup`: Today / Yesterday / `Mon, Jan 5`). Overview chỉ hiện 5 dòng mới nhất.

**Form** (`TransactionFormModal.tsx`): category là `Select searchable selectedFirst` (chip grid cũ
chiếm năm hàng ở hai chục category), nút `＋ New category` mở `FinanceCategoryFormModal` khoá theo
type hiện tại và tự chọn category vừa tạo; ngày dùng `DatePicker` của design system; Enter submit.

## Code chính

`src/types/finance.ts` · `src/services/endpoints/finance.ts` · `src/features/finance/`
(components, hooks React Query, `utils.ts`, `quick-entry.ts`, `budget-csv.ts`) · i18n `en/vi/th`.

## Tài liệu con

[finance-wallets](./finance-wallets.md) · [finance-categories](./finance-categories.md) ·
[finance-sepay](./finance-sepay.md) · [finance-budget](./finance-budget.md) ·
[finance-budget-import](./finance-budget-import.md) · [finance-stats](./finance-stats.md) ·
[finance-goals](./finance-goals.md) · [finance-gold](./finance-gold.md) ·
[finance-monthly-report](./finance-monthly-report.md) ·
[finance-quick-add-transaction](./finance-quick-add-transaction.md) ·
[finance-transaction-presets](./finance-transaction-presets.md) ·
[cash-log-reminder](./cash-log-reminder.md) · [finance-recurring](./finance-recurring.md) (chưa làm)

## Ngoài phạm vi

Transfer giữa hai ví (dùng cặp transaction trên category `excludeFromTotals`) · đa tiền tệ ·
import/export transaction · phân trang ledger.

</requirement>

<tone>Concise, technical. Nói lý do của luật, không mô tả lại code.</tone>
