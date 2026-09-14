# Event — Lịch cố định & phát sinh trong tuần

<role>Fullstack engineer thêm entity thứ 4 vào lớp lịch của dashboard</role>

<context>
Hệ thống có 3 nguồn lịch: **Habit** (lặp hàng tuần, có streak + XP), **Task** (việc phải xong,
có status/overdue/backlog), **Quest** (thử thách gamified theo difficulty). Cả ba đều là
**thành tựu** — có "hoàn thành", có thưởng, vào thống kê.

Thiếu hẳn một loại: việc **xảy đến với** user chứ không phải user làm để tiến bộ — họp tuần,
lớp học, khám bệnh, đám cưới, ca trực. Chúng chiếm thời gian thật nhưng không có "done",
không nên có streak, không nên bị tính là overdue.

Hệ quả cụ thể đang sai: `schedule.dailyCapacityMinutes` (UserSetting) chỉ trừ ScheduleBlock và
task có `startDate`. Ngày có 4 tiếng họp vẫn bị coi là trống, nên
[task-suggestion](./task-suggestion.md) chấm `fits` sai và [conflict-capacity](./conflict-capacity.md)
không bao giờ phát hiện quá tải thật.
</context>

<task>
Model `Event` + rule lặp, mở rộng [calendar-item](./calendar-item.md) thành 4 nguồn, cho event
`busy` trừ vào capacity ngày, và trang quản lý tại `/manage/events`.
</task>

<requirement>

## Vì sao không dùng entity sẵn có

| Cách làm             | Vì sao hỏng                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Habit không XP       | Habit sinh HabitLog + streak + XP cứng; rule chỉ weekly, không có `endDate`, không lặp cách tuần                        |
| Task + ScheduleBlock | Task có `status`/backlog/overdue — "cuộc họp quá hạn" là vô nghĩa; task **không có** cơ chế lặp, họp tuần = tạo 52 task |
| Quest                | Gamified theo difficulty rank, sai bản chất hơn cả task                                                                 |

## Model: Event

```
Event {
  userId: ObjectId
  title: string            // max 100
  note?: string            // max 500
  tagId: string            // Category, dùng chung với task/habit
  color: TaskColor         // gold|mint|violet|cyan|rose|amber|blue
  icon: string

  allDay: boolean          // default false
  startTime?: string       // "HH:MM" — required khi allDay=false
  duration?: number        // phút 1..1440 — required khi allDay=false

  startDate: Date          // one-off: ngày diễn ra · recurring: ngày bắt đầu rule
  endDate?: Date           // chỉ recurring — null = vô thời hạn

  recurrence?: {           // undefined = event phát sinh (one-off)
    freq: 'weekly' | 'monthly'
    days?: HabitDay[]      // required khi freq='weekly'
    dayOfMonth?: number    // 1..31, required khi freq='monthly'
    interval: number       // default 1 · 2 = cách tuần/cách tháng
  }
  skipDates: Date[]        // các occurrence đã bị huỷ, default []

  busy: boolean            // default true — trừ vào capacity ngày
  active: boolean          // soft delete
}
```

- Chỉ `weekly` + `monthly`, bám đúng [finance-recurring](./finance-recurring.md) — không
  `daily`/`yearly` (YAGNI).
- `dayOfMonth` > số ngày thật của tháng → rơi vào **ngày cuối tháng đó**.
- **Không có collection exception riêng.** Huỷ 1 buổi → push ngày vào `skipDates`.
  Dời 1 buổi → skip ngày cũ + tạo 1 event one-off. Đánh đổi: buổi bị dời mất liên kết với
  series — chấp nhận được với app cá nhân, đổi lại bớt hẳn 1 collection + 1 tầng API.

## Sinh occurrence — tính on-the-fly, KHÔNG cron

Giống Habit (expand rule mỗi ngày), **không** giống finance-recurring (phải materialize vì
transaction đụng `Wallet.balance`). Event chỉ để hiển thị và trừ capacity → không lưu occurrence,
không cần endpoint sync, không cần lazy-generate.

```
expandEvents(userId, from, to) → EventOccurrence[]
```

- one-off: `startDate` nằm trong range → 1 occurrence.
- recurring: duyệt từng ngày trong range, ngày khớp `days`/`dayOfMonth`, `>= startDate`,
  `<= endDate`, đúng `interval` (đếm số tuần/tháng từ `startDate`), không nằm trong `skipDates`.
- Chỉ lấy `active: true`.

## Tích hợp CalendarItem

- `CalendarSource` thêm `'event'` → `'habit' | 'quest' | 'task' | 'event'`.
- `buildCalendar` gọi thêm `expandEvents`, merge và sort cùng 3 nguồn cũ.
- `status` luôn `'planned'` — event không có done/missed. Giữ nguyên union `CalendarStatus`.
- `id`: `event:<eventId>:<date>`. `allDay` → `startTime: null`, `duration: 0`.

## Capacity — chỗ phải sửa

| File                                     | Sửa gì                                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/server/services/task-suggestion.ts` | `remainingMinutes` trừ thêm duration của event `busy` trong ngày (hiện chỉ trừ block + dated task) |
| `conflict-capacity` (chưa làm)           | Khi triển khai phải coi event là item chiếm giờ như block                                          |

Event `allDay` hoặc `busy: false` **không** trừ capacity.

## API

| Method   | Endpoint                   | Mô tả                                                                                |
| -------- | -------------------------- | ------------------------------------------------------------------------------------ |
| `GET`    | `/api/v1/events?from=&to=` | Không có range → list rule; có range → occurrence đã expand                          |
| `POST`   | `/api/v1/events`           | Tạo (validate `startTime`/`duration` theo `allDay`, `days`/`dayOfMonth` theo `freq`) |
| `PATCH`  | `/api/v1/events/:id`       | Sửa cả series                                                                        |
| `POST`   | `/api/v1/events/:id/skip`  | Body `{ date }` → push vào `skipDates` (huỷ 1 buổi)                                  |
| `DELETE` | `/api/v1/events/:id`       | Soft-delete `active: false`                                                          |

## UI

**`/manage/events`** — cạnh `/manage/rewards` sẵn có, không tạo IA mới.

- List rule: icon · title · badge lặp ("Thứ 2,4,6 · 09:00" / "Hàng tháng ngày 15" / "Một lần
  14/09") · category · `Switch` bật tắt `active`.
- Nút "+ New Event" mở `Modal`: title, note, category `Select`, color, icon, `Switch` all-day,
  `DatePicker` ngày bắt đầu, giờ + duration, `Switch` lặp → chọn freq/days/dayOfMonth/interval,
  `DatePicker` ngày kết thúc (optional), `Switch` busy.
- Xoá: confirm trước khi soft-delete.

**Week/Day view dashboard** — event hiện cùng task/habit/quest qua CalendarItem; style phân biệt
(viền đứt hoặc nền nhạt) để thấy ngay đây là việc không phải làm để "hoàn thành". Menu ngữ cảnh
trên 1 occurrence: "Huỷ buổi này" → gọi `/skip`.

**Bắt buộc:** chỉ Tailwind + design token sẵn có, component từ `src/components/ui`, có Loading
(`Skeleton`) / Empty (`NoData`) / Error state, responsive mobile-first.

## Ngoài phạm vi MVP

Không XP/coin/streak · không nhắc lịch (để [schedule-notifications](./schedule-notifications.md)
làm sau) · không người tham dự / địa điểm / sync Google Calendar · không freq `daily`/`yearly`.

## Trạng thái hiện tại

❌ Chưa có gì — model, expand service, API, UI, và phần sửa capacity đều mới.

</requirement>

<tone>Concise, technical. Tái sử dụng tối đa: Category/TaskColor/HabitDay đã có, expand theo pattern Habit, IA theo `/manage/*`. Không cron, không collection thừa.</tone>
