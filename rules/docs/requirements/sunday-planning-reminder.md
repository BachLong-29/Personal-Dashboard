# Sunday Planning Reminder

<role>Product designer + fullstack engineer cho gamified personal dashboard</role>

<context>
Người dùng thường quên lên kế hoạch cho tuần mới. Vào Chủ nhật, dashboard cần tự động tạo một thông báo nhắc nhở người dùng lên kế hoạch cho ngày hôm sau (thứ Hai). Tính năng này phụ thuộc vào Notification Center (xem notification-center.md).
</context>

<task>
Khi người dùng mở dashboard vào ngày Chủ nhật, hệ thống tự động tạo một in-app notification nhắc lên kế hoạch cho ngày mai. Chỉ tạo một lần mỗi Chủ nhật (không tạo lại nếu đã tạo trong ngày).
</task>

<requirement>

## Trigger Logic

- Chạy trong `MainDashboard` (client-side) khi component mount, tương tự quest rollover hiện tại
- Kiểm tra: hôm nay có phải Chủ nhật không (`getDay() === 0`)
- Kiểm tra deduplicate bằng `localStorage`: key `SUNDAY_REMINDER_KEY = 'sunday_planning_reminded'`, value = ISO date string của ngày hôm nay
- Nếu key không tồn tại hoặc value khác ngày hôm nay → gọi `POST /api/v1/notifications` và cập nhật localStorage
- Nếu key trùng ngày hôm nay → skip (đã nhắc rồi)

## Notification Content

```json
{
  "type": "planning",
  "title": "Plan Your Week 📋",
  "message": "It's Sunday! Take a moment to plan your quests and goals for tomorrow.",
  "expiresAt": "<end of Sunday, 23:59:59>"
}
```

## API Change: Auto-create nội bộ

- Endpoint `POST /api/v1/notifications` chấp nhận body trên
- Middleware auth đã có — chỉ cần userId từ token
- Không tạo trùng: kiểm tra DB xem trong ngày Chủ nhật đó đã có notification type='planning' chưa (server-side guard)

## Deduplicate Strategy

- **Client**: localStorage guard chặn duplicate request
- **Server**: DB query guard phòng edge case (race condition, clear localStorage)

## No Cron / No Push

- Không dùng cron job hoặc browser push notification
- Hoàn toàn client-triggered khi user mở dashboard
- Phù hợp với pattern hiện tại (quest rollover cũng client-triggered)

</requirement>

<tone>Concise, technical, pragmatic — giữ đơn giản, không over-engineer</tone>
