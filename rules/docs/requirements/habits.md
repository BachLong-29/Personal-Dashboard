# Habit System

Habits là các hoạt động lặp lại theo lịch hàng tuần. Mỗi ngày, habits scheduled cho ngày đó sẽ xuất hiện trong dashboard như "habit quests".

---

## Habit Properties

```typescript
{
  name:     string              // tên habit, tối đa 100 ký tự
  schedule: HabitScheduleEntry[] // lịch, ít nhất 1 entry
  duration: number?             // thời lượng (phút), 1-1440
  note:     string?             // ghi chú, tối đa 500 ký tự
  tagId:    string              // category
  color:    HabitColor          // màu hiển thị
  icon:     string              // emoji icon
  active:   boolean             // soft delete (false = ẩn)
}
```

### Schedule Entry

Mỗi `HabitScheduleEntry` định nghĩa một slot trong tuần:

```typescript
{
  days: HabitDay[]  // ['mon', 'tue', 'wed', ...] — ít nhất 1 ngày
  time: string      // "HH:MM" (24-hour format), e.g. "07:30"
}
```

Một habit có thể có **nhiều schedule entries**:

```
Habit "Morning Run":
  - Entry 1: days: ['mon','wed','fri'], time: '06:30'
  - Entry 2: days: ['sat','sun'],       time: '08:00'
```

### Colors

`gold` | `mint` | `violet` | `cyan` | `rose` | `amber` | `blue`

---

## Habit trong Dashboard

Mỗi ngày khi Dashboard load, habit quests được tính từ:

```typescript
habits
  .filter((h) => h.active && h.schedule.some((e) => e.days.includes(todayDayStr)))
  .map((h) => ({
    id: `habit-${h.id}`,
    title: h.name,
    type: 'habit',
    difficulty: 'C',
    xp: 30, // HABIT_XP constant
    coins: 10, // HABIT_COINS constant
    done: habitDoneMap[h.id] ?? false,
    // ...
  }));
```

Rewards cố định: **30 XP + 10 coins** khi hoàn thành.

---

## Habit Log

Mỗi lần user toggle habit:

```
User toggle habit (hôm nay)
  │
  ├─ setHabitDoneMap: update local state ngay lập tức
  ├─ toggleHabitLog({ habitId, date, done })
  │    └─ POST/PATCH /api/v1/habits/logs
  │         └─ Upsert HabitLog { userId, habitId, date, done }
  │
  └─ Nếu done = true:
       ├─ awardProgress(30 XP, 10 coins)
       ├─ burst animation
       └─ XP toast
```

**Toggle:** Habit có thể toggle on/off nhiều lần trong ngày. Nếu un-toggle, XP không bị thu hồi.

---

## CRUD Operations

| Action       | API                                       | Notes                            |
| ------------ | ----------------------------------------- | -------------------------------- |
| Danh sách    | `GET /api/v1/habits`                      | Chỉ habits của user hiện tại     |
| Tạo mới      | `POST /api/v1/habits`                     | Validate schedule + time format  |
| Cập nhật     | `PATCH /api/v1/habits/:id`                |                                  |
| Xoá (soft)   | `DELETE /api/v1/habits/:id`               | Set `active: false`              |
| Logs hôm nay | `GET /api/v1/habits/logs?date=YYYY-MM-DD` |                                  |
| Toggle log   | `POST /api/v1/habits/logs`                | Upsert `{ habitId, date, done }` |

---

## Habit vs Task (Reschedule)

Một habit có thể được "reschedule" thành Task cho một ngày cụ thể:

- Task có `habitRef: ObjectId` trỏ về habit gốc
- Task có `startTime` để đặt giờ cụ thể
- Ngày đó, task log thay thế habit log (không double count)

---

## HabitPanel (Tab)

Tab riêng trong dashboard, hiển thị:

- Tất cả active habits (không chỉ habits hôm nay)
- Mỗi habit card: icon, name, schedule summary, color bar
- Toggle done cho hôm nay
- Quick actions: edit, delete
- Compact view của streak/completion history (planned)
