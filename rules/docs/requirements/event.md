# Event — lịch cố định & phát sinh trong tuần

<role>Fullstack engineer duy trì nguồn lịch thứ 4 của dashboard: việc xảy đến với user</role>

<context>
Habit / Task / Quest đều là **thành tựu** — có "xong", có XP, vào thống kê. Event là thứ còn
thiếu: họp tuần, lớp học, khám bệnh, ca trực. Chiếm giờ thật nhưng không có "done", không streak,
không bao giờ overdue.

Không dùng lại entity cũ được: Habit sinh HabitLog + streak + XP cứng và không có `endDate` /
lặp cách tuần; Task có `status`/backlog/overdue ("cuộc họp quá hạn" vô nghĩa) và không có cơ chế
lặp — họp tuần sẽ thành 52 task.

Hành vi "đang diễn ra" (marquee, LIVE, ngọn lửa) nằm ở [event-live](./event-live.md).
</context>

<task>
Model `Event` + rule lặp, expand on-the-fly thành occurrence, gộp vào
[calendar-item](./calendar-item.md), trừ capacity ngày, trang quản lý `/manage/events`.
</task>

<requirement>

## Model — `src/server/models/event.model.ts`

| Field                        | Kiểu / ràng buộc                         | Ghi chú                                                         |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `title`                      | string ≤100                              | Bắt buộc **chỉ** trên series/one-off (`required: isSeriesRow`)  |
| `note`                       | string ≤500                              |                                                                 |
| `tagId` · `color` · `icon`   | Category id · `TaskColor` · string       | Như title: override row kế thừa từ series. `icon` có thể là URL |
| `allDay`                     | bool, default false                      |                                                                 |
| `startTime` · `duration`     | `HH:MM` · phút 1..1440                   | Bắt buộc khi `allDay=false` (validate ở route)                  |
| `startDate`                  | Date                                     | One-off: ngày diễn ra · recurring: ngày rule bắt đầu            |
| `endDate`                    | Date?                                    | Chỉ recurring; POST bỏ qua nếu không có `recurrence`            |
| `recurrence`                 | `{ freq, days?, dayOfMonth?, interval }` | Vắng = one-off. `freq`: `weekly`\|`monthly`, `interval` 1..12   |
| `seriesRef` · `overrideDate` | ObjectId · Date                          | Có mặt = **override row** cho đúng 1 occurrence của series      |
| `cancelled`                  | bool                                     | Override: buổi đó bị bỏ                                         |
| `busy`                       | bool, default true                       | Trừ vào capacity ngày                                           |
| `paused`                     | bool, default false                      | Tắt tạm — ở lại list, không sinh occurrence                     |
| `active`                     | bool, default true                       | Soft delete                                                     |

**Vì sao `paused` tách khỏi `active`:** trước đây toggle trên list ghi `active:false`, mà list
chỉ đọc row active → bật tắt = xoá không cần confirm, không có đường quay lại. Giờ `active` chỉ
là soft delete, `paused` là công tắc.

**Override nằm chung collection**, theo pattern `habitRef` của [reschedule-habit](./reschedule-habit.md).
Override row chỉ mang ngày/giờ; mọi field hiển thị lấy từ series → đổi tên/màu series thì buổi
đã dời đổi theo. `weekly` cần `days` ≥1; `monthly` cần `dayOfMonth`, lớn hơn số ngày của tháng
→ rơi vào **ngày cuối tháng**.

## Expand — `src/server/services/event-expand.ts`

`expandEvents(userId, from, to)` — **không lưu occurrence, không cron**, giống Habit; khác
finance-recurring (phải materialize vì đụng `Wallet.balance`).

- Query: `active: true`, `paused ≠ true`, và một trong: series có `startDate < to+1`, row có
  `startDate` trong range (one-off + override dời tới), row có `overrideDate` trong range
  (override dời **ra ngoài** range vẫn phải chặn buổi gốc).
- Series thiếu (chỉ override khớp) → nạp thêm theo id. Lần nạp này **không** mang filter, nên
  vòng override kiểm lại `series.active && !series.paused`.
- Recurring: duyệt từng ngày, `>= startDate`, `<= endDate`, khớp rule. `interval` đếm tuần
  (neo thứ Hai) hoặc tháng từ `startDate`. Ngày có override → bỏ bản sinh, emit từ override
  (`cancelled` thì không emit).
- `EventOccurrence.id = event:<id>:<date>`; `allDay` → `startTime: null`, `duration: 0`.
  Kèm `isOverride`, `seriesId`, `recurring`, `busy`. Sort `(date, startTime)`.

## Capacity

`task-suggestion.ts` trừ `duration` của event `busy && !allDay` khỏi `remainingMinutes`.
Week view cũng cộng event đó vào đồng hồ giờ của cột (`WeekView.tsx`). All-day hoặc
`busy:false` hiện trên lịch nhưng không chiếm giờ.

## API — `src/app/api/v1/events/`

| Method   | Endpoint               | Hành vi                                                                                      |
| -------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| `GET`    | `/events`              | List series + one-off `active`, **loại override row**, sort `startDate`                      |
| `GET`    | `/events?from=&to=`    | Occurrence đã expand                                                                         |
| `POST`   | `/events`              | Tạo; `checkShape` ép time/duration theo `allDay`, days/dayOfMonth theo `freq`                |
| `PATCH`  | `/events/:id`          | Sửa cả series. `null` = `$unset`. `recurrence:null` gỡ luôn `endDate`; `allDay:true` gỡ time |
| `POST`   | `/events/:id/override` | `{ date, cancelled, newDate?, startTime?, duration? }` — upsert 1 row/occurrence             |
| `DELETE` | `/events/:id`          | `active:false` cho series **và mọi override** của nó                                         |

Override chỉ nhận series đang active **có** `recurrence` (one-off → 400). Logic upsert ở
`event-override.ts`, dùng chung với assistant (`src/server/agent/event-tools.ts`: list, create,
update, delete, cancel/move occurrence — luôn chờ user confirm).

Mọi mutation client invalidate `events`, `calendar` và `['tasks','suggestions']`
(`useEvents.ts`) — event ảnh hưởng cả lịch lẫn capacity.

## UI — `/manage/events` (`EventsPage.tsx`)

Lối vào: menu hero card (desktop), bottom sheet (mobile), global search, marquee.

- Card: icon cạnh title · `↻` nếu lặp (không badge chữ) · badge `Free` khi `!busy` · dòng meta
  "Weekly · Mon, Wed · 09:00" / "Every 2 weeks · …" / "Day 15" / ngày one-off · category.
- `Switch` **ON/OFF** điều khiển `paused`; row tắt mờ 55%. Nhãn chữ bắt buộc — switch trơn
  từng khiến user hỏi nó có xoá event không.
- Sửa / xoá là icon button; xoá qua `Modal` confirm, series lặp ghi rõ "kể cả các buổi đã dời".
- **Thứ tự 3 tầng:** (0) đang bật và còn hiệu lực · (1) bật nhưng đã qua (one-off qua ngày,
  series quá `endDate`) · (2) tắt/xoá. Trong tầng: event đang LIVE lên đầu, rồi series lặp,
  rồi `startDate`.
- Empty state có CTA riêng → nút header ẩn để không có hai nút giống nhau.
- Form (`EventFormModal.tsx`): icon trên cùng qua `IconPickerSheet` (emoji, quest icon, ảnh
  upload) · title · note · category · màu (hàng riêng) · ngày · all-day · giờ + duration ·
  lặp → freq / every N / days / dayOfMonth / ends on · busy.

**Week view** (`WeekView.tsx`): chip viền đứt, nền nhạt — "việc xảy ra", không phải việc để
xong. Không kéo thả. Click occurrence lặp → modal "bỏ buổi này" → `/override` `cancelled:true`.
Có công tắc 📅 Events riêng; tắt thì giờ event cũng rời đồng hồ cột. Day view **không** hiện event.

## Ngoài phạm vi

Không XP/coin/streak · không nhắc lịch · không người tham dự / địa điểm / Google Calendar ·
không freq `daily`/`yearly`.

## Câu hỏi mở

- Dời occurrence sang ngày/giờ khác mới có qua assistant (`move_occurrence`); UI chưa có.
- Chuỗi trên `EventsPage` / `EventFormModal` đang hard-code tiếng Anh, chưa qua next-intl.

</requirement>

<tone>Concise, technical. Tái dùng Category/TaskColor/HabitDay, expand theo pattern Habit, IA `/manage/*`.</tone>
