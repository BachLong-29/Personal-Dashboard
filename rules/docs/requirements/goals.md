# Goals — tham vọng dài hạn, chia mốc, bày lên bàn Bingo

<role>Fullstack engineer + product designer cho gamified personal dashboard</role>

<context>
Quest và Habit lo việc hằng ngày. Goal là tầng trên: mục tiêu lớn có hạn chót ("Ra mắt app",
"Chạy half-marathon"), tiến độ đo bằng **milestone** chứ không bằng con số nhập tay.

Goal sống ở trang `/achievements` ("Ambitions & Glory") — `AchievementsPage.tsx` với 4 tab
`goals | overview | trophies | bingo`. Không có panel Goals riêng trên dashboard; dashboard chỉ
có `AchievementsPanel` đọc lại goal (xem `achievements.md`).
</context>

<task>
Mô tả Goal như đang chạy: model, API, form tạo/sửa, danh sách lọc/sắp xếp, và Goal Bingo.
</task>

<requirement>

## Dữ liệu — `src/server/models/goal.model.ts`

| Field           | Kiểu                                                  | Ghi chú                                  |
| --------------- | ----------------------------------------------------- | ---------------------------------------- |
| `title`         | string ≤100, bắt buộc                                 |                                          |
| `cat`           | `career \| health \| learning \| finance \| personal` | Màu + glyph lấy từ `CATEGORIES`          |
| `rank`          | `S \| A \| B \| C \| D`                               | Quyết định thưởng                        |
| `priority`      | `high \| medium \| low`                               |                                          |
| `status`        | `not-started \| in-progress \| completed \| archived` | Mặc định `not-started`                   |
| `progress`      | 0..1                                                  | **Derived** từ milestone                 |
| `xp`, `coins`   | number                                                | Server set theo `rank`, client không gửi |
| `targetDate`    | string `YYYY-MM-DD`, bắt buộc                         |                                          |
| `desc`, `note`  | string ≤500                                           | `desc` hiển thị là "The Vision"          |
| `linkedTrophy`  | string?                                               | Tên trophy hiện trong toast khi xong     |
| `completedDate` | string kiểu `"Sep 9"`                                 | Set khi chuyển `completed`               |
| `milestones[]`  | `{ _id, label ≤200, done }`                           |                                          |
| `active`        | boolean                                               | `false` = đã xoá (soft delete)           |

Serializer thêm `targetLabel` ("Sep 30") và `daysLeft` (≥0) để client khỏi tự tính.

**Thưởng theo rank** (`RANK_REWARD` trong `api/v1/goals/route.ts`, tính lại khi đổi rank):
S 880 XP/240c · A 560/150 · B 420/110 · C 300/80 · D 180/50. Rank do user chọn chứ không suy từ
độ khó — vì vậy server giữ bảng giá, không nhận `xp`/`coins` từ body.

## API

| Method   | Endpoint                      | Hành vi                                                             |
| -------- | ----------------------------- | ------------------------------------------------------------------- |
| `GET`    | `/api/v1/goals?status=`       | Goal `active` của user, mới nhất trước                              |
| `POST`   | `/api/v1/goals`               | Tạo, status `not-started`, progress 0                               |
| `PUT`    | `/api/v1/goals/:id`           | Sửa field; `status='completed'` → progress 1 + `completedDate`      |
| `PATCH`  | `/api/v1/goals/:id/milestone` | Body `{ milestoneId }` — toggle một mốc, tính lại progress + status |
| `DELETE` | `/api/v1/goals/:id`           | Soft delete (`active=false`)                                        |

Luật toggle milestone: `progress = done/total`. Đủ 100% → `completed`; rớt dưới 100% khi đang
`completed` → về `in-progress`; `not-started` có mốc đầu tiên xong → `in-progress`. Mark complete
thủ công (PUT) thì **không** tick hộ các milestone — progress bị ép về 1.

## Form — `GoalModal.tsx`

Field: Ambition Title*, The Vision, category, rank, priority, Target Date* (dùng
`@/components/ui/DatePicker`, không dùng `<input type="date">` của trình duyệt), First Milestone.
Khung "Bounty on completion" xem trước XP/coins theo rank.

- **Validate trước khi gọi API**: thiếu title, title >100, vision >500, thiếu ngày → hiện lỗi
  dưới field, không gửi request. Server cũng validate, nhưng để server trả 400 thì user mất input.
- Tạo mới: First Milestone (nếu có) thành milestone đầu tiên. Sửa: form không đụng milestone.

## Tab Goals — `GoalsView.tsx` + `GoalCard.tsx`

- **Stat strip** 5 thẻ (Total, Active, Completed, Trophies, Completion) **ẩn dưới `sm`** — trên
  điện thoại nó đẩy danh sách goal xuống dưới màn hình đầu tiên.
- Lọc theo category và status (`all` ẩn goal `archived`). Sắp xếp: Priority (mặc định),
  Progress, Due Date, Status.
- **Menu sort render qua portal, `position: fixed`, kẹp trong viewport** (lề 8px). Menu
  `absolute right-0` cũ tràn ra ngoài màn hẹp. Đóng khi bấm ra ngoài; bám theo scroll/resize.
- Menu hành động của card cũng qua portal — vì card có `overflow-hidden` cắt menu.
- Hành động: Edit · Complete · Archive / Restore · Delete. Restore suy status từ progress
  (1 → completed, >0 → in-progress, 0 → not-started). Card mở rộng để tick milestone.

## Tab Overview / Trophies

Overview: status breakdown, completion & streak, theo category, timeline theo tháng đích,
deadline sắp tới — tính toàn bộ client-side từ danh sách goal. Trophies đọc `MOCK_TROPHIES`
(`data/mock.ts`) — **chưa có API trophy**.

## Goal Bingo — `BingoView.tsx`

Bàn 4×4. Lần đầu xếp 16 goal chưa archive đầu tiên; 10 đường thắng (4 hàng, 4 cột G-O-A-L, 2
chéo). Ô goal `completed` được đánh dấu; hoàn tất một đường → banner BINGO + pháo hoa canvas.

- **Bàn và note lưu ở `localStorage`** (`aetheria-bingo-board-v1`, `aetheria-bingo-notes-v1`),
  không lên server. ID goal đã mất bị thay bằng ô trống khi load. "Reset Board" xếp lại từ đầu.
- Bấm ô → **drawer docked mép phải** (440px, max 92vw), trượt vào bằng keyframe
  `bingo-drawer-in` (translateX 100% → 0) cùng easing với bottom sheet. Trước đây drawer dùng
  lại `bingo-deal` nên phóng to tại chỗ thay vì trượt. Esc đóng.
- Trong drawer: tick milestone (gọi API milestone), **Complete** goal (PUT status), và **note**:
  thêm, sửa inline, xoá. `⌘/Ctrl + Enter` lưu note; Enter thường xuống dòng.
- Dòng badge chừa `pr-9` để nút đóng absolute không đè badge priority.
- **Dưới 540px** HUD còn 4 ô gọn (ẩn Ambitions, XP Earned, Active; bỏ caption), nút reset chỉ
  còn icon — 7 ô full size đẩy bàn xuống ~400px trên điện thoại.
- Popup "+XP / coins" khi goal xong chỉ là hiệu ứng.

## Edge cases

- `daysLeft` kẹp về 0 khi quá hạn — UI không phân biệt "hôm nay" với "đã trễ".
- Board ở localStorage nên đổi máy là mất bố cục và note.

## Câu hỏi mở

- Complete goal **không cộng** `xp`/`coins` vào `UserProfile` (không route nào làm việc đó) dù
  UI hiện bounty. Cố ý hay thiếu?
- Note Bingo có nên lên server (gắn vào `Goal.note` hoặc collection riêng)?

</requirement>

<tone>Concise, technical. Goal là feature nhẹ — giữ đơn giản.</tone>
