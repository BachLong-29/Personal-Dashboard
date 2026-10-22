# Finance — Transaction Presets — giao dịch một chạm cho widget mobile

<role>Fullstack engineer nối web và app mobile qua cùng một bộ preset</role>

<context>
App mobile (`../Dashboard-app`, Expo) có widget màn hình chính để ghi một khoản quen thuộc bằng
một chạm — gửi xe, cà phê, xăng. Trước đây preset của widget chỉ nằm trên máy: đổi máy là mất,
và web không biết gì về nó.

Lưu preset ở server thì web và app **dùng chung một bộ**: sửa ở web, widget đổi theo.
</context>

<task>
Model `TransactionPreset` + CRUD `/api/v1/finance/presets` (tối đa 4/user), và panel quản lý
preset trên tab Accounts của web.
</task>

<requirement>

## Dữ liệu — `src/server/models/transaction-preset.model.ts`

| Field        | Kiểu                             | Ghi chú                       |
| ------------ | -------------------------------- | ----------------------------- |
| `label`      | string, trim, 1–16               | Ngắn vì phải vừa một ô widget |
| `type`       | `'income' \| 'expense'`          |                               |
| `amount`     | integer dương, ≤ 999.999.999.999 | Đơn vị VND, không lẻ          |
| `walletId`   | ObjectId → Wallet                |                               |
| `categoryId` | ObjectId → FinanceCategory       |                               |
| `note`       | string?, ≤100                    | Chép vào transaction khi bấm  |

`MAX_TRANSACTION_PRESETS = 4` (export từ model, và từ `src/types/finance.ts` cho client). Giới
hạn đặt ở server để web và app không thể lệch nhau về số preset — lý do chọn đúng số 4 (kích thước
widget?) chưa được ghi lại.

Preset **không phải transaction**: lưu preset không đụng ví hay ledger. Repo này không có
endpoint "chạy preset" — transaction do phía app tạo khi bấm widget, và đường duy nhất server mở
cho việc đó là `POST /api/v1/finance/transactions` thường, nên nó chịu luật ví không âm và kiểm
tra category/type như mọi transaction gõ tay ([finance.md](./finance.md)).

## API

| Method   | Endpoint                      | Ghi chú                                              |
| -------- | ----------------------------- | ---------------------------------------------------- |
| `GET`    | `/api/v1/finance/presets`     | Sort `createdAt↑` — thứ tự ô trên widget             |
| `POST`   | `/api/v1/finance/presets`     | Đủ 4 → `validationErrorResponse` `At most 4 presets` |
| `PATCH`  | `/api/v1/finance/presets/:id` | Partial; `note: null` hoặc `''` → `$unset`           |
| `DELETE` | `/api/v1/finance/presets/:id` | Hard delete                                          |

Response item: `{ id, label, type, amount, walletId, categoryId, note? }`. Đây là contract với
app mobile — **thêm field được, đổi tên/bỏ field thì phải sửa app cùng lúc**.

## UI — `PresetsPanel.tsx` (dưới danh sách ví ở `/finance/wallets`)

- Tiêu đề + hint "tối đa {count}"; nút `＋ Add` **ẩn** khi đã đủ 4
- Lưới `grid-cols-1 sm:grid-cols-2`: mỗi preset một ô — label, số tiền có dấu (`+` mint / `−` rose)
- Bấm ô → modal sửa (cũng là nơi xoá); empty state khi chưa có preset
- Modal: label (`maxLength 16`), toggle type, amount, wallet, category (lọc theo type, đổi type
  thì bỏ chọn category), note
- Wallet / category chưa chọn → modal mặc định lấy phần tử **đầu tiên** của danh sách

## Edge cases

| Case                                 | Xử lý hiện tại                                                 |
| ------------------------------------ | -------------------------------------------------------------- |
| Ví của preset bị xoá (soft-delete)   | Preset vẫn còn; tạo transaction từ nó → 404 `Wallet not found` |
| Category của preset bị xoá           | Xoá category không kiểm preset → preset trỏ vào id chết        |
| Hai thiết bị cùng thêm khi đang có 3 | Đếm-rồi-tạo không atomic → có thể vượt 4                       |

## Nợ đã biết

Server **không kiểm** `walletId`/`categoryId` thuộc user, ví còn active, hay category đúng `type`
lúc lưu preset — lỗi chỉ lộ ra lúc bấm. Kiểm tra đó nằm ở `POST /transactions`, nên dữ liệu
ledger không sai, nhưng widget có thể hiện một nút chắc chắn hỏng.

## Ngoài phạm vi

Sắp xếp lại thứ tự preset · preset theo thời điểm trong ngày · bấm preset ngay trên web.

</requirement>

<tone>Ngắn, nói lý do thay vì mô tả lại code.</tone>
