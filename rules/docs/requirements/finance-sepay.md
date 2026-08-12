# Finance — SePay Webhook Integration

<role>Backend engineer tích hợp webhook SePay để tự động ghi nhận giao dịch ngân hàng</role>

<context>
[finance.md](./finance.md) định nghĩa `Wallet` (có `bankCode` + `bankAccountNumber`) và
`Transaction` (có `source: 'sepay'` + `sepayTransactionId` unique). SePay là dịch vụ nhận
webhook mỗi khi tài khoản ngân hàng liên kết phát sinh giao dịch (chuyển khoản vào/ra qua
VietQR). SePay POST payload tới một URL webhook do user cấu hình trên dashboard SePay,
xác thực bằng header `Authorization: Apikey <API_KEY>`.

**Payload thực tế từ SePay** (xác nhận từ docs.sepay.vn):

```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2024-07-02 11:08:33",
  "accountNumber": "1017588888",
  "subAccount": "",
  "code": "SEVN63DC8E5C",
  "content": "SEVN63DC8E5C chuyen tien",
  "transferType": "in",
  "description": "NGUYEN VAN A chuyen tien",
  "transferAmount": 5000000,
  "accumulated": 105000000,
  "referenceCode": "FT24012345678"
}
```

`transferType`: `"in"` (tiền vào = income) hoặc `"out"` (tiền ra = expense).
</context>

<task>
Tạo endpoint webhook nhận payload SePay, xác thực API key, map sang `Wallet` theo
`accountNumber`, tạo `Transaction` idempotent (chống trùng khi SePay retry), và UI để user
cấu hình API key + xem trạng thái kết nối.
</task>

<requirement>

## Model: thêm vào Wallet

```
sepayWebhookSecret?: string   // API key user tự đặt trên SePay dashboard, dùng để verify request
```

Lưu **hashed** (không lưu plaintext) — dùng chung cơ chế hash hiện có cho token nếu có, hoặc
`bcrypt`. So sánh bằng hàm compare, không so sánh chuỗi thô.

## API

| Method  | Endpoint                            | Mô tả                                                               |
| ------- | ----------------------------------- | ------------------------------------------------------------------- |
| `POST`  | `/api/v1/webhooks/sepay`            | Endpoint public (không qua JWT auth middleware), nhận payload SePay |
| `PATCH` | `/api/v1/finance/wallets/:id/sepay` | Set/rotate `sepayWebhookSecret` cho wallet                          |

### POST /api/v1/webhooks/sepay

1. Đọc header `Authorization: Apikey <key>`. Thiếu/sai format → `401`.
2. Tìm `Wallet` theo `bankAccountNumber === payload.accountNumber` (global lookup, không theo
   userId — request đến từ SePay không có JWT). Không tìm thấy → `200 { success: true }` (SePay
   yêu cầu 200 dù bỏ qua, tránh retry vô ích) nhưng không tạo transaction.
3. So khớp `key` với `wallet.sepayWebhookSecret` (hashed compare). Sai → `401`.
4. **Idempotency**: `Transaction.findOne({ sepayTransactionId: String(payload.id) })` — nếu đã
   tồn tại → trả `200 { success: true }` ngay, không tạo lại (SePay có thể gửi lại khi timeout).
5. Map payload → Transaction:
   - `type`: `payload.transferType === 'in' ? 'income' : 'expense'`
   - `amount`: `payload.transferAmount`
   - `note`: `payload.content || payload.description`
   - `date`: parse `payload.transactionDate` ("YYYY-MM-DD HH:MM:SS")
   - `source`: `'sepay'`
   - `sepayTransactionId`: `String(payload.id)`
   - `categoryId`: category mặc định "Khác" (income/expense tương ứng) — user tự phân loại lại sau
6. Tạo Transaction + cộng/trừ `Wallet.balance`.
7. Response: **phải trả trong 30 giây**, HTTP `200`/`201`, body `{ "success": true }` (yêu cầu bắt buộc từ SePay).
8. Lỗi xử lý nội bộ (DB down, v.v.) → vẫn cố trả `200` nếu có thể để tránh SePay disable webhook
   sau nhiều lần fail liên tiếp; log lỗi riêng để investigate.

## UI — Kết nối SePay (trong Wallet edit/detail)

- Field wallet `type='bank'` mới có mục "SePay Integration".
- Hiện webhook URL để user copy dán vào SePay dashboard:
  `{NEXT_PUBLIC_APP_URL}/api/v1/webhooks/sepay`
- Nút "Generate API Key" → gọi `PATCH .../sepay`, hiện key **một lần duy nhất** (giống pattern
  hiện access token), nhắc user lưu lại trước khi đóng modal.
- Badge trạng thái: "Connected" nếu có ít nhất 1 transaction `source='sepay'` trong 30 ngày gần
  nhất cho wallet đó, ngược lại "Not synced yet".

## Bảo mật

- Route `/api/v1/webhooks/sepay` phải nằm ngoài JWT middleware ([src/proxy.ts](../../../src/proxy.ts))
  nhưng validate bằng Apikey header — không expose data của user khác (chỉ query đúng 1 wallet
  theo accountNumber + key match).
- Rate-limit endpoint này riêng (khác rate-limit cho user login) để tránh brute-force API key.

## Trạng thái hiện tại

✅ Đã implement: `sepayWebhookSecret` (bcrypt hash) trên Wallet, `POST /api/v1/webhooks/sepay`
(public, Apikey auth, idempotent qua `sepayTransactionId`, auto-tạo category "Khác", luôn ack
`{success:true}` kể cả khi lỗi nội bộ), in-memory rate limit riêng cho webhook,
`GET`/`PATCH /api/v1/finance/wallets/:id/sepay` (status + generate/rotate key), UI
`SepayConnectModal` (webhook URL copy, badge Connected/Not synced, reveal API key một lần) mở từ
nút 🔌 trên wallet card (`WalletStrip`).

</requirement>

<tone>
Concise, technical. Payload đã xác nhận từ docs.sepay.vn nhưng nên double-check lại trên
dashboard SePay thực tế của user (auth method có thể chọn HMAC-SHA256 thay vì Apikey) trước khi
code — spec này giả định user chọn phương thức Apikey vì đơn giản nhất.
</tone>
