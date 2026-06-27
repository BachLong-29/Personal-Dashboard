# Achievements

<role>Fullstack engineer + game designer cho gamified personal dashboard</role>

<context>
AchievementsPanel hiện hiển thị 6 badge hardcode mock. Không có DB catalog, không có earn logic, không có API. UserProfile có field `badges[]` nhưng chỉ dùng cho "featured badges" ở profile page — không phải toàn bộ earned badges. Cần biến achievements thành hệ thống thực sự với catalog, evaluation engine, và notification khi earn.
</context>

<task>
Xây dựng hệ thống achievement hoàn chỉnh: catalog badge trong DB, engine kiểm tra điều kiện sau mỗi action, API trả earned status, notification khi unlock badge mới.
</task>

<requirement>

## Model: UserAchievement

```
UserAchievement {
  userId: ObjectId
  badgeId: string          // tham chiếu đến BADGE_CATALOG
  earnedAt: Date
}
```

Không lưu badge catalog trong DB — catalog là static constant trong code (dễ deploy, không cần migration).

## Badge Catalog (static)

| badgeId     | title          | icon | rarity   | Điều kiện                          |
| ----------- | -------------- | ---- | -------- | ---------------------------------- |
| first_quest | First Light    | ⭐   | common   | Hoàn thành quest đầu tiên          |
| streak_7    | Week Strider   | 🔥   | uncommon | Streak 7 ngày                      |
| streak_30   | Month Guardian | 🛡️   | rare     | Streak 30 ngày                     |
| quests_100  | Century        | 💯   | rare     | Hoàn thành 100 quests              |
| s_rank_1    | S-Rank         | 👑   | uncommon | Hoàn thành 1 S-rank quest          |
| s_rank_10   | Legend         | 🌟   | epic     | Hoàn thành 10 S-rank quests        |
| level_10    | Adept          | 🧙   | common   | Đạt level 10                       |
| level_25    | Champion       | ⚔️   | rare     | Đạt level 25                       |
| perfect_day | Perfect Day    | ✦    | uncommon | Hoàn thành tất cả quest trong ngày |
| habits_50   | Disciplined    | ⚡   | rare     | Log 50 habit completions           |

## API

- `GET /api/v1/achievements` — trả `{ catalog: Badge[], earned: string[] }` (earnedAt theo badgeId)
- `POST /api/v1/achievements/evaluate` — trigger evaluation, trả `{ newlyEarned: string[] }`

## Evaluation Engine

Gọi `evaluateAchievements(userId)` sau các action:

- Quest/habit complete → kiểm tra first*quest, quests_100, s_rank*\*, perfect_day, habits_50
- Level up → kiểm tra level_10, level_25
- Streak update → kiểm tra streak_7, streak_30

Engine chỉ tạo `UserAchievement` nếu chưa tồn tại (idempotent).

## UI: AchievementsPanel

- Giữ grid 3 cột hiện tại
- Thêm rarity border color (common=border, uncommon=gold, rare=violet, epic=rose)
- Thêm `earnedAt` date trong tooltip khi hover badge earned
- Thêm progress hint trong tooltip cho badge chưa earn (nếu có thể tính được)

## Notification khi earn

Khi `evaluateAchievements` trả `newlyEarned.length > 0`:

- Tạo notification type `reward`: "🏆 Badge Unlocked — [title]"
- Hiển thị trong NotificationBell

</requirement>

<tone>Concise, technical. Gamified language phù hợp với aesthetic của app.</tone>
