# Marketplace & Reward Forge — tiêu coins cho phần thưởng tự đặt

<role>Fullstack engineer + game designer cho gamified personal dashboard</role>

<context>
Coins/gems kiếm từ quest, habit, task (xem `character.md`) cần chỗ tiêu: phần thưởng user tự
đặt cho mình — ly cà phê, một tối chơi game. Có hai trang:

| Route             | Component                                              | Dữ liệu                               |
| ----------------- | ------------------------------------------------------ | ------------------------------------- |
| `/marketplace`    | `src/features/marketplace/components/MarketPlace.tsx`  | **Mock** (`marketplace/data/mock.ts`) |
| `/manage/rewards` | `src/features/rewards/components/RewardManagement.tsx` | **Thật** — `Reward` qua API           |

Hai bên **chưa nối với nhau**: reward tạo ở Forge không hiện ở storefront, và đổi thưởng ở
storefront không trừ coin thật. Route cũ `/rewards` không còn.
</context>

<task>
Mô tả model Reward + API, trang quản lý Reward Forge, và storefront như đang chạy.
</task>

<requirement>

## Model `Reward` — `src/server/models/reward.model.ts`

| Field                 | Kiểu                                                      | Ghi chú               |
| --------------------- | --------------------------------------------------------- | --------------------- |
| `name`                | string ≤100, bắt buộc                                     |                       |
| `description`         | string ≤500                                               |                       |
| `icon`                | string ≤10                                                | Emoji                 |
| `color`               | `gold \| mint \| violet \| cyan \| rose \| amber \| blue` | Mặc định `gold`       |
| `rarity`              | `common \| uncommon \| rare \| epic \| legendary`         | Mặc định `common`     |
| `status`              | `active \| inactive \| limited \| sold_out`               | Mặc định `active`     |
| `coinCost`, `gemCost` | int ≥0, optional                                          |                       |
| `unlockCondition`     | `{ minLevel?: int≥1, minRank?: string }`                  |                       |
| `stock`               | int ≥0, optional                                          | Vắng = không giới hạn |
| `active`              | boolean                                                   | `false` = đã xoá      |

## API

| Method   | Endpoint              | Ghi chú                                                                                                                                                                                             |
| -------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/v1/rewards`     | `search` (regex name/description), `rarity`, `status`, `sortBy` (`name \| coinCost \| gemCost \| createdAt \| rarity`), `order`, `page`, `limit ≤100` → `{ items, total, page, limit, totalPages }` |
| `POST`   | `/api/v1/rewards`     | Tạo                                                                                                                                                                                                 |
| `PATCH`  | `/api/v1/rewards/:id` | Field nullable (`description, icon, coinCost, gemCost, unlockCondition, stock`) gửi `null` → `$unset`                                                                                               |
| `DELETE` | `/api/v1/rewards/:id` | Soft delete                                                                                                                                                                                         |

Không có `GET /:id` và **không có endpoint mua/đổi thưởng**. `null` → `$unset` (không set
`null`) để "không giới hạn stock" vẫn là _vắng field_, đúng nghĩa ở schema.

`scripts/seed-marketplace-rewards.js` đổ catalog mock vào `Reward` thật cho một user: `mythic`
→ `legendary`, `currency` → `coinCost`/`gemCost`, `reqLevel` → `minLevel`, có stock → `limited`.

## Reward Forge — `/manage/rewards`

- **Header chung**: `DashboardTopbar` + page header cùng mẫu với các trang khác (tiêu đề "Reward
  Forge", ô search, nút "Forge New Reward" — dưới `sm` chỉ còn icon).
- **KPI strip** (Active Rewards, Legendary Tier, Limited Edition, Total Coin Pool) — **ẩn trên
  mobile**.
- **Sidebar lọc** (`RewardSidebar`) theo rarity/status kèm số đếm. Từ `lg:` là cột tĩnh; dưới
  `lg:` là drawer off-canvas trái mở bằng nút Filters, có backdrop.
- List: toggle **Grid** (`RewardCard`) ↔ **Table** (`RewardTable`); sort Recent / Rarity / Coin
  Cost / Gem Cost / Name, asc/desc. Load một lần `limit: 100`.
- Nút hành động trên card **luôn hiện** — bản cũ chỉ hiện khi hover, không bấm được trên cảm ứng.
- **Inspector** (`RewardInspector`): chọn reward → copy vào `draft`; tab Edit ↔ Preview; Discard
  (chỉ bật khi dirty) và Publish (PATCH). Từ `lg:` là cột phải; dưới `lg:` là overlay toàn màn,
  chỉ mount khi đã chọn, có nút back.
- **Forge modal** (`RewardForgeModal`): tạo mới; xong tự chọn reward vừa tạo.
- Xoá qua modal xác nhận "Delete Reward". Toast ok/err 2.6s.

## Storefront — `/marketplace`

- Header chung như trên; stat LV / gems / coins đọc **profile thật** (`useProfile` →
  `profileToCharacter`). Nút "Manage Rewards" → `/manage/rewards` (dưới `sm` chỉ icon).
- Featured banner, **battle pass** (catalog mock; `claimed`/`current` suy từ level thật), tab
  category **All / Real-World / In-Game** (In-Game gộp `cosmetic | game | booster | quest`).
- Lưới card: 2 cột trên mobile, `auto-fill minmax(220px)` từ `sm`. Phân trang client 12/trang,
  đổi tab về trang 1. Rarity mock có thêm `mythic` (viền holo — phải là vòng viền, không tô đặc).
- Bấm card → `MarketRewardDetailModal` liệt kê điều kiện (level, giá, stock).

**Đổi thưởng (`handleRedeem`) chạy hoàn toàn trên state cục bộ**: chặn khi `locked`, thiếu
level, thiếu tiền, hết stock; đủ thì trừ tiền ở `player`, giảm stock, flash màu rarity, toast
"✦ X ACQUIRED ✦". Không gọi API — reload là khôi phục.

## Edge cases

- Check đủ tiền/level dùng `player` **mock** (level 24, 1248 coins), trong khi header hiện số thật
  — user có thể "mua" được thứ mà số dư thật không đủ, và ngược lại.
- `minRank` là chuỗi tự do (≤50), không validate theo `F…S`.

## Câu hỏi mở

- Nối storefront với `GET /api/v1/rewards` và thêm `POST /rewards/:id/redeem` (trừ coins/gems,
  giảm stock, kiểm `unlockCondition` server-side)? Khi đó category/`mythic`/`achievement` mock
  không có chỗ trong schema — bỏ hay thêm field?
- Battle pass có thành tính năng thật không?

</requirement>

<tone>Concise, technical. Gamified language phù hợp aesthetic của app.</tone>
