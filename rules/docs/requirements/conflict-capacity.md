# Conflict Detection & Capacity Planning

<role>Lớp kiểm tra lịch: phát hiện trùng giờ và quá tải trong ngày.</role>

<context>
Spec [schedule-engine](./schedule-engine.md) mục 12 & 13. Hiện codebase **không có** bất kỳ logic
conflict/overload nào (grep = 0). Cần một bộ kiểm tra chạy trên danh sách
[calendar-item](./calendar-item.md) của một ngày.
</context>

<task>
Viết các hàm thuần (pure) tính conflict & capacity từ `CalendarItem[]`, trả về cảnh báo cho UI và
[schedule-notifications](./schedule-notifications.md).
</task>

---

## 1. Conflict Detection (mục 12)

### Hard Conflict — hai lịch trùng giờ

```txt
Gym     19:00–20:00
Meeting 19:30–20:30   ⇒ HARD (overlap thực sự)
```

Quy tắc: hai item có `[start,end)` giao nhau (> 0 phút).

### Soft Conflict — khoảng nghỉ quá ngắn

```txt
Task A 10:00–12:00
Task B 12:05–14:00    ⇒ SOFT (gap 5' < ngưỡng)
```

Quy tắc: `0 ≤ gap < MIN_BREAK` (ngưỡng mặc định **15 phút**, cấu hình trong UserSetting sau).

### Output

```typescript
interface ScheduleConflict {
  type: 'hard' | 'soft';
  date: string;
  a: { id: string; title: string; startTime: string; endTime: string };
  b: { id: string; title: string; startTime: string; endTime: string };
  gap?: number; // phút, chỉ cho soft
}
```

- Item `startTime: null` (all-day / deadline-only) **bỏ qua** khỏi conflict check.
- Habit, Task block, Quest block đều tham gia check như nhau.

---

## 2. Capacity Planning (mục 13)

### Mục tiêu — phát hiện ngày quá tải

```txt
Khả dụng:  10h
Đã lên:    Habit 3h + Task 5h + Quest 4h = 12h  ⇒ OVERLOADED
```

### Logic

```txt
plannedMinutes = Σ duration mọi CalendarItem trong ngày (có giờ)
availableMinutes = UserSetting.dailyCapacity (default 600 = 10h)
load = plannedMinutes / availableMinutes
```

| load    | trạng thái |
| ------- | ---------- |
| ≤ 0.8   | normal     |
| 0.8–1.0 | tight      |
| > 1.0   | overloaded |

### Output

```typescript
interface DayCapacity {
  date: string;
  plannedMinutes: number;
  availableMinutes: number;
  loadPct: number;
  status: 'normal' | 'tight' | 'overloaded';
}
```

---

## API

Trả kèm trong calendar response hoặc endpoint riêng:

```txt
GET /api/v1/calendar/insights?from=&to=
→ { conflicts: ScheduleConflict[], capacity: DayCapacity[] }
```

---

## Cấu hình (UserSetting)

Thêm: `dailyCapacityMinutes` (default 600), `minBreakMinutes` (default 15).
Xem [user-setting](./user-setting.md).

---

## Hiển thị

- Day/Week View — badge "⚠ Overloaded" trên header ngày; viền đỏ giữa 2 item hard-conflict,
  viền vàng cho soft.
- Month View — ô ngày overloaded tô đậm (heat).

---

## Trạng thái hiện tại

❌ Chưa có conflict detection, ❌ chưa có capacity/overload, ❌ chưa có field capacity trong UserSetting.
