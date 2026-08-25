# Finance — Gold Asset Tracking

<role>Fullstack engineer thêm tính năng theo dõi tài sản vàng cho module Finance</role>

<context>
[finance.md](./finance.md) đã có `Wallet` (tiền mặt/ngân hàng/ví điện tử) và tổng số dư hiển
thị = tổng `balance` các wallet active. User Việt Nam thường giữ một phần tài sản bằng vàng
(SJC, nhẫn trơn PNJ/DOJI, vàng 24K...) — muốn nhập số lượng vàng đang giữ, hệ thống tự lấy giá
vàng thị trường theo thời gian thực để quy đổi ra VND và cộng vào tổng tài sản, không phải
nhập tay giá trị mỗi lần. Đây vẫn là module thuần chức năng — không gắn XP/coins/quest.

Đơn vị vàng trong nước tính theo **chỉ** (1 chỉ = 3.75g) hoặc **lượng** (1 lượng = 10 chỉ =
37.5g) — khác đơn vị troy ounce quốc tế (XAU). Giá vàng trong nước có 2 mức: **giá mua vào**
(tiệm mua của khách — dùng để định giá tài sản khách đang giữ nếu bán ra) và **giá bán ra**
(tiệm bán cho khách — dùng nếu khách muốn mua thêm). Không dùng lẫn 2 giá này.
</context>

<task>
Model `GoldHolding` (số lượng vàng user đang giữ) + `GoldPriceSnapshot` (cache giá vàng lấy từ
nguồn ngoài), API lấy giá + CRUD holding, cộng giá trị vàng vào tổng tài sản trên
`/api/v1/finance/overview` (đã có ở [[project_finance_overview_redesign]]), UI panel trong
Finance.
</task>

<requirement>

## Model: GoldHolding

```
GoldHolding {
  userId: ObjectId
  name: string              // max 50, required, VD "Vàng cưới", "SJC tích luỹ"
  goldType: 'sjc' | 'pnj' | 'doji' | '24k' | 'other'  // loại vàng, khớp key trong GoldPriceSnapshot
  quantityChi: number        // số lượng, quy đổi sẵn về đơn vị "chỉ", min 0.01
  avgBuyPrice?: number       // giá mua trung bình / chỉ lúc mua, optional — để tính lãi/lỗ
  icon: string                // emoji
  color: TaskColor            // reuse từ task.ts
  active: boolean             // default true, soft-delete
  createdAt / updatedAt
}
```

- UI cho nhập theo "chỉ" hoặc "lượng" rồi tự quy đổi (`× 10`) trước khi lưu `quantityChi` —
  không lưu 2 đơn vị song song.
- Xoá holding: soft-delete (`active: false`), giữ lịch sử.
- Không có transaction log riêng cho vàng (mua/bán) trong phạm vi này — chỉ là số dư hiện tại
  giống snapshot, không phải sổ cái. Nếu cần lịch sử giao dịch mua/bán vàng, ra doc riêng sau.

## Model: GoldPriceSnapshot (cache, không theo user)

```
GoldPriceSnapshot {
  goldType: 'sjc' | 'pnj' | 'doji' | '24k' | 'other'
  buyPrice: number     // VND / chỉ — giá tiệm mua vào (dùng định giá tài sản user)
  sellPrice: number    // VND / chỉ — giá tiệm bán ra
  source: string        // tên/URL nguồn dữ liệu, để audit khi giá bất thường
  fetchedAt: Date
}
```

- Server fetch từ nguồn ngoài, cache **15 phút** — không gọi API ngoài mỗi request để tránh
  rate-limit/bị chặn. Nếu fetch lỗi và còn snapshot cũ (< 24h) → dùng tạm snapshot cũ, gắn cờ
  `stale: true` trong response; nếu không còn snapshot nào → trả lỗi rõ ràng cho UI hiển thị
  "Không lấy được giá vàng, thử lại sau" (không chặn xem holdings, chỉ ẩn phần value).
- Index: `{ goldType: 1, fetchedAt: -1 }`.

## API

| Method   | Endpoint                            | Mô tả                                                           |
| -------- | ----------------------------------- | --------------------------------------------------------------- |
| `GET`    | `/api/v1/finance/gold/price`        | Giá vàng hiện tại tất cả `goldType` (cache-first, auto refetch) |
| `GET`    | `/api/v1/finance/gold/holdings`     | List holding active của user, kèm `currentValue`, `profitLoss`  |
| `POST`   | `/api/v1/finance/gold/holdings`     | Tạo holding                                                     |
| `PATCH`  | `/api/v1/finance/gold/holdings/:id` | Sửa (name, quantityChi, avgBuyPrice, icon, color)               |
| `DELETE` | `/api/v1/finance/gold/holdings/:id` | Soft-delete                                                     |

Response `GET .../holdings` mỗi item:

```jsonc
{
  "_id": "...",
  "name": "SJC tích luỹ",
  "goldType": "sjc",
  "quantityChi": 15,
  "avgBuyPrice": 6200000,
  "currentPrice": 6550000, // buyPrice hiện tại, từ GoldPriceSnapshot
  "currentValue": 98250000, // quantityChi * currentPrice
  "profitLoss": 5250000, // (currentPrice - avgBuyPrice) * quantityChi, null nếu không có avgBuyPrice
  "priceStale": false,
}
```

## Tích hợp vào Overview

`GET /api/v1/finance/overview` (đã có) thêm field:

```jsonc
{
  // ...field hiện tại...
  "goldValue": 98250000, // tổng currentValue mọi GoldHolding active
  "netWorth": 143250000, // tổng Wallet.balance + goldValue
}
```

Nếu giá vàng không lấy được (không có snapshot nào) → `goldValue: null`, `netWorth` chỉ tính
wallet, kèm cờ `goldPriceUnavailable: true` để FE hiển thị cảnh báo nhỏ thay vì number sai.

## Nguồn dữ liệu giá vàng

Đã khảo sát (2026-08-23) và chốt nguồn chính, theo cách [finance-sepay.md](./finance-sepay.md)
đã xác nhận payload thật với docs.sepay.vn trước khi code — response shape dưới đây lấy từ
trang docs thật, **vẫn nên double-check lại 1 lần bằng request thật** trước khi code vì API bên
thứ ba có thể đổi mà không báo trước.

### Nguồn chính: vang.today (khuyến nghị)

`GET https://www.vang.today/api/prices` — miễn phí, **không cần API key**, CORS enabled, dữ
liệu cập nhật mỗi ~5 phút. Không có rủi ro key hết hạn (khác VNAppMob bên dưới) nên phù hợp vì
repo này **không có cron server** — mọi refetch đều lazy-on-load qua cache 15 phút.

```jsonc
// response thật (rút gọn)
{
  "success": true,
  "current_time": 1732456789, // unix seconds
  "data": [
    { "type_code": "SJL1L10", "buy": 85500000, "sell": 88000000, "update_time": 1732456789 },
    // DOHNL/DOHCML (DOJI), PQHNVM/PQHN24NTT (PNJ), BT9999NTT (24K/Bảo Tín), ...
  ],
}
```

- Giá trả về là **VND/lượng (tael)**, không phải VND/chỉ → khi lưu vào `GoldPriceSnapshot`
  phải **chia 10** (`buyPrice = data.buy / 10`) để quy đổi về đơn vị "chỉ" thống nhất với
  `GoldHolding.quantityChi`.
- Map `type_code` → `goldType` nội bộ: `SJL1L10`/`SJ9999` → `'sjc'`, `DOHNL`/`DOHCML`/`DOJINHTV`
  → `'doji'`, `PQHNVM`/`PQHN24NTT` → `'pnj'`, `BT9999NTT` → `'24k'`. Bỏ qua `XAUUSD` (giá thế
  giới, không dùng — lệch giá SJC trong nước do chênh cung–cầu nội địa).
- `fetchedAt` = `new Date(current_time * 1000)`. `source: 'vang.today'`.
- Hỗ trợ query param `?type=<type_code>` để lọc 1 loại vàng (VD `?type=SJL1L10`) — nhưng
  `gold-price.service.ts` nên gọi **không kèm `type`** để lấy full `data` 1 lần, rồi tự lọc/lưu
  các `type_code` cần dùng vào từng `GoldPriceSnapshot.goldType` — tránh 4 request riêng lẻ mỗi
  lần cache-refetch.

### Nguồn dự phòng: VNAppMob Gold API v2

`GET https://api.vnappmob.com/api/v2/gold/{sjc|doji|pnj}`, header
`Authorization: Bearer <api_key>`. Tài liệu rõ ràng hơn nhưng **`api_key` tự hết hạn sau 15
ngày** (tự request tại `/api/request_api_key?scope=gold`) — cần thêm việc renew định kỳ, không
đáng đánh đổi khi nguồn chính (vang.today) không cần key. Chỉ dùng nếu vang.today ngừng hoạt
động; khi đó cần thêm 1 job renew key (piggyback vào lần cache-refetch khi phát hiện 403).

### Fallback chung: nhập giá thủ công

Nếu cả 2 nguồn trên đều lỗi và không còn snapshot nào < 24h: cho user tự nhập giá qua field
`manualPrice` optional (1 endpoint riêng, không phải flow tự động), UI ghi rõ đây là giá tự
nhập chứ không phải giá auto — theo mục "Trạng thái hiện tại" bên dưới.

## UI

- Panel "Gold Holdings" trong trang `/finance` (Accounts tab, cạnh `WalletStrip`) hoặc section
  riêng trong Overview — tuỳ vị trí đã có sẵn, ưu tiên đặt cạnh Wallet vì cùng là "tài sản".
- Mỗi holding: icon + tên + số lượng ("15 chỉ" / hiển thị quy đổi "1.5 lượng" nếu ≥ 10 chỉ) +
  giá trị hiện tại + lãi/lỗ (xanh lãi / đỏ lỗ, ẩn nếu không có `avgBuyPrice`).
- Giá vàng hiện tại: mini ticker hiển thị buy/sell theo `goldType`, có nhãn "Cập nhật lúc {giờ}"
  từ `fetchedAt`; nếu `priceStale` → badge cảnh báo màu amber.
- Nút "+ Thêm vàng" mở modal: chọn `goldType`, nhập số lượng (toggle chỉ/lượng), giá mua TB
  (optional).
- Responsive: list 1 cột mobile, card ngang scroll-x giống `WalletStrip` trên tablet/desktop.

## Reuse / Types

| File                                                   | Thay đổi                                                                                                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/server/models/gold-holding.model.ts` (mới)        | Model GoldHolding                                                                                                                              |
| `src/server/models/gold-price-snapshot.model.ts` (mới) | Model GoldPriceSnapshot                                                                                                                        |
| `src/server/services/gold-price.service.ts` (mới)      | Fetch + cache logic, gọi từ route giá                                                                                                          |
| `src/types/finance.ts`                                 | Thêm `GoldHolding`, `GoldPrice`, payloads                                                                                                      |
| `src/services/endpoints/finance.ts`                    | Thêm client cho `/finance/gold/*`                                                                                                              |
| `src/features/finance/components/GoldPanel.tsx` (mới)  | UI panel — **đổi tên nếu trùng** `GoldPanel` UI-kit hiện có ở `src/components/common/GoldPanel.tsx` (khung viền vàng, không liên quan tài sản) |
| `src/app/api/v1/finance/overview/route.ts`             | Thêm `goldValue`/`netWorth` vào response                                                                                                       |

## Trạng thái hiện tại

✅ Giá vàng đã implement — `GoldPriceSnapshot` model, `finance-gold.ts` service (cache 15 phút,
fallback stale), `GET /api/v1/finance/gold/price`. **Chỉ còn 2 `goldType`: `sjc` + `vngsjc`**
(đã bỏ `doji`/`pnj`/`24k` — không dùng ở đâu nữa, đơn giản hoá theo yêu cầu sau của user).
`sjc` (SJC 9999) là giá duy nhất hiển thị cho user; `vngsjc` fetch cùng lúc (chung 1 request,
không tốn thêm) nhưng chỉ dùng để định giá `GoldAccount`, không hiển thị.

**Không còn `GoldPriceCard.tsx`/section riêng ở Overview** — đã xoá, vì chiếm hẳn 1 hàng
section chỉ để hiện 1 dòng giá (feedback UX từ user). Giá SJC giờ là 1 dòng nhỏ (10px, viền
trên) ở cuối `BalanceCard.tsx` (card "Total balance"), lấy qua `useGoldPrice()` ngay trong đó —
không có component riêng cho việc này nữa.

⚠️ **`GoldHolding` (mục "Model: GoldHolding" ở trên) chưa implement theo đúng thiết kế này.**
Thay vào đó, theo yêu cầu sau của user, đã build một model đơn giản hơn hẳn — `GoldAccount`
(1 account duy nhất/user, không phải list nhiều holding): 2 field `quantityCay` + `quantityChi`
(mặc định 0, không gộp sẵn thành 1 số), định giá theo **1 loại giá duy nhất — VNGSJC**. Xem
`GET/PATCH /api/v1/finance/gold/account`, hiện là 1 card trong danh sách Accounts
(`WalletList.tsx`) + `GoldAccountFormModal.tsx` để sửa. Coi mục "Model: GoldHolding" +
"goldValue/netWorth trong Overview" ở trên là **chưa làm / có thể không còn đúng hướng** — nếu
cần nhiều holding có tên riêng như doc mô tả ban đầu, đó là việc mới, không phải sửa nhỏ trên
`GoldAccount`.

</requirement>

<tone>
Concise, technical. Không over-engineer — đây không phải công cụ đầu tư/trading vàng, chỉ theo
dõi giá trị tài sản đơn giản. Nguồn giá (vang.today) đã khảo sát và chốt, nhưng vẫn nên gọi thử
request thật 1 lần trước khi viết `gold-price.service.ts` — API bên thứ ba miễn phí có thể đổi
shape hoặc ngừng hoạt động bất kỳ lúc nào, đừng tin tuyệt đối response mẫu trong doc.
</tone>
