# Finance (Cash Flow)

<role>Fullstack engineer + product designer cho gamified personal dashboard</role>

<context>
Dashboard hiện chưa có module quản lý tiền. User muốn theo dõi thu/chi cá nhân, nhiều tài
khoản/ví, đồng bộ tự động giao dịch ngân hàng qua SePay webhook, đặt ngân sách theo tháng,
giao dịch định kỳ và xem biểu đồ thống kê. Đây là module **thuần chức năng — không gắn
XP/coins/quest**, tách biệt hoàn toàn khỏi hệ thống gamification hiện có.
</context>

<task>
Xây dựng module Finance: 3 model nền tảng (Wallet, FinanceCategory, Transaction), trang
`/finance` để quản lý thu/chi. Các phần mở rộng (SePay, Budget, Recurring, Stats) tách thành
requirement doc riêng — xem mục "Tài liệu con" bên dưới.
</task>

<requirement>

## Model: Wallet

Đại diện một tài khoản ngân hàng hoặc ví tiền mặt/ví điện tử.

```
Wallet {
  userId: ObjectId
  name: string              // max 50, required, VD "Vietcombank", "Tiền mặt"
  type: 'bank' | 'cash' | 'ewallet'
  icon: string               // emoji
  color: TaskColor           // reuse từ task.ts
  currency: string           // default 'VND'
  balance: number            // running balance, default 0, cập nhật mỗi transaction
  bankCode?: string          // VD "VCB", "MB" — chỉ khi type='bank', dùng để map SePay gateway
  bankAccountNumber?: string // chỉ khi type='bank', dùng để map SePay accountNumber
  active: boolean            // default true, soft-delete
  createdAt / updatedAt
}
```

- User có nhiều Wallet. Tổng số dư hiển thị = tổng `balance` các wallet active.
- Xoá wallet: soft-delete (`active: false`), giữ nguyên transaction lịch sử (không cascade xoá).

## Model: FinanceCategory

Tách biệt hoàn toàn với `Category` (tag của Task/Habit) — không dùng chung.

```
FinanceCategory {
  userId: ObjectId
  name: string          // max 50, required
  type: 'income' | 'expense'
  icon: string
  color: TaskColor
  createdAt / updatedAt
}
```

- `(userId, name, type)` unique.
- Seed mặc định khi user gọi `GET /api/v1/finance/categories` lần đầu mà rỗng:
  - **expense**: Ăn uống, Di chuyển, Mua sắm, Hoá đơn, Giải trí, Sức khoẻ, Khác
  - **income**: Lương, Thưởng, Khác
- Không cho xoá category đang được Transaction nào tham chiếu (409).

## Model: Transaction

```
Transaction {
  userId: ObjectId
  walletId: ObjectId        // ref Wallet
  categoryId: ObjectId      // ref FinanceCategory
  type: 'income' | 'expense'
  amount: number             // luôn dương, min 0.01
  note?: string              // max 200
  date: Date                 // ngày giao dịch (khác createdAt)
  source: 'manual' | 'sepay' | 'recurring'  // default 'manual'
  sepayTransactionId?: string  // id giao dịch từ SePay, unique sparse — chống trùng khi webhook retry
  recurringId?: ObjectId       // ref RecurringTransaction (xem finance-recurring.md)
  createdAt / updatedAt
}
```

- Không hỗ trợ transfer giữa 2 wallet trong phạm vi này (ngoài scope).
- Tạo/sửa/xoá transaction → cập nhật `Wallet.balance` tương ứng (income: +amount, expense: -amount).
- Index: `{ userId: 1, walletId: 1, date: -1 }`, `{ userId: 1, categoryId: 1 }`,
  `{ sepayTransactionId: 1 }` (unique, sparse).

## API

| Method   | Endpoint                           | Mô tả                                                             |
| -------- | ---------------------------------- | ----------------------------------------------------------------- |
| `GET`    | `/api/v1/finance/wallets`          | List wallet active của user + `balance`                           |
| `POST`   | `/api/v1/finance/wallets`          | Tạo wallet                                                        |
| `PATCH`  | `/api/v1/finance/wallets/:id`      | Sửa wallet (name, icon, color, bankCode, ...)                     |
| `DELETE` | `/api/v1/finance/wallets/:id`      | Soft-delete (`active: false`)                                     |
| `GET`    | `/api/v1/finance/categories`       | List category theo `type` (query `?type=`), auto-seed             |
| `POST`   | `/api/v1/finance/categories`       | Tạo category                                                      |
| `DELETE` | `/api/v1/finance/categories/:id`   | Xoá — 409 nếu đang dùng                                           |
| `GET`    | `/api/v1/finance/transactions`     | List, filter `?walletId=&categoryId=&type=&from=&to=`, phân trang |
| `POST`   | `/api/v1/finance/transactions`     | Tạo transaction (source luôn `'manual'` qua endpoint này)         |
| `PATCH`  | `/api/v1/finance/transactions/:id` | Sửa (đảo balance cũ, áp balance mới)                              |
| `DELETE` | `/api/v1/finance/transactions/:id` | Xoá, hoàn `Wallet.balance`                                        |

## UI — Routing

```
src/app/[locale]/(protected)/finance/
└── page.tsx     // trang chính
```

Thêm mục "Finance" vào sidebar/nav (protected).

## UI — FinancePage Layout

- **Header**: tổng số dư (tổng các wallet) + nút "+ Add Transaction".
- **Wallet strip**: card ngang scroll-x cho từng wallet (icon, tên, balance). Click → filter
  transaction list theo wallet đó. Nút "+ Wallet" cuối strip.
- **Filter bar**: search theo note, dropdown category, dropdown type (income/expense/all),
  date range picker.
- **Transaction list**: nhóm theo ngày, mỗi item hiện icon category, note, wallet, amount
  (màu xanh cho income, đỏ cho expense).
- Responsive: wallet strip → scroll ngang trên mobile; filter bar → collapse vào dropdown
  "Filters" trên `< sm`; list giữ 1 cột mọi breakpoint.

## Reuse / Types

| File                                                | Thay đổi                                             |
| --------------------------------------------------- | ---------------------------------------------------- |
| `src/server/models/wallet.model.ts` (mới)           | Model Wallet                                         |
| `src/server/models/finance-category.model.ts` (mới) | Model FinanceCategory                                |
| `src/server/models/transaction.model.ts` (mới)      | Model Transaction                                    |
| `src/types/finance.ts` (mới)                        | `Wallet`, `FinanceCategory`, `Transaction`, payloads |
| `src/services/endpoints/finance.ts` (mới)           | Axios client                                         |
| `src/features/finance/` (mới)                       | Feature module — components, hooks, adapters         |
| i18n `src/i18n/locales/`                            | strings cho finance                                  |

## Tài liệu con

| #   | Doc                                            | Phạm vi                                  |
| --- | ---------------------------------------------- | ---------------------------------------- |
| 1   | [finance-sepay.md](./finance-sepay.md)         | Webhook SePay tự động tạo transaction    |
| 2   | [finance-budget.md](./finance-budget.md)       | Ngân sách theo tháng/category + cảnh báo |
| 3   | [finance-recurring.md](./finance-recurring.md) | Giao dịch định kỳ (lazy-generate)        |
| 4   | [finance-stats.md](./finance-stats.md)         | Biểu đồ thu/chi theo tháng/category      |

**Thứ tự triển khai đề xuất:** Wallet + FinanceCategory + Transaction (nền tảng) → SePay
webhook → Stats → Budget → Recurring.

</requirement>

<tone>Concise, technical. Không over-engineer — đây là công cụ quản lý tiền cá nhân đơn giản, không phải kế toán doanh nghiệp.</tone>
