# Notification Center

<role>Product designer + fullstack engineer cho gamified personal dashboard</role>

<context>
Dashboard hiện có Toast system (tạm thời, tự dismiss) nhưng chưa có Notification Center lâu dài. Người dùng cần nhận nhắc nhở theo ngữ cảnh (ví dụ: nhắc lên kế hoạch vào Chủ nhật) và có thể xem lại các thông báo đã nhận. Notification center là prerequisite cho Sunday Planning Reminder.
</context>

<task>
Thêm Notification Center vào dashboard với bell icon trên Topbar, hiển thị danh sách thông báo, và API để tạo/đọc/xoá thông báo.
</task>

<requirement>

## Model: Notification

```
Notification {
  userId: ObjectId
  type: 'planning' | 'reminder' | 'system' | 'reward'
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  expiresAt?: Date
}
```

## API

- `GET /api/v1/notifications` — lấy danh sách (max 50, sắp xếp mới nhất trước, lọc chưa hết hạn)
- `PUT /api/v1/notifications/[id]/read` — đánh dấu đã đọc
- `PUT /api/v1/notifications/read-all` — đánh dấu tất cả đã đọc
- `DELETE /api/v1/notifications/[id]` — xoá một thông báo
- `POST /api/v1/notifications` — tạo thông báo mới (internal, dùng bởi các feature khác)

## UI: NotificationBell (Topbar)

- Bell icon (🔔) nằm trên DashboardTopbar, bên trái avatar
- Badge số đỏ hiển thị count unread (ẩn khi = 0)
- Click mở NotificationPanel (dropdown xuống, width ~360px)

## UI: NotificationPanel

- Header: "Notifications" + nút "Mark all read"
- Danh sách NotificationItem (scroll nếu > 5)
- Mỗi item: icon theo type | title + message | thời gian | nút dismiss (×)
- Empty state: "No notifications" khi rỗng
- Unread item có background highlight khác

## Behavior

- Fetch notifications khi mở panel (React Query, no polling)
- Đóng panel khi click ngoài (click-outside handler)
- Sau khi mark read / dismiss, invalidate query tự động
- Không dùng browser push notification — chỉ in-app

</requirement>

<tone>Concise, technical, aligned với gamified aesthetic của app</tone>
