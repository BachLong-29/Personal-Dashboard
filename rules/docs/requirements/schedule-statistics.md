# Schedule Statistics — số liệu theo GIỜ từ Schedule Engine

<role>Engineer cung cấp khối `schedule` (phút planned/done/missed) cho Statistics</role>

<context>
`GET /api/v1/stats` ban đầu chỉ **đếm** task/habit và completion rate theo số lượng. Đếm không nói
được "tuần này đã ngồi làm bao lâu". Khối `schedule` tính theo phút từ cùng Calendar Item mà các view
dùng ([calendar-item](./calendar-item.md)), nên con số khớp với cái user thấy trên lịch. Gốc:
[schedule-engine](./schedule-engine.md) §14.
</context>

<task>
Khối `schedule` trong `src/app/api/v1/stats/route.ts`, hiển thị ở AnalyticsPanel.
</task>

<requirement>

## Range

**Cố định 7 ngày kết thúc hôm nay** (`localMidnight(-6)` → hôm nay). Endpoint **không** nhận
`?from=&to=`. `buildCalendar(userId, from, today)` dựng item cho cả range.

## Công thức (đơn vị phút, format giờ ở UI)

| Field              | Công thức                                              |
| ------------------ | ------------------------------------------------------ |
| `plannedMinutes`   | Σ `duration` mọi item (mọi status, mọi nguồn)          |
| `completedMinutes` | Σ `duration` item `status = 'done'`                    |
| `missedMinutes`    | Σ `duration` item `status = 'missed'`                  |
| `completionRate`   | `round(completed / planned × 100)`, 0 khi planned = 0  |
| `trend[]`          | 7 phần tử `{date: 'MM-DD', planned, completed}`        |
| `bySource`         | phút **completed** theo `habit · task · quest · event` |

Status lấy từ engine: `done` khi nguồn đã xong (HabitLog done, `task.status === 'done'` hoặc block
`done`, `quest.done`); `missed` khi ngày < hôm nay mà chưa xong; còn lại `planned`.

## Đóng góp theo nguồn

| Nguồn | Phút                                                                         |
| ----- | ---------------------------------------------------------------------------- |
| Habit | `habit.duration` mỗi occurrence; habit không có duration → 0                 |
| Task  | `block.duration` mỗi block; task không block → `task.duration` ở `startDate` |
| Quest | `block.duration` nếu có block; quest chỉ deadline → 0                        |
| Event | `occ.duration` (all-day = 0); luôn `planned`, không bao giờ done/missed      |

## Response

```jsonc
"schedule": {
  "range": { "from": "2026-10-16", "to": "2026-10-22" },
  "plannedMinutes": 1230, "completedMinutes": 980, "missedMinutes": 120,
  "completionRate": 80,
  "trend": [{ "date": "10-16", "planned": 180, "completed": 150 } /* …7 */],
  "bySource": { "habit": 300, "task": 680, "quest": 0, "event": 0 }
}
```

Giữ nguyên mọi field cũ (`tasks`, `habits`, `weekly`, `character`…) — mobile app đọc cùng response.
Type client: `DashboardStats.schedule` trong `src/features/dashboard/hooks/useStats.ts`.

## Hiển thị

`AnalyticsPanel.tsx` — thẻ **Focus Time** = `completedMinutes`, sub "of `plannedMinutes`". Thẻ
**Day Streak** lấy `character.streak` (UserProfile). `trend`, `missedMinutes`, `bySource` hiện
**chưa có UI** nào vẽ. `RangeControl` trên panel chỉ đổi state cục bộ, không gửi gì lên API.

## Edge cases

- Event không bao giờ `done` nên mọi phút event có giờ kéo `completionRate` xuống; event quá khứ
  cũng không thành `missed` → planned ≠ completed + missed.
- Task không block mà done: cả estimate được tính completed vào **ngày bắt đầu**, dù làm ngày nào.
- Habit `done` chỉ đọc theo `HabitLog` từng ngày; habit đã tắt (`active:false`) bị loại khỏi cả quá
  khứ.

## Open questions

- Có loại event khỏi `plannedMinutes` (hoặc chỉ giữ `busy`) để completion rate có nghĩa?
- Cần `?from=&to=` + biểu đồ Workload Trend (spec cũ) không, hay bỏ hẳn khỏi spec?

</requirement>

<tone>Kỹ thuật, nói rõ con số đến từ đâu.</tone>
