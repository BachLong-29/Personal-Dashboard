# Schedule Notifications Integration

<role>Engine tự sinh thông báo từ lịch (reminder, deadline, overload, conflict).</role>

<context>
[notification.model.ts](../../../src/server/models/notification.model.ts) đã có bảng + Notification
Center UI ([notification-center](./notification-center.md)), nhưng **không có cơ chế tự sinh** thông
báo từ lịch. Spec [schedule-engine](./schedule-engine.md) mục 15 yêu cầu 5 loại cảnh báo.
</context>

<task>
Thêm generator tạo Notification từ [calendar-item](./calendar-item.md) +
[conflict-capacity](./conflict-capacity.md) insights.
</task>

---

## 5 loại cảnh báo (mục 15)

| Loại             | Khi nào                           | Nguồn              |
| ---------------- | --------------------------------- | ------------------ |
| Habit Reminder   | trước giờ habit X phút            | CalendarItem habit |
| Quest Reminder   | trước giờ quest block             | CalendarItem quest |
| Deadline Warning | quest/task gần hoặc quá `dueDate` | dueDate            |
| Overload Warning | ngày `overloaded`                 | DayCapacity        |
| Conflict Warning | có hard conflict                  | ScheduleConflict   |

---

## Mở rộng NotificationType

```typescript
type NotificationType =
  | 'planning'
  | 'monthly-plan'
  | 'reminder'
  | 'system'
  | 'reward' // hiện có
  | 'deadline'
  | 'overload'
  | 'conflict'; // thêm
```

(Reminder habit/quest dùng chung type `reminder`, phân biệt bằng nội dung/meta.)

---

## Cơ chế sinh

MVP đơn giản, **không cần cron real-time** ban đầu:

1. **Lazy on-read** — khi client gọi `GET /api/v1/notifications`, engine kiểm tra lịch hôm nay +
   insights → upsert notification còn thiếu (idempotent theo key).
2. **Dedupe key** — `${type}:${sourceId}:${date}` để không tạo trùng.
3. Phase sau: chuyển sang scheduled job (Sunday-planning đã có tiền lệ
   [sunday-planning-reminder](./sunday-planning-reminder.md)).

---

## Ngưỡng (UserSetting)

| Setting             | Default              |
| ------------------- | -------------------- |
| habitReminderLead   | 15 phút trước        |
| questReminderLead   | 30 phút trước        |
| deadlineWarningDays | 1 ngày trước dueDate |

---

## Nội dung mẫu

```txt
[Habit Reminder]  ⏰ Gym lúc 19:00 (còn 15 phút)
[Deadline Warning] ⚠ "Làm báo cáo" đến hạn ngày mai
[Overload Warning] 🔥 Hôm nay đã lên 12h / 10h khả dụng
[Conflict Warning] ✕ Gym (19:00) trùng giờ Meeting (19:30)
```

---

## API

Không thêm endpoint — tái dùng `GET /api/v1/notifications` (generator chạy trong handler).
Mỗi notification có `expiresAt` để TTL tự dọn (index đã có sẵn).

---

## Trạng thái hiện tại

🟡 Một phần: model + Notification Center UI + Sunday-planning reminder. ❌ Chưa có: generator cho
habit/quest reminder, deadline/overload/conflict warning; các type mới; ngưỡng trong UserSetting.
