# Conflict Detection & Capacity — trùng giờ và quá tải trong ngày

<role>Engineer giữ lớp kiểm tra lịch chạy trên Calendar Item</role>

<context>
Lên lịch nhiều nguồn (habit, block task/quest, event) dễ dẫn tới hai lịch chồng giờ, hoặc một ngày
xếp 12h trên 10h khả dụng. Lớp này là **hàm thuần** trên `CalendarItem[]` mà
[calendar-item](./calendar-item.md) sinh ra (`buildCalendar` trong
`src/server/services/schedule-engine.ts`), dùng chung cho SessionPlanner và
[schedule-notifications](./schedule-notifications.md). Gốc: [schedule-engine](./schedule-engine.md)
§12–13.
</context>

<task>
`detectConflicts` + `computeCapacity` (`src/server/services/schedule-insights.ts`) và endpoint
insights.
</task>

<requirement>

## Conflict — `detectConflicts(items, minBreakMinutes)`

Chỉ xét item có `startTime !== null` **và** `duration > 0`. Nhóm theo ngày, sort theo giờ bắt đầu:

| Loại   | Điều kiện                       | Ví dụ                            |
| ------ | ------------------------------- | -------------------------------- |
| `hard` | `[start, end)` giao nhau (> 0') | Gym 19:00–20:00 · Meeting 19:30  |
| `soft` | `0 ≤ gap < minBreakMinutes`     | A 10:00–12:00 · B 12:05 (gap 5') |

Với mỗi item `a`, quét các item sau: chồng → `hard`; gặp item đầu tiên bắt đầu sau `a` kết thúc thì
đo gap (có thể ra `soft`) rồi **dừng** — đã sort nên không item nào sau nữa chồng `a`.

Bị loại khỏi check: item all-day/không giờ, task không có block (item không giờ), quest chỉ có
deadline (`duration: 0`, kể cả khi có `dueTime`), habit không có `duration`.

```ts
interface ScheduleConflict {
  // src/types/calendar-insights.ts
  type: 'hard' | 'soft';
  date: string;
  a: { id; title; startTime; endTime };
  b: { id; title; startTime; endTime };
  gap?: number; // chỉ soft
}
```

## Capacity — `computeCapacity(items, dateKeys, availableMinutes)`

```txt
plannedMinutes = Σ duration MỌI item trong ngày (kể cả item không giờ)
loadPct        = round(planned / available × 100)
```

| loadPct | status       |
| ------- | ------------ |
| < 80    | `normal`     |
| 80–100  | `tight`      |
| > 100   | `overloaded` |

Trả một `DayCapacity {date, plannedMinutes, availableMinutes, loadPct, status}` cho **mọi** ngày trong
range, kể cả ngày trống.

## API

```txt
GET /api/v1/calendar/insights?from=YYYY-MM-DD&to=YYYY-MM-DD   (cả hai bắt buộc)
→ { conflicts: ScheduleConflict[], capacity: DayCapacity[] }
```

`src/app/api/v1/calendar/insights/route.ts` — đọc `UserSetting.schedule`:

| Setting                | Default | Giới hạn |
| ---------------------- | ------- | -------- |
| `dailyCapacityMinutes` | 600     | 60..1440 |
| `minBreakMinutes`      | 15      | 0..240   |

Xem [user-setting](./user-setting.md). Client: `useCalendarInsights(from, to, enabled)`.

## Hiển thị

- **SessionPlanner** — range = khoảng ngày của task ∪ ngày các block. Block dính hard conflict viền
  đỏ, soft viền vàng ("overlap" / "tight"); có ngày `overloaded` → banner liệt kê các ngày đó.
  Timeline của ngày đang chọn vẽ mọi block của ngày + preview phiên đang gõ.
- **Notifications** — overload + hard conflict của hôm nay.
- **Week View** không gọi endpoint này; nó tự tính đồng hồ tải riêng (xem
  [week-view-rescheduling](./week-view-rescheduling.md)) — chỉ block + event busy có giờ.

## Edge cases

- Event `busy: false` vẫn được tính vào capacity và conflict ở đây, khác với Week View và với ý
  của [event](./event.md) ("chỉ event busy trừ capacity").
- Task không block, có estimate, nằm trên `startDate` → cộng **toàn bộ** estimate vào ngày bắt đầu,
  dù task kéo dài nhiều ngày.
- Block của quest đã xoá bị xoá theo; block của task archive bằng `PATCH active:false` thì không,
  nhưng `buildCalendar` chỉ lấy task active nên chúng không vào capacity.

## Open questions

- Capacity/conflict có nên bỏ event `busy: false` cho khớp Week View và spec event?
- Day View / Month View có cần badge "⚠ Overloaded" (spec cũ) không? Hiện chưa view nào có.

</requirement>

<tone>Kỹ thuật, nêu đúng cái gì được đếm.</tone>
