# Finance — Gold — một tài khoản vàng, định giá theo giá thị trường

<role>Fullstack engineer thêm tài sản vàng vào module Finance</role>

<context>
User Việt Nam thường giữ một phần tài sản bằng vàng và muốn nó hiện trong tổng tài sản mà không
phải gõ lại giá trị mỗi lần giá đổi: nhập **số lượng**, hệ thống tự lấy giá và quy ra VND.

Đơn vị trong nước: **chỉ** (3.75g) và **cây / lượng** (= 10 chỉ). Giá có hai mức — **mua vào**
(tiệm mua của khách) và **bán ra** (tiệm bán cho khách). Định giá tài sản đang giữ dùng **giá mua
vào**, vì đó là số tiền thật nhận được nếu bán hôm nay. Không trộn hai giá.

Thiết kế ban đầu là danh sách nhiều `GoldHolding` (tên, loại vàng, giá mua TB, lãi/lỗ) — **đã bỏ**
theo yêu cầu sau của user, thay bằng một tài khoản duy nhất. Xem "Không làm".
</context>

<task>
Cache giá vàng từ nguồn ngoài, một `GoldAccount`/user định giá theo VNGSJC, cộng giá trị vàng vào
tổng số dư ở Overview và Accounts.
</task>

<requirement>

## Dữ liệu

`GoldAccount` (`src/server/models/gold-account.model.ts`) — **một** bản ghi/user (`userId` unique):

| Field         | Kiểu                 | Ghi chú        |
| ------------- | -------------------- | -------------- |
| `quantityCay` | number ≥0, default 0 | Số cây (lượng) |
| `quantityChi` | number ≥0, default 0 | Số chỉ lẻ      |

Hai field **để riêng, không gộp sẵn** — người ta nói "2 cây 5 chỉ", và form trả lại đúng như họ
đã nhập. `totalChi = quantityCay × 10 + quantityChi` chỉ tính lúc serialize.

`GoldPriceSnapshot` (`gold-price-snapshot.model.ts`) — cache **dùng chung mọi user**, một bản ghi
cho mỗi `goldType` (unique): `goldType: 'sjc' | 'vngsjc'`, `name`, `buyPrice`, `sellPrice`
(**VND/chỉ**), `source`, `fetchedAt`.

## Nguồn giá — `src/server/services/finance-gold.ts`

`GET https://www.vang.today/api/prices` — miễn phí, không cần key, timeout 5s. Response thật:
`{ success, timestamp, prices: { [type_code]: { name, buy, sell } } }`, giá theo **VND/lượng** →
**chia 10** khi lưu. Map: `sjc ← SJL1L10`, `vngsjc ← VNGSJC`. Một request lấy cả hai loại.

`getGoldPrices()`:

1. Đủ snapshot cho mọi `goldType` và tất cả < **15 phút** → trả cache
2. Ngược lại fetch + upsert từng loại
3. Fetch lỗi → trả snapshot < **24h** với `stale: true`
4. Không còn gì dùng được → `{ prices: [], unavailable: true }`

Repo **không có cron**, nên mọi refetch đều lazy theo request; cache 15 phút để không đập vào API
miễn phí ở mỗi lần mở trang. Client (`useGoldPrice`) `staleTime` + `refetchInterval` 5 phút.

Hai loại có vai trò khác nhau: **`sjc`** (SJC 9999) là giá duy nhất **hiển thị** cho user;
**`vngsjc`** chỉ dùng để **định giá** `GoldAccount` — một loại giá duy nhất, không lấy trung bình.

## API

| Method  | Endpoint                       | Ghi chú                                     |
| ------- | ------------------------------ | ------------------------------------------- |
| `GET`   | `/api/v1/finance/gold/price`   | `{ prices: GoldPriceEntry[], unavailable }` |
| `GET`   | `/api/v1/finance/gold/account` | Get-or-create (0/0)                         |
| `PATCH` | `/api/v1/finance/gold/account` | `quantityCay?`, `quantityChi?` (≥0), upsert |

Response account:

```jsonc
{
  "quantityChi": 5,
  "quantityCay": 2,
  "totalChi": 25,
  "pricePerChi": 14800000, // vngsjc.buyPrice, null nếu không có giá
  "value": 370000000, // totalChi × pricePerChi, null nếu không có giá
  "priceStale": false,
  "priceUnavailable": false,
  "priceUpdatedAt": "…",
  "updatedAt": "…",
}
```

`GET` dùng `findOne` rồi mới `create`, **không** `findOneAndUpdate`: option `timestamps` bump
`updatedAt` ở mọi lần gọi dù không đổi gì, mà client đồng bộ lại ô nhập mỗi khi `updatedAt` đổi —
một GET không được phép chạm vào nó.

## Tích hợp tổng số dư — ở client, không ở server

Không có `goldValue`/`netWorth` trong `/finance/overview` như thiết kế cũ. Tổng được cộng ở client:

- `BalanceCard` (Overview): tổng = Σ wallet + `goldAccount.value`; chip 🪙 trong breakdown **chỉ
  hiện khi `totalChi > 0`** — tài khoản 0/0 không làm rối màn của người không dùng vàng
- `WalletsPage` (Accounts): tổng header cũng cộng giá trị vàng

`/finance/forecast` **không** tính vàng — chỉ ví.

## UI

- Giá SJC: **một dòng nhỏ** (10px, viền trên) cuối `BalanceCard` — tên, giá mua (mint), giá bán
  (rose), "cập nhật lúc HH:MM". Từng là cả một section `GoldPriceCard` — đã xoá vì chiếm trọn một
  hàng chỉ để hiện một dòng giá
- Card vàng đứng đầu `WalletList` (cây · chỉ · giá trị), tôn trọng nút ẩn số tiền
  ([finance-wallets.md](./finance-wallets.md)); bấm → `GoldAccountFormModal`: ô cây (`step 1`),
  ô chỉ (`step 0.1`), trống/không hợp lệ coi là 0

## Edge cases

| Case                       | Xử lý                                                     |
| -------------------------- | --------------------------------------------------------- |
| Không lấy được giá         | `value: null` → tổng số dư coi vàng là 0; dòng giá SJC ẩn |
| Chỉ có giá cũ (< 24h)      | Vẫn dùng, `priceStale: true`                              |
| Response thiếu `type_code` | Bỏ qua loại đó; thiếu cả hai → coi như fetch lỗi          |

## Không làm

Nhiều holding có tên · loại vàng khác (DOJI, PNJ, 24K — đã bỏ vì không chỗ nào dùng) · giá mua TB
và lãi/lỗ · sổ mua/bán vàng · nguồn dự phòng (VNAppMob, key hết hạn sau 15 ngày) · nhập giá tay.
Cần nhiều holding là việc mới, không phải sửa nhỏ trên `GoldAccount`.

</requirement>

<tone>Concise, technical. Không phải công cụ đầu tư vàng — chỉ quy tài sản ra VND. API miễn phí
bên thứ ba có thể đổi shape bất kỳ lúc nào: gọi thử request thật trước khi sửa parser.</tone>
