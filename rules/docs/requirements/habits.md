# Habits — hoạt động lặp theo tuần, có tạm ngưng

<role>Fullstack engineer duy trì nguồn lịch "thói quen" — lặp hàng tuần, trả XP mỗi lần làm</role>

<context>
Habit là việc user **làm để tiến bộ** theo lịch tuần cố định (chạy bộ T2-4-6 lúc 6:30). Mỗi ngày
habit đến lịch xuất hiện trên dashboard như một quest, tick xong được thưởng.

Trước `6f1284b` chỉ có "xoá" (soft delete `active:false`) — muốn nghỉ habit một thời gian là
mất nó khỏi danh sách. Giờ `active` là **tạm ngưng** có thể bật lại, còn xoá là **xoá thật**.
</context>

<task>
Model Habit + HabitLog, CRUD, tick done hằng ngày, và tab Habits trên dashboard.
</task>

<requirement>

## Dữ liệu

`Habit` — `src/server/models/habit.model.ts`

| Field      | Kiểu / ràng buộc                              | Ghi chú                                                    |
| ---------- | --------------------------------------------- | ---------------------------------------------------------- |
| `name`     | string ≤100, trim                             | Bắt buộc                                                   |
| `schedule` | `{ days: HabitDay[]≥1, time: HH:MM }[]` ≥1    | Nhiều slot, vd T2-4-6 06:30 + T7-CN 08:00                  |
| `duration` | phút 1..1440?                                 | Dùng cho `endTime` trên lịch                               |
| `note`     | string ≤500?                                  |                                                            |
| `tagId`    | Category id                                   | Bắt buộc                                                   |
| `color`    | `gold\|mint\|violet\|cyan\|rose\|amber\|blue` |                                                            |
| `icon`     | string                                        | Emoji, quest icon, hoặc URL ảnh upload (`IconPickerSheet`) |
| `active`   | bool, default true                            | **false = tạm ngưng**, không phải xoá                      |

`HabitLog` — `{ userId, habitId, date (local midnight), done, completedAt? }`, unique
`(userId, habitId, date)`: một log mỗi habit mỗi ngày.

## Habit tạm ngưng (`active: false`)

- `GET /habits` trả **cả active lẫn paused** — panel cần paused để làm mờ và cho bật lại.
- Mọi chỗ khác tự lọc `active: true`: Day/Week view (`useScheduleDayTasks`), `buildCalendar`,
  stats, search. Paused = biến khỏi lịch và thống kê
  nhưng **giữ lịch sử log**.
- Tạm ngưng cần **confirm** (modal ⏸); bật lại thì **tức thì** — hành động gỡ bỏ cần chặn,
  hành động khôi phục thì không.

## API

| Method   | Endpoint                                      | Ghi chú                                                               |
| -------- | --------------------------------------------- | --------------------------------------------------------------------- |
| `GET`    | `/api/v1/habits`                              | Mọi habit của user, sort `createdAt`                                  |
| `POST`   | `/api/v1/habits`                              | Validate schedule (≥1 entry, mỗi entry ≥1 ngày, `HH:MM`)              |
| `PATCH`  | `/api/v1/habits/:id`                          | Partial; `active` dùng để pause/resume; `duration`/`note` nhận `null` |
| `DELETE` | `/api/v1/habits/:id`                          | **Hard delete** + xoá toàn bộ HabitLog của habit                      |
| `GET`    | `/api/v1/habits/logs?date=` hoặc `?from=&to=` | Không tham số = hôm nay                                               |
| `POST`   | `/api/v1/habits/logs`                         | Upsert `{ habitId, date, done }`; `completedAt` khi done              |

Assistant (`src/server/agent/habit-tools.ts`) có list / create / update / `set_habit_active` /
delete — luôn chờ user confirm, và được dặn chỉ xoá khi user nói rõ "xoá"; muốn nghỉ thì pause.

## Tick done & thưởng

Đường tick duy nhất trên UI là **Day view** của Schedule (`useScheduleDayTasks.onToggleDone`):

1. Cập nhật local ngay (optimistic), rồi `POST /habits/logs`.
2. `done = true` → **30 XP + 10 coin** (`HABIT_XP` / `HABIT_COINS`) + XP toast.
3. Un-tick được; XP **không** bị thu hồi.

`useQuestOrchestration` vẫn dựng quest `habit-<id>` trong `allQuests`, nhưng từ khi bỏ tab
Quests, `MainDashboard` chỉ lấy `quests` (collection Quest) — `allQuests` và
`handleToggleQuest` không còn consumer nào.

Day view tick được ngày khác hôm nay (log theo ngày của item). Week view chỉ đọc trạng thái done
của **hôm nay**; click chip habit → chuyển sang tab Habits.

## Tab Habits — `HabitPanel.tsx` + `HabitCard.tsx`

- Header: `◈ Categories` (mở `CategoryModal`) · `+ New Habit` (mở `AddHabitModal`).
- Thanh lọc ngày: All + 7 thứ; thứ hôm nay có chấm. Lọc theo `schedule.days`.
- List: active trước, paused sau (mờ 40% + grayscale). Empty state khác nhau cho "chưa có habit"
  và "không có habit vào thứ này".
- Card: thanh màu trái, icon, tên, chấm trạng thái hôm nay (chỉ khi hôm nay có lịch) · nút
  ⏸/▶ · ✎ · ✕ · › mở rộng (lịch từng slot, category, duration, note, trạng thái Active/Inactive).
- Panel **không có** nút tick done — tick nằm ở Schedule.
- Xoá: modal cảnh báo "xoá vĩnh viễn, không hoàn tác".

**Form** (`AddHabitModal.tsx`): tên · icon · schedule nhiều slot · duration (hiện `1h 30m`) ·
category (tạo nhanh category ngay trong form) · màu · note. **Một thứ chỉ thuộc một slot**:
chọn thứ đã có ở slot khác sẽ chuyển nó sang; không thêm slot được khi 7 thứ đã chia hết; slot
cuối và ngày cuối của slot không bỏ được.

## Reschedule

Dời một lần xuất hiện sang giờ khác → Task có `habitRef`, xem [reschedule-habit](./reschedule-habit.md).

## Câu hỏi mở

- Ràng buộc "một thứ một slot" chỉ ở form; API/assistant vẫn nhận hai slot cùng thứ → lịch sinh
  hai item cùng `id` ([calendar-item](./calendar-item.md)).
- Chưa có streak/lịch sử hoàn thành riêng cho từng habit trên card.

</requirement>

<tone>Concise, technical. Pause là trạng thái, xoá là vĩnh viễn — đừng để hai thứ đó nhập làm một lần nữa.</tone>
