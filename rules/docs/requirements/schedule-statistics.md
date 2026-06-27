# Schedule Statistics Integration

<role>Cung cấp số liệu theo GIỜ cho Statistics từ Schedule Engine.</role>

<context>
[stats/route.ts](../../../src/app/api/v1/stats/route.ts) hiện chỉ **đếm số lượng** task/habit và
completion rate. Spec [schedule-engine](./schedule-engine.md) mục 14 yêu cầu số liệu theo **giờ**:
Planned / Completed / Missed Hours, Completion Rate, Workload Trend. `WeekStats.tsx` hiện đang
hard-code ("Focus Hours 16.5h", "Streak 14d").
</context>

<task>
Tính các chỉ số theo giờ từ [calendar-item](./calendar-item.md) + [schedule-block](./schedule-block.md)
và trả về qua API stats.
</task>

---

## Chỉ số yêu cầu (mục 14)

| Chỉ số          | Công thức                                                |
| --------------- | -------------------------------------------------------- |
| Planned Hours   | Σ duration mọi CalendarItem (status planned+done+missed) |
| Completed Hours | Σ duration item status=done                              |
| Missed Hours    | Σ duration item status=missed                            |
| Completion Rate | Completed / Planned                                      |
| Workload Trend  | Planned Hours theo từng ngày trong range                 |

Tất cả tính theo **phút** ở backend, format ra giờ ở UI.

---

## API

Mở rộng `GET /api/v1/stats` (giữ field cũ, thêm khối mới):

```jsonc
{
  "schedule": {
    "range": { "from": "2026-06-13", "to": "2026-06-19" },
    "plannedMinutes": 1230,
    "completedMinutes": 980,
    "missedMinutes": 120,
    "completionRate": 80, // %
    "trend": [
      { "date": "06-13", "planned": 180, "completed": 150 },
      // ... 7 ngày
    ],
    "bySource": { "habit": 300, "task": 720, "quest": 210 }, // completed minutes
  },
}
```

Hỗ trợ query `?from=&to=` (default: 7 ngày gần nhất).

---

## Nguồn dữ liệu

- **Habit completed** — từ `HabitLog.done` × `habit.duration` (nếu habit không có duration → bỏ qua
  khỏi giờ, vẫn đếm count).
- **Task/Quest** — từ `ScheduleBlock.status` × `block.duration`.
- **Missed** — item ngày đã qua, chưa done.

---

## Thay WeekStats hard-code

[WeekStats.tsx](../../../src/features/tasks/components/week/WeekStats.tsx) hiện hard-code
"Focus Hours 16.5h", "Combo ×3", "Streak 14d" → thay bằng `schedule.completedMinutes` thật và
streak tính từ HabitLog.

---

## Hiển thị

- AnalyticsPanel / Statistics page — biểu đồ Workload Trend (planned vs completed theo ngày).
- Month View — workload tổng theo tuần (mục 11).

---

## Trạng thái hiện tại

🟡 Một phần: stats đếm count + completion rate theo số lượng. ❌ Chưa có: bất kỳ chỉ số theo GIỜ nào,
workload trend, bySource. WeekStats đang dùng số giả.
