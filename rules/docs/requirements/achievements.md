# Achievements — goal đã chinh phục là thành tựu

<role>Fullstack engineer + game designer cho gamified personal dashboard</role>

<context>
Bản spec cũ mô tả một hệ thống badge thật: model `UserAchievement`, `BADGE_CATALOG` 10 badge,
`evaluateAchievements()` chạy sau mỗi action, `GET /api/v1/achievements`, notification "Badge
Unlocked". **Không phần nào trong đó tồn tại trong code.** Không có route `achievements`, không
có model, không có engine.

Thứ đang chạy: "achievement" = **Goal** (xem `goals.md`). Goal `completed` là thành tựu đã đạt,
goal đang làm là thành tựu còn khoá. Có ba bề mặt đọc lại cùng dữ liệu đó.
</context>

<task>
Mô tả ba bề mặt achievement hiện có và ranh giới giữa phần thật với phần mock.
</task>

<requirement>

## 1. `AchievementsPanel` trên dashboard

File: `src/features/dashboard/components/character/AchievementsPanel.tsx`, nằm trong
`GoldPanel`, render trong `LeftColumn.tsx` của dashboard.

- Đọc `useGoals()` — không có endpoint riêng.
- Lưới **6 ô**: trước hết tối đa 6 goal `completed` (ô "earned"), phần còn lại lấp bằng goal
  `in-progress`/`not-started` (ô khoá). Chưa có goal nào → 6 ô 🔒 "—".
- Icon ô theo category: career ⚜ · health ❀ · learning ◈ · finance ◆ · personal ✦.
- Title cắt ở 12 ký tự (`…`) — ô nhỏ, tên goal dài sẽ vỡ lưới.
- Ô earned: viền + nền gradient gold, icon có glow; ô khoá mờ. Focus ring gold cho bàn phím.
- Header có link **VIEW ALL** → `/achievements`.
- Bấm ô → `AchievementDetailModal`.

## 2. `AchievementDetailModal`

File: `src/features/dashboard/components/character/AchievementDetailModal.tsx`. Chỉ đọc,
không có nút hành động — muốn sửa thì sang `/achievements`.

| Khối          | Nội dung                                                                    |
| ------------- | --------------------------------------------------------------------------- |
| Header        | `ProgressRing` (✓ khi xong, ngược lại %), badge category/status, desc       |
| Lưới meta     | Status · Rank (kèm `RANK_DESC`) · Priority · Target hoặc Completed · Reward |
| Milestones    | Thanh `done/total` + danh sách tick (không bấm được)                        |
| Strategy note | `goal.note` nếu có                                                          |
| Linked trophy | `goal.linkedTrophy` nếu có                                                  |

Màu dấu ✓ trong ring trùng màu ring (fix `faf1ff8`) — trước đó ✓ một màu, ring một màu.

## 3. Trang `/achievements`

`src/app/[locale]/(protected)/achievements/page.tsx` → `AchievementsPage.tsx`, tiêu đề
"Ambitions & Glory". Tab Goals / Overview / Bingo mô tả ở `goals.md`.

**Tab Trophies** (`TrophiesView.tsx`, `TrophyCard.tsx`) là **mock hoàn toàn**: dữ liệu từ
`MOCK_TROPHIES` trong `src/features/achievements/data/mock.ts`.

- Tier: `bronze | silver | gold | legendary`; đếm số trophy đã mở theo tier.
- Filter `all | unlocked | locked`; khối "recent" lấy tối đa 3 trophy có `recent`.
- Stat "Trophies" ở stat strip tab Goals cũng đếm từ mock này.

Liên kết duy nhất giữa goal và trophy là chuỗi `Goal.linkedTrophy` — chỉ để hiển thị tên trong
toast của Bingo, không mở khoá trophy nào.

## Badge ở Profile — thứ khác, đừng nhầm

`UserProfile.badges[]` (≤4 id) là badge **trưng bày** chọn ở mục Showcase của `/profile`, lấy
từ danh sách tĩnh `HERO_BADGES` (`src/constants/hero-data.ts`). Không có điều kiện earn: user
chọn được bất kỳ badge nào. Xem `profile.md`.

## Edge cases

- Hơn 6 goal completed → panel chỉ hiện 6 goal đầu theo thứ tự API (mới tạo trước), không
  phải 6 goal xong gần nhất.
- Goal `archived` không xuất hiện ở panel (không thuộc completed lẫn in-progress).

## Câu hỏi mở

- Có còn muốn badge/trophy thật (catalog + điều kiện + notification) như spec cũ? Nếu có, cần
  quyết định nó thay `MOCK_TROPHIES` và `HERO_BADGES` hay chạy song song.
- Panel có nên sắp goal completed theo `completedDate` thay vì `createdAt`?

</requirement>

<tone>Concise, technical. Gamified language phù hợp aesthetic của app.</tone>
