# Finance — Wallets (Accounts) — số dư đặt tay, ẩn số, không âm

<role>Fullstack engineer cho module Finance</role>

<context>
`Wallet` là một tài khoản ngân hàng, ví tiền mặt hoặc ví điện tử. Ban đầu số dư hoàn toàn do hệ
thống quản lý (bắt đầu 0, chỉ đổi theo transaction). Thực tế không ai bắt đầu sổ từ 0: ví mới nối
SePay chỉ đồng bộ **từ giờ trở đi**, không backfill lịch sử, nên phải nhập được số dư thật ngay.

Tab **Accounts** (`/finance/wallets`, `WalletsPage.tsx`) là nơi quản lý ví, tài khoản vàng
([finance-gold.md](./finance-gold.md)) và preset widget
([finance-transaction-presets.md](./finance-transaction-presets.md)).
</context>

<task>
CRUD ví, cho đặt số dư trực tiếp mà không đè số dư mới hơn, nút ẩn số tiền dùng chung mọi trang,
và giữ ví không bị gõ tay xuống âm.
</task>

<requirement>

## Dữ liệu — `src/server/models/wallet.model.ts`

| Field                | Kiểu                                          | Ghi chú                                        |
| -------------------- | --------------------------------------------- | ---------------------------------------------- |
| `name`               | string ≤50, trim                              | Bắt buộc                                       |
| `type`               | `'bank' \| 'cash' \| 'ewallet'`               | **Không sửa được** sau khi tạo                 |
| `icon`               | string (emoji)                                |                                                |
| `color`              | 7 màu `gold mint violet cyan rose amber blue` |                                                |
| `currency`           | string, default `'VND'`                       |                                                |
| `balance`            | number, default 0                             | Running total — xem [finance.md](./finance.md) |
| `bankCode`           | string?                                       | Chỉ khi `type='bank'`                          |
| `bankAccountNumber`  | string?                                       | Chỉ khi `type='bank'`; khoá map webhook SePay  |
| `sepayWebhookSecret` | string? (bcrypt hash)                         | Xem [finance-sepay.md](./finance-sepay.md)     |
| `active`             | boolean, default `true`                       | Soft-delete                                    |

Index `{userId, active}`, `{bankAccountNumber}` sparse.

`type` bị khoá khi sửa (form disable + `wallet.typeLocked`, `PATCH` không nhận field này): đổi
`cash` ↔ `bank` sẽ lặng lẽ đổi nghĩa lịch sử — cash reminder chỉ đọc ví `cash`, SePay chỉ map ví
`bank`.

## API

| Method      | Endpoint                            | Ghi chú                                                                    |
| ----------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `GET`       | `/api/v1/finance/wallets`           | Ví `active`, sort `createdAt↑`                                             |
| `POST`      | `/api/v1/finance/wallets`           | `balance` optional (default 0); bank fields bị bỏ nếu không phải `bank`    |
| `PATCH`     | `/api/v1/finance/wallets/:id`       | `name icon color balance`; `bankCode`/`bankAccountNumber: null` → `$unset` |
| `DELETE`    | `/api/v1/finance/wallets/:id`       | `active: false`, giữ nguyên transaction lịch sử                            |
| `GET/PATCH` | `/api/v1/finance/wallets/:id/sepay` | Xem [finance-sepay.md](./finance-sepay.md)                                 |

## Đặt số dư trực tiếp

Form (`WalletFormModal.tsx`) có ô balance cả khi tạo lẫn khi sửa, format phân cách nghìn qua
`formatSignedAmountInput` / `toSignedAmountDigits` (`src/features/finance/utils.ts`). Ô này
**nhận số âm** — dành cho ví kiểu nợ.

**Khi sửa, chỉ gửi `balance` nếu user đã gõ vào ô đó** (`balanceTouched`). Trước đây form luôn gửi
lại số dư nó được điền sẵn lúc mở: nếu một transaction (gõ tay hoặc webhook SePay) đến trong lúc
modal mở, bấm Save đổi tên sẽ lặng lẽ kéo số dư về snapshot cũ và xoá mất hiệu ứng của transaction
đó. Hint dưới ô đổi giữa `balanceHintUnedited` và `balanceHint` cho user biết điều này.

## Ví không bị gõ tay xuống âm

Transaction gõ tay (tạo/sửa/xoá) bị từ chối nếu để lại balance < 0; transaction từ ngân hàng thì
được ghi và gắn `overdraft` — luật đầy đủ ở [finance.md](./finance.md). Cái nào lấy ra từ ví đã âm
thì cũng bị chặn, kể cả chi tiêu nhỏ, cho tới khi số dư được đặt lại.

## Ẩn số tiền (privacy toggle)

Nút 👁 / 🙈 thay số dư bằng `AMOUNT_MASK` (`••••••`). State ở
`src/features/finance/stores/finance-ui.store.ts` — Zustand `persist` (localStorage
`finance-ui-storage`), nên giữ qua reload và **đồng bộ giữa Overview và Accounts**: bật ở một nơi
là ẩn ở nơi kia. Có `aria-pressed` + `aria-label` show/hide.

Che: tổng số dư + chip từng ví ở `BalanceCard`, tổng + card ví ở `WalletsPage`/`WalletList`.
**Không** che: list transaction, budget, goals, monthly report — đó là số chi tiêu, không phải
tài sản đang có.

## UI — Accounts

- Header: tổng số dư = tổng `balance` ví active **+ giá trị vàng** (`goldAccount.value`), count-up
  (`useCountUp`), nút ẩn số
- `WalletList` (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`): card vàng **đứng đầu**, mở
  `GoldAccountFormModal`; sau đó mỗi ví một card (icon, tên, số dư theo `color`), sửa / xoá /
  🔌 SePay (chỉ ví bank)
- Xoá ví đi qua confirm modal của app (không dùng `confirm()` của trình duyệt), toast kết quả
- `PresetsPanel` nằm dưới danh sách ví

## Edge cases

| Case                             | Xử lý                                                         |
| -------------------------------- | ------------------------------------------------------------- |
| Xoá ví còn transaction           | Soft-delete; transaction cũ giữ `walletId`, vẫn hiện ở ledger |
| Tạo transaction vào ví đã xoá    | 404 `Wallet not found` (chỉ nhận ví active)                   |
| Đổi bank → bỏ trống số tài khoản | `PATCH bankAccountNumber: null` → `$unset`, webhook ngừng map |

## Ngoài phạm vi

Transfer giữa ví (chưa có — dùng category `excludeFromTotals`) · lịch sử số dư · khôi phục ví đã xoá.

</requirement>

<tone>Ngắn, nói lý do thay vì mô tả lại code.</tone>
