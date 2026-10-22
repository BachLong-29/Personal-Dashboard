# Calendar Item — lớp chuẩn hoá chung của 4 nguồn lịch

<role>Backend engineer giữ một DTO duy nhất mà mọi tính năng "đọc lịch" dùng chung</role>

<context>
[schedule-engine](./schedule-engine.md) mục 3 & 8: các consumer không nên tự đọc Habit / Task /
Quest / Event rồi tự gộp — mỗi chỗ một bản logic sẽ lệch nhau (habit bị reschedule đếm hai lần,
event bị quên trừ giờ). `buildCalendar` gộp 4 nguồn thành `CalendarItem[]` cho một khoảng ngày.

Lưu ý thực tế: Week view và Day view của dashboard **chưa** dùng lớp này — chúng vẫn ghép từ
hook riêng (`useWeekTasks`, `useScheduleDayTasks`, `useEventOccurrences`). Consumer thật là các
tính năng phía server và share (xem dưới).
</context>

<task>
Service `buildCalendar(userId, from, to)` trong `src/server/services/schedule-engine.ts` và route
`GET /api/v1/calendar`.
</task>

<requirement>

## Shape — `src/types/calendar.ts`

```ts
type CalendarSource = 'habit' | 'quest' | 'task' | 'event';
type CalendarStatus = 'planned' | 'done' | 'missed';

interface CalendarItem {
  id: string; // `block:<blockId>` hoặc `<source>:<sourceId>:<date>`
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string | null; // null = all-day / deadline-only
  endTime: string | null;
  duration: number; // phút, 0 cho all-day
  status: CalendarStatus;
  sourceType: CalendarSource;
  sourceId: string;
  icon: string; // emoji, key icon, hoặc URL ảnh upload
  color: string;
  meta?: { blockId?: string; deadline?: boolean; isOverride?: boolean; busy?: boolean };
}
```

DTO tính on-the-fly, **không** có collection `calendar_items` — tránh đồng bộ hai chiều; cache
được thêm sau nếu cần.

## Luật sinh item

| Nguồn     | Sinh từ                                                                                                                     | Status                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **habit** | Habit `active` × mỗi ngày × mỗi schedule entry khớp thứ; `endTime = time + duration`                                        | `done` nếu HabitLog done; ngày đã qua chưa log → `missed`                              |
| **task**  | (B1) mỗi `ScheduleBlock` task trong range; (B2) task **không có block** có `startDate` trong range → item `startTime: null` | B1: block `missed` → `missed`, còn lại theo done của block/task; B2 theo `task.status` |
| **quest** | (C1) mỗi block quest; (C2) quest không block → item tại `dueDate`, giờ = `dueTime` nếu có, `meta.deadline`                  | `quest.done`; quá hạn chưa xong → `missed`                                             |
| **event** | `expandEvents` ([event](./event.md)); `meta.isOverride`, `meta.busy`                                                        | Luôn `planned` — event không có done/missed                                            |

- **Habit bị reschedule:** task có `habitRef` + `startDate` cùng ngày → bỏ occurrence habit ngày
  đó, chỉ còn task ([reschedule-habit](./reschedule-habit.md)). Đây là chỗ duy nhất chống double count.
- Task chỉ lấy `active: true`; block của task/quest đã xoá bị bỏ qua (không có source).
- Task **không còn** giờ trong ngày — giờ chỉ nằm trên block. Vì vậy B2 luôn `startTime: null`.
- Habit paused (`active: false`) không sinh item, kể cả ngày quá khứ.
- Sort: `date`, rồi `startTime`; item `startTime: null` xuống cuối ngày.

## API

```
GET /api/v1/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD   → CalendarItem[]
GET /api/v1/calendar/insights?from=&to=              → CalendarInsights (dựng trên buildCalendar)
```

Cả hai bắt buộc auth, validate `from`/`to` bằng Zod. Không có tham số `view` (spec cũ có) —
khoảng ngày là đủ.

## Consumer hiện tại

| Consumer                                          | Dùng để                                                         |
| ------------------------------------------------- | --------------------------------------------------------------- |
| `share/agenda` route + `ShareAgendaModal`         | Text / ảnh lịch ngày-tuần ([share-agenda](./share-agenda.md))   |
| `calendar/insights` → `SessionPlanner`            | Tải & khoảng trống khi chia session                             |
| `stats` route                                     | Thống kê lịch ([schedule-statistics](./schedule-statistics.md)) |
| `server/agent/plan-tools.ts`                      | Assistant tìm khoảng bận / tải mỗi ngày                         |
| `useCalendarDay`, `features/schedule/useCalendar` | Hook client; mutation event invalidate `calendar`               |

## Edge cases

- Ngày dùng **local components** (`parseDate`/`toKey`) — khớp quy ước habit-log/stats, tránh lệch
  ngày ở múi giờ âm.
- `addMinutes` kẹp ở `23:59`: item kéo qua nửa đêm không tràn sang ngày sau.
- Quest C2 có `dueTime` thì `endTime = startTime` (không có duration).

## Câu hỏi mở

- Habit có hai schedule entry cùng một thứ sinh **hai item trùng `id`** (`habit:<id>:<date>`).
  Form habit chặn điều này nhưng API/assistant thì không. Có nên thêm giờ vào id?
- Có chuyển Week/Day view sang đọc `CalendarItem` như mục tiêu ban đầu không?

</requirement>

<tone>Concise, technical. Một nguồn sự thật cho "lịch có gì", tính lúc đọc.</tone>
