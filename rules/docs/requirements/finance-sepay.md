# Finance — SePay Webhook — giao dịch ngân hàng tự vào sổ

<role>Backend engineer tích hợp webhook SePay để ghi nhận giao dịch ngân hàng</role>

<context>
SePay gọi một URL webhook mỗi khi tài khoản ngân hàng liên kết có tiền vào/ra, xác thực bằng header
`Authorization: Apikey <API_KEY>`. Payload (theo docs.sepay.vn):

```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2024-07-02 11:08:33",
  "accountNumber": "1017588888",
  "content": "SEVN63DC8E5C chuyen tien",
  "transferType": "in",
  "description": "NGUYEN VAN A chuyen tien",
  "transferAmount": 5000000,
  "referenceCode": "FT24012345678"
}
```

`transferType`: `in` = income, `out` = expense. Đây là lý do cash reminder chỉ nhắc ví tiền mặt —
ví bank đã tự vào sổ ([cash-log-reminder.md](./cash-log-reminder.md)).
</context>

<task>
Endpoint public nhận webhook, map về đúng ví theo số tài khoản, tạo transaction idempotent, tự
phân loại theo keyword, và UI để sinh API key + xem trạng thái.
</task>

<requirement>

## Dữ liệu

`Wallet.sepayWebhookSecret` — **bcrypt hash** của API key (`hashSecret` / `compareSecret`,
`src/server/libs/hash.ts`), không bao giờ lưu plaintext. Transaction: `source: 'sepay'`,
`sepayTransactionId = String(payload.id)` (unique sparse), `overdraft` khi cần.

## API

| Method  | Endpoint                            | Ghi chú                                  |
| ------- | ----------------------------------- | ---------------------------------------- |
| `POST`  | `/api/v1/webhooks/sepay`            | Public, không JWT — xác thực bằng Apikey |
| `GET`   | `/api/v1/finance/wallets/:id/sepay` | `{ configured, connected, webhookUrl }`  |
| `PATCH` | `/api/v1/finance/wallets/:id/sepay` | Sinh/xoay key, trả plaintext **một lần** |

Hai route dưới chỉ nhận ví `type: 'bank'` của user. `PATCH` trả **400** nếu ví chưa có
`bankAccountNumber` — không có số tài khoản thì webhook không bao giờ map được về ví này. Key =
`randomBytes(24)` hex.

## `POST /api/v1/webhooks/sepay` (`src/app/api/v1/webhooks/sepay/route.ts`)

1. Rate limit **30 request/phút/IP** (in-memory, `rateLimit`) → 429. Riêng với rate limit login,
   để chống dò API key
2. Header không đúng dạng `Apikey <key>` → 401
3. Payload sai schema → **ack 200** (SePay ngừng retry một payload không bao giờ hợp lệ)
4. Tìm ví `bankAccountNumber = accountNumber`, `type: 'bank'`, `active` — tra **toàn cục**, vì
   request không mang user. Không có ví hoặc ví chưa có secret → **ack 200**, không tạo gì
5. `compareSecret(key, wallet.sepayWebhookSecret)` sai → 401
6. Đã có transaction với `sepayTransactionId` → ack (SePay retry khi timeout)
7. Phân loại: keyword dài nhất khớp trong `content + description` trên category cùng type; không
   khớp → **Chưa phân loại** (upsert) — luật đầy đủ ở [finance-categories.md](./finance-categories.md)
8. `overdraft = balance + delta < 0` — balance **vẫn** đi theo ngân hàng, cờ giữ transaction khỏi
   các phép tổng cho tới khi user chấp nhận ([finance.md](./finance.md))
9. Tạo transaction (`note = content || description`), `$inc` balance → **201** `{ success: true }`
10. Mọi lỗi nội bộ → log `[SePay webhook error]` và **vẫn ack 200** — SePay tắt webhook sau nhiều
    lần fail liên tiếp, mất cả những giao dịch sau đó còn tệ hơn mất một

`transactionDate` (`YYYY-MM-DD HH:MM:SS`, không timezone) được parse như **giờ local của server**.

## Webhook URL đưa cho SePay

SePay gọi từ server của họ, nên URL phải là origin public — `localhost` bị từ chối. Thứ tự
(`resolveWebhookUrl`, `wallets/[id]/sepay/route.ts`):

1. `SEPAY_WEBHOOK_BASE_URL` — đặt khi dev local để đọc ra origin đã deploy
2. Origin mà request **thực sự đến** (`x-forwarded-host` / `host` + proto) — trên Vercel là domain
   của chính deployment, không cần cấu hình gì
3. `NEXT_PUBLIC_APP_URL` — phương án cuối

**Cắt `/` ở cuối**: Vercel lưu app URL có `/`, và `//api/...` làm Next.js trả **308** thay vì chạy
route — một webhook sender không theo redirect sẽ không giao gì, mà không có lỗi nào để thấy.

## UI — `SepayConnectModal.tsx`

Mở từ nút 🔌 trên card ví bank ở Accounts ([finance-wallets.md](./finance-wallets.md)):

- Badge **Connected** khi ví có ít nhất một transaction `sepay` trong **30 ngày**, ngược lại
  **Not synced yet**
- Webhook URL + nút copy
- "Generate API Key" → hiện key **một lần** + nút copy; đóng modal là mất, chỉ còn cách sinh key mới
- Đã từng có card SePay trên Overview — đã bỏ (`77ddc6f`)

## Bảo mật

- Route nằm ngoài guard trang của `src/proxy.ts` và không đọc JWT; chỉ chạm đúng một ví khớp cả số
  tài khoản lẫn key
- 401 chỉ trả khi key sai cho một ví **có thật** → về lý thuyết lộ ra số tài khoản nào đã nối
  SePay; chấp nhận được vì rate limit và số tài khoản không phải bí mật

## Ngoài phạm vi

Backfill lịch sử trước khi nối (đặt số dư tay thay thế) · xác thực HMAC-SHA256 · nhiều ví cùng
một số tài khoản · phân loại lại row cũ khi đổi keyword.

</requirement>

<tone>Concise, technical. Payload đã đối chiếu docs.sepay.vn; kiểm lại trên dashboard SePay thật
trước khi đổi parser.</tone>
