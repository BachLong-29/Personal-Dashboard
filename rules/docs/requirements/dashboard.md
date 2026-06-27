# Dashboard

Route: `/dashboard`

Dashboard là trang trung tâm của app. Người dùng thấy toàn bộ game state và thực hiện hầu hết các action hàng ngày từ đây.

---

## Layout

### Desktop (≥ 1025px)

```
┌─────────────────────────────────────────────────────────────────┐
│                        DashboardTopbar                          │
├──────────────┬──────────────────────────────┬───────────────────┤
│              │  [Quests│Schedule│Stats│Habits│                   │
│   Character  │                              │   Focus Timer     │
│    Panel     │       Center Panel           │                   │
│              │                              │   Quote Card      │
│ Achievements │                              │                   │
│    Panel     │                              │   Guild Panel     │
└──────────────┴──────────────────────────────┴───────────────────┘
```

- **1025–1279px:** 2 cột (left + center, bỏ right column)
- **≥ 1280px:** 3 cột đầy đủ

### Mobile / Tablet (< 1025px)

Bottom navigation bar với 6 tabs: Quests, Habits, Schedule, Stats, Hero, Timer. Mỗi tab hiển thị một panel.

---

## DashboardTopbar

| Element                   | Chức năng                                              |
| ------------------------- | ------------------------------------------------------ |
| Hero avatar + name + rank | Click → dropdown identity panel                        |
| Gem pill                  | Hiển thị gem count                                     |
| Coin pill                 | Hiển thị coin count                                    |
| Streak badge              | Hiển thị streak count (ngày liên tiếp)                 |
| "End Day" button          | Kết thúc ngày → trigger penalty nếu còn item chưa xong |
| Language toggle           | Chuyển en / vi / th                                    |
| Logout                    | Đăng xuất                                              |
| Nav links                 | Marketplace, Quest Log, Profile                        |

---

## Center Panel — Tabs

### Tab: Quests

Hiển thị tất cả quests hôm nay bao gồm:

- **Quest items** (từ Quest collection, `dueDate = today`)
- **Habit quests** (từ Habit collection, scheduled for today)
- **Task quests** (từ Task collection, `startDate ≤ today ≤ endDate`)

Mỗi quest card hiển thị: icon, title, difficulty badge, XP/coin reward, done/undone toggle.

**Completion flow:**

1. Click toggle → ConfirmQuestModal (lần đầu, có thể skip)
2. Confirm → award XP + coins → burst particle animation + XPToast
3. Quest được đánh dấu done (không tự xoá, vẫn hiển thị để review)

**Add Quest:** FAB button mở AddQuestModal → chọn type, title, difficulty, dueDate.

### Tab: Habits

Hiển thị tất cả habits đang active, grouped theo ngày. Mỗi habit card:

- Toggle done cho hôm nay
- Hiển thị schedule (Mon, Wed, Fri...)
- Color-coded theo habit color
- Icon + name

### Tab: Schedule

Calendar view của tất cả quests + habits + tasks theo thời gian:

- **Day view:** Timeline giờ theo giờ
- **Week view:** 7 cột, mỗi ngày là một cột
- **Month view:** Calendar grid

Có thể navigate sang tab Quests/Habits từ đây.

### Tab: Stats (Analytics)

Charts hiển thị:

- **Weekly XP:** Bar chart XP kiếm được mỗi ngày (7 ngày gần nhất)
- **Focus Hours:** Tổng giờ focus timer mỗi ngày
- **Tasks Done:** Số task hoàn thành mỗi ngày
- **Habit Completion %:** Tỉ lệ habits completed mỗi ngày

---

## Left Panel

### CharacterPanel

Hiển thị:

- Hero name, title, class icon
- Level + XP progress bar (xp / xpNext)
- Rank badge (F→E→D→C→B→A→S)
- Stats radar: DIS (discipline), WIS (wisdom), END (endurance), COM (composition), SER (serenity)
- Coin + gem counts

### AchievementsPanel

Danh sách badges earned/unearned. Badges có rarity levels và era grouping.

---

## Right Panel

### Focus Timer

- Countdown timer theo phút (default 25 phút, cấu hình qua settings)
- Play / Pause / Reset controls
- Progress ring animation
- Khi hết giờ: notification

### Quote Card

Một motivational quote ngẫu nhiên từ pool `QUOTES` trong constants.  
Toggle ẩn/hiện qua settings (`showQuoteCard`).

### Guild Panel

Danh sách guild members với online status.  
Toggle ẩn/hiện qua settings (`showGuildPanel`).

---

## Quest Rollover

Khi app load lần đầu trong ngày (localStorage key `aetheria_quest_rollover_date` chưa được set cho ngày hôm nay):

1. Gọi `POST /api/v1/quests/rollover`
2. Server move tất cả quests `done: false, dueDate < today` → `dueDate = today`
3. Nếu có quests được rollover **và** chưa có pending penalty → tạo PenaltyLog mới
4. Store ngày vào localStorage để tránh rollover nhiều lần

---

## End Day Button

Khi user click "End Day":

- Lấy tất cả quests chưa done trong `allQuests` (quests + habits + tasks của hôm nay)
- Nếu `unfinished.length === 0` → không làm gì (hoặc show success toast tương lai)
- Nếu có unfinished → gọi `POST /api/v1/penalty` với danh sách items
- `PenaltyGate` detect penalty mới → show `PenaltyModal` immediately
