# Character Progression — XP, level, rank, stat

<role>Fullstack engineer + game designer cho gamified personal dashboard</role>

<context>
Mỗi quest, habit, task hoàn thành đều trả thưởng cho nhân vật. Nhân vật là `UserProfile`
(`src/server/models/user-profile.model.ts`) — cùng document chứa hero identity sửa ở
`/profile` (xem `profile.md`).

Điểm cần biết trước khi đụng: **tính level-up chạy ở client**. `useCharacterProgress.ts` cộng
XP, xét lên cấp, rồi `PUT /api/v1/profile` với cả bộ `{ level, xp, xpNext, streak, coins, gems,
rank }`. Server nhận giá trị tuyệt đối, không tự tính.
</context>

<task>
Mô tả tiền tệ, bảng thưởng, công thức lên cấp, rank, stat và streak đúng như code đang chạy.
</task>

<requirement>

## Tiền tệ

| Field   | Mặc định | Kiếm từ                              | Tiêu ở                             |
| ------- | -------- | ------------------------------------ | ---------------------------------- |
| `xp`    | 0        | Quest, habit, task, project complete | Level up                           |
| `coins` | 0        | Như trên                             | Marketplace (xem `marketplace.md`) |
| `gems`  | 0        | Chỉ quest rank S: +5/quest           | Marketplace                        |

Penalty trừ `xp`/`coins` (kẹp ở 0) — xem `penalty.md`.

## Bảng thưởng

| Nguồn                   | XP                       | Coins                  | Định nghĩa ở                                 |
| ----------------------- | ------------------------ | ---------------------- | -------------------------------------------- |
| Quest S / A / B / C / D | 150 / 120 / 90 / 60 / 50 | 40 / 30 / 25 / 15 / 12 | `XP_MAP`, `COIN_MAP` (lưu vào quest lúc tạo) |
| Habit                   | 30                       | 10                     | `HABIT_XP`, `HABIT_COINS`                    |
| Task                    | 60                       | 15                     | `TASK_XP`, `TASK_COINS`                      |
| Project                 | do user đặt              | do user đặt            | Server `$inc` (xem `projects.md`)            |

Hằng số ở `src/features/dashboard/constants/index.ts`; người gọi là `useQuestOrchestration.ts`
và `useScheduleDayTasks.ts`. Goal hiển thị bounty theo rank nhưng **không cộng** vào profile
(xem `goals.md`).

## Lên cấp

```ts
leveled = xp + award >= xpNext;
xp = leveled ? xp + award - xpNext : xp + award; // dư XP chuyển sang cấp mới
level = leveled ? level + 1 : level;
xpNext = leveled ? Math.round(xpNext * 1.3) : xpNext; // mỗi cấp đắt hơn 30%
```

`xpNext` khởi điểm 1000 → 1300 → 1690 → … Mỗi lần thưởng **chỉ lên tối đa một cấp**, kể cả khi
award lớn hơn hai ngưỡng — XP dư vẫn giữ, cấp tiếp theo bật ở lần thưởng sau.

## Rank

Thứ tự `F < E < D < C < B < A < S`. Profile mới bắt đầu ở **E** (default schema), không phải F.

**Tự thăng hạng** khi lên cấp, theo `RANK_LEVEL_THRESHOLDS`:

| Rank            | E   | D   | C   | B   | A   | S   |
| --------------- | --- | --- | --- | --- | --- | --- |
| Level tối thiểu | 5   | 10  | 20  | 35  | 55  | 80  |

Chỉ thăng, không bao giờ tự giáng — rank hiện tại cao hơn ngưỡng level thì giữ nguyên. Giáng
rank chỉ đến từ penalty tier 3–4 (một bậc, không dưới F). Thăng hạng gọi `onLevelUp(level, rank)`
để `LevelUpToast` hiện hạng mới.

## Hero stats

5 chỉ số `discipline · wisdom · endurance · composition · serenity`, mỗi cái **1–10** (default
6/6/5/7/6). `statPool` (default 30, 10–50) là tổng điểm được phân ở `/profile`.

Hiển thị trên `CharacterPanel` dạng thanh %: `min(round(value / statPool * 100), 100)`.

Stat **không tăng theo gameplay** — chỉ đổi khi user phân lại ở `/profile`. Penalty fail trừ stat
trên state client, không ghi DB.

## Class & companion

Class (`HERO_CLASSES` trong `src/constants/hero-data.ts`) có `bias` một stat: Scribe/Sage →
wisdom · Ranger → endurance · Artificer → composition · Warden → serenity · Forgeborn →
discipline. Companion (Fox, Crane, Wolf, Owl, Phoenix) có chuỗi `bonus` như "+15% XP on creative
solutions".

**Cả hai hiện chỉ là flavour**: `bias` và `bonus` chỉ được render (HeroCard, RevealModal,
CharacterPanel, topbar), không đi vào phép tính thưởng nào.

## Streak

`UserProfile.streak`, hiện ở topbar. Penalty tier ≥2 reset về 0.

## Edge cases

- Hai tab cùng mở: mỗi tab giữ `char` riêng rồi PUT giá trị tuyệt đối → tab ghi sau đè tab kia.
- **Ghi phía server bị client đè.** `MainDashboard` chỉ nạp `char` từ profile **một lần**. Penalty
  fail (trừ XP/coins/streak/rank) và project complete (`$inc` XP/coins, không xét level-up) sửa DB,
  nhưng lần `awardProgress` kế tiếp PUT lại giá trị cũ của client — thay đổi server biến mất.
- `PUT /profile` nhận `xp`/`coins`/`gems`/`rank` từ client không kiểm tra — đây là single-user
  app, nhưng đừng copy mô hình này cho thứ gì có nhiều người chơi.

## Câu hỏi mở

- **Không có code nào tăng `streak`** — chỉ có reset. Streak hiển thị luôn là 0 hoặc giá trị nhập
  tay. Cần định nghĩa luật tăng (ngày có ≥1 hoàn thành?) và nơi chạy (server, theo timezone).
- Setting `streakProtection` (0–3) lưu được nhưng không ai đọc — áp vào đâu?
- Có muốn class bias / companion bonus thành cơ chế thật không?

</requirement>

<tone>Concise, technical. Gamified language nhưng số liệu phải khớp code.</tone>
