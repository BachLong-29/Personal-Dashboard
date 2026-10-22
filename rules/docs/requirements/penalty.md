# Penalty — bỏ dở hôm qua thì hôm nay phải chuộc

<role>Fullstack engineer cho cơ chế accountability của gamified dashboard</role>

<context>
Quest/task bỏ dở không tốn gì thì gamification chỉ là trang trí. Penalty bắt user làm một
"Penalty Quest" ngoài đời (hít đất, chạy bộ…) trong thời hạn, trượt thì mất XP/coins/streak/rank
và hình phạt leo thang.

Trước đây penalty quest chỉ phát ra khi user tự bấm **End Day**. Commit `ee466ef` (2026-08-09)
**xoá nút End Day**: penalty giờ được phát **tự động** khi dashboard phát hiện quest hoặc task
quá hạn. Lý do: một cơ chế phạt mà người bị phạt phải tự bấm thì không ai bấm.
</context>

<task>
Mô tả nguồn phát penalty, vòng đời modal, bảng leo thang và API.
</task>

<requirement>

## Dữ liệu — `src/server/models/penalty-log.model.ts`

| Field           | Kiểu                        | Ghi chú                                          |
| --------------- | --------------------------- | ------------------------------------------------ |
| `tier`          | 1..4                        | Tier hiện tại, mặc định 1                        |
| `status`        | `pending \| completed`      |                                                  |
| `source`        | `quest \| task`             | Quyết định pool bài phạt client hiển thị         |
| `triggeredDate` | Date                        |                                                  |
| `unfinished[]`  | `{ id, title, difficulty }` | Snapshot "bằng chứng"; `difficulty` mặc định `C` |

Tối đa **một** penalty `pending` mỗi user: `POST` trả lại cái đang pending thay vì tạo mới.

## Hai nguồn phát tự động — `usePenaltyFlow.ts`

Cả hai chạy trong `MainDashboard` — **chỉ ở dashboard**, không có gate bọc mọi trang protected.

**Quest (`source: 'quest'`).** `useDailyInit` gọi `POST /api/v1/quests/rollover` mỗi ngày một
lần (khoá bằng localStorage `aetheria_quest_rollover_date`). Route dời mọi quest `done:false,
dueDate<today` sang hôm nay và **trả về danh sách đó**; có item → `issueQuestPenalty(items)`.

**Task (`source: 'task'`).** `useOverdueReview` trả các task quá hạn; có ≥1 → tạo penalty, mỗi
ngày tối đa một lần (`aetheria_task_penalty_date`). Khoá được ghi **trước** khi gọi API, nên lỗi
mạng nghĩa là bỏ qua hôm đó chứ không spam.

Cả hai tạo notification `reminder` "⚠ Penalty Quest Issued". **Modal review task quá hạn
(`OverdueReviewModal`) chỉ mở sau khi penalty nguồn task đã xử lý xong** — hai modal chồng
nhau thì user không biết phải trả lời cái nào trước.

## Pool bài phạt — `PenaltyModal.tsx`

Chọn theo seed `unfinished.length + tier * 7`, cố định suốt đời modal.

| `quest` (`PENALTY_POOL`)                                                              | `task` (`TASK_PENALTY_POOL`)                       |
| ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 30 Push-ups · 20 min Silent Focus · Cold Shower · Declutter Workspace · 1km Solo Walk | Chạy bộ 5km · 100 Push-up · 100 Crunch · 100 Squat |

Pool task viết tiếng Việt, pool quest tiếng Anh — xem câu hỏi mở.

## Vòng đời modal

1. Modal `z-[2000]`, **không có nút đóng**: hiện bằng chứng, bài phạt, hình phạt, đồng hồ.
2. "Accept Quest" → bắt đầu đếm ngược (trước đó là "Decision window", đồng hồ chưa chạy).
3. "Mark Completed" → `POST /penalty/complete`, toast +50 XP/+10 coins, notification `reward`.
4. Hết giờ → `POST /penalty/fail` → `PenaltyFailureModal` → "Accept Consequences" → modal
   quay lại với tier+1 (trễ 400ms để animation thoát chạy xong).

Hiệu ứng: glitch text, sọc cảnh báo, viền đỏ pulse, rung khi còn <25%, rung mạnh khi <10%.

## Leo thang

Thời gian: tier 1 = 60′ · 2 = 30′ · 3 = 15′ · 4 = 5′. Max tier 4; trượt ở tier 4 vẫn ở tier 4.

Hậu quả **server áp dụng** (`api/v1/penalty/fail/route.ts`, theo tier _đang_ trượt):

| Tier | XP mất | Coins mất | Reset streak | Hạ rank 1 bậc |
| ---- | ------ | --------- | ------------ | ------------- |
| 1    | 100    | 20        | ✗            | ✗             |
| 2    | 200    | 40        | ✓            | ✗             |
| 3    | 350    | 80        | ✓            | ✓             |
| 4    | 500    | 120       | ✓            | ✓             |

XP/coins kẹp ở 0; rank không xuống dưới F. **Stat loss (2/5/8/12) chỉ trừ trên state client**
(`ESCALATIONS` trong `features/dashboard/constants`) — không ghi DB, reload là mất.

## API

| Method | Endpoint                   | Mô tả                                                   |
| ------ | -------------------------- | ------------------------------------------------------- |
| `GET`  | `/api/v1/penalty`          | Penalty pending hoặc `null`                             |
| `POST` | `/api/v1/penalty`          | `{ items[≥1], source }` → tạo hoặc trả cái đang pending |
| `POST` | `/api/v1/penalty/complete` | Đánh dấu `completed`; 404 nếu không có                  |
| `POST` | `/api/v1/penalty/fail`     | Áp hậu quả + tier+1; invalidate `profile.me`            |

## Edge cases

- Reload giữa chừng: `penaltyState` chỉ là state React. Hook `usePenalty()` (GET) **có nhưng
  không ai gọi**, nên penalty pending không hiện lại; khoá localStorage chặn phát lại trong ngày.
  Hôm sau `POST` trả về penalty cũ — nhưng UI dựng lại tier 1.
- Retry sau fail lấy lại danh sách quest chưa xong / task quá hạn hiện tại, không dùng snapshot.
- Thưởng +50 XP/+10 coins khi hoàn thành chỉ là toast, không cộng vào profile.
- Hậu quả server ghi vào DB nhưng `char` trên dashboard không nạp lại; lần thưởng kế tiếp PUT
  XP/coins cũ của client đè mất phần bị trừ (xem `character.md` → Edge cases).

## Câu hỏi mở

- **Bảng hình phạt modal hiển thị lệch với server**: `PENALTY_ESCALATIONS` trong modal ghi tier 1
  = 200 XP/50 coins/5 stat … tier 4 = 2000 XP/500 coins, và chỉ tier 4 hạ rank. Bên nào đúng?
- Có cần rehydrate penalty pending từ `GET /penalty` khi load (và đặt gate ở layout protected)?
- Pool task có nên đưa qua i18n như phần còn lại của modal?

</requirement>

<tone>Nghiêm, ngắn. "The System is absolute" — nhưng spec phải nói thật chỗ nào còn hở.</tone>
