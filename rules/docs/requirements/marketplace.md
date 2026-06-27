# Marketplace & Rewards

Route: `/marketplace` (view), `/rewards` (manage)

Marketplace là nơi user dùng coins và gems kiếm được để "mua" phần thưởng cho bản thân — có thể là bất kỳ thứ gì (cà phê, game time, buổi nghỉ...).

---

## Reward Properties

```typescript
{
  name:        string         // tối đa 100 ký tự
  description: string?        // tối đa 500 ký tự
  icon:        string?        // emoji, tối đa 10 ký tự
  color:       RewardColor    // cùng palette với Habit/Task
  rarity:      RewardRarity   // ảnh hưởng visual display
  status:      RewardStatus   // tình trạng availability
  coinCost:    number?        // giá tính bằng coins
  gemCost:     number?        // giá tính bằng gems
  unlockCondition?: {
    minLevel?: number         // level tối thiểu
    minRank?:  string         // rank tối thiểu (F/E/D/C/B/A/S)
  }
  stock:       number?        // undefined = unlimited
  active:      boolean        // soft delete
}
```

---

## Rarity System

| Rarity    | Màu         | Ý nghĩa                   |
| --------- | ----------- | ------------------------- |
| Common    | Gray        | Phần thưởng thông thường  |
| Uncommon  | Green       | Hơi đặc biệt              |
| Rare      | Blue        | Khó kiếm / tốn nhiều coin |
| Epic      | Purple      | Phần thưởng xịn           |
| Legendary | Gold + Glow | Phần thưởng đặc biệt nhất |

Rarity ảnh hưởng visual styling của card (border, glow, badge).

---

## Status

| Status     | Ý nghĩa             |
| ---------- | ------------------- |
| `active`   | Có thể mua          |
| `inactive` | Ẩn khỏi marketplace |
| `limited`  | Limited-time offer  |
| `sold_out` | Hết stock           |

---

## Unlock Conditions

Reward có thể bị lock nếu user chưa đủ điều kiện:

```typescript
unlockCondition: {
  minLevel: 10,    // phải đạt level 10
  minRank: 'B',    // phải đạt rank B
}
```

User dưới điều kiện → thấy reward nhưng không thể mua (locked state).

---

## CRUD Operations

| Action        | API                          | Ai làm được                      |
| ------------- | ---------------------------- | -------------------------------- |
| Xem danh sách | `GET /api/v1/rewards`        | User (chỉ thấy rewards của mình) |
| Tạo reward    | `POST /api/v1/rewards`       | User                             |
| Cập nhật      | `PATCH /api/v1/rewards/:id`  | Owner                            |
| Xoá (soft)    | `DELETE /api/v1/rewards/:id` | Owner                            |

---

## Reward Management Page (`/rewards`)

Admin-like view để user quản lý rewards của mình:

- **RewardTable:** Danh sách dạng bảng với filter + search
- **RewardSidebar:** Filter theo rarity, status, cost range
- **RewardForgeModal:** Form tạo / chỉnh sửa reward
- **RewardInspector:** Detail view của một reward

### RewardForgeModal Fields

- Name (required)
- Description (optional)
- Icon (emoji picker)
- Color (palette selector)
- Rarity (dropdown)
- Status (dropdown)
- Coin cost (number input)
- Gem cost (number input)
- Unlock conditions (level, rank)
- Stock (number hoặc unlimited)

---

## Marketplace View (`/marketplace`)

Grid display của tất cả active rewards:

- Filter theo rarity
- Search theo tên
- Hiển thị cost (coins/gems)
- Locked indicator nếu chưa đủ điều kiện
- Mua button (deducts coins/gems from profile)

---

## Purchasing Flow

```
User click "Redeem" reward
  │
  ├─ Check: user.coins >= reward.coinCost?
  ├─ Check: user.gems >= reward.gemCost?
  ├─ Check: user.level >= unlockCondition.minLevel?
  ├─ Check: rank_index(user.rank) >= rank_index(minRank)?
  │
  ├─ Nếu đủ điều kiện:
  │    ├─ Trừ coins/gems từ UserProfile
  │    ├─ Giảm stock (nếu có)
  │    └─ Thông báo thành công
  │
  └─ Nếu không đủ:
       └─ Hiển thị message cần thêm coins/level/rank
```

---

## Colors

Cùng palette với Habit và Task:

`gold` | `mint` | `violet` | `cyan` | `rose` | `amber` | `blue`
