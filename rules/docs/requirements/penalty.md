# Penalty System

Penalty system là cơ chế accountability: nếu một ngày không hoàn thành các items, ngày hôm sau user phải hoàn thành một "Penalty Quest" trước khi có thể dùng app.

---

## Trigger Conditions

Penalty được tạo trong 2 trường hợp:

### 1. Tự động — Quest Rollover (ngày hôm sau)

Khi app load lần đầu trong ngày mới, `POST /api/v1/quests/rollover` được gọi:

- Nếu có quests `done: false, dueDate < today` → những quests này chưa hoàn thành hôm qua
- → Tự động tạo `PenaltyLog { tier: 1, status: 'pending', unfinished: [...quest titles] }`
- → Nếu đã có pending penalty, không tạo thêm

### 2. Thủ công — End Day Button

User click "End Day" khi còn items chưa xong:

- `POST /api/v1/penalty { items: unfinished[] }`
- Penalty được tạo và modal xuất hiện ngay lập tức
- User phải hoàn thành penalty quest trước khi tiếp tục dùng app

---

## Blocking Behavior

`PenaltyGate` component wrap toàn bộ protected pages trong `[locale]/(protected)/layout.tsx`:

```
Mọi trang protected (dashboard, tasks, profile, marketplace, ...)
  └─ PenaltyGate
       ├─ fetch GET /api/v1/penalty (on mount)
       ├─ Nếu null → render children bình thường
       └─ Nếu có pending penalty:
            └─ render children + PenaltyModal (z-index 2000)
                 → Modal chặn toàn bộ interaction
                 → Không có nút close / dismiss
                 → User PHẢI hoàn thành penalty quest
```

---

## Penalty Quest

Penalty quest được chọn ngẫu nhiên từ pool (seed = số items chưa xong + tier):

| Quest               | Mô tả                                              |
| ------------------- | -------------------------------------------------- |
| 30 PUSH-UPS         | Complete 30 push-ups in a single set. No breaks.   |
| 20 MIN SILENT FOCUS | Sit in silence. No phone. No music. Pure focus.    |
| COLD SHOWER         | Endure a 3-minute cold shower.                     |
| DECLUTTER WORKSPACE | Remove 10 items from your desk. Cleanse the chaos. |
| 1KM SOLO WALK       | Walk one kilometer alone. No headphones. Reflect.  |

---

## Escalation Tiers

Mỗi lần timer hết mà chưa xong → fail → escalate lên tier cao hơn, hình phạt nặng hơn:

| Tier | Label           | XP Mất | Coins Mất | Stats Mất | Streak? | Rank Demote? | Thời gian |
| ---- | --------------- | ------ | --------- | --------- | ------- | ------------ | --------- |
| 1    | Initial Warning | 100    | 20        | -2        | ✗       | ✗            | 60 phút   |
| 2    | Stat Decay      | 200    | 40        | -5        | ✓ Reset | ✗            | 30 phút   |
| 3    | Streak Severed  | 350    | 80        | -8        | ✓ Reset | ✓ Demote     | 15 phút   |
| 4    | Rank Demotion   | 500    | 120       | -12       | ✓ Reset | ✓ Demote     | 5 phút    |

**Max tier:** 4. Sau khi fail tier 4, hình phạt tier 4 được áp dụng, penalty ở lại tier 4.

---

## Penalty Flow Chi Tiết

```
Penalty pending (status: 'pending')
  │
  ▼
PenaltyModal hiện ra
  ├─ Hiển thị: bằng chứng (unfinished items), penalty quest, hình phạt, timer
  │
  ├─ User click "Accept Quest" → timer bắt đầu đếm ngược
  │
  ├─ User click "Mark Completed" (sau khi accept)
  │    └─ POST /api/v1/penalty/complete
  │         ├─ PenaltyLog.status = 'completed'
  │         └─ Modal biến mất → user có thể dùng app
  │
  └─ Timer về 0 (onFail)
       └─ POST /api/v1/penalty/fail
            ├─ Áp dụng hình phạt (xp, coins, streak, rank) vào UserProfile
            ├─ PenaltyLog.tier = tier + 1 (max 4)
            └─ PenaltyFailureModal hiện ra
                 └─ User click "Accept Consequences"
                      └─ PenaltyModal hiện lại với tier mới
```

---

## Server-side Consequence Application

Khi penalty fail, hậu quả được áp dụng server-side tại `POST /api/v1/penalty/fail`:

```typescript
// Áp dụng vào UserProfile
xp: Math.max(0, profile.xp - esc.xpLoss);
coins: Math.max(0, profile.coins - esc.coinLoss);
streak: esc.streakBreak ? 0 : profile.streak;
rank: esc.rankDemote ? RANKS[currentRankIdx - 1] : profile.rank;
// (stats loss được áp dụng client-side hiện tại)
```

Sau khi fail API call thành công:

- `queryKeys.profile.me()` được invalidate → CharacterPanel cập nhật ngay
- `queryKeys.penalty.active()` được invalidate → tier mới được fetch

---

## PenaltyLog Model

```typescript
{
  userId:        ObjectId        // chủ nhân của penalty
  tier:          number          // 1-4, tier hiện tại
  status:        'pending' | 'completed'
  triggeredDate: Date            // khi penalty được tạo
  unfinished: [{                 // snapshot các item chưa xong
    id:         string
    title:      string
    difficulty: string
  }]
}
```

**Constraint:** Chỉ 1 pending penalty per user tại một thời điểm. API `POST /api/v1/penalty` trả về existing penalty nếu đã có.

---

## Glitch UI Effect

PenaltyModal sử dụng visual design đặc biệt để tạo cảm giác "system alert":

- Glitch text animation (CSS keyframes)
- Warning stripes background
- Red pulsing glow
- Shake animation khi timer urgent (< 25%)
- Hard shake animation khi critical (< 10%)
- Blinking timer display khi urgent
- Timer bar đổi màu theo % thời gian còn lại

---

## API Reference

| Method | Endpoint                   | Mô tả                                            |
| ------ | -------------------------- | ------------------------------------------------ |
| `GET`  | `/api/v1/penalty`          | Lấy pending penalty (null nếu không có)          |
| `POST` | `/api/v1/penalty`          | Tạo penalty mới (với danh sách unfinished items) |
| `POST` | `/api/v1/penalty/complete` | Đánh dấu penalty hoàn thành                      |
| `POST` | `/api/v1/penalty/fail`     | Áp dụng hình phạt + tăng tier                    |
