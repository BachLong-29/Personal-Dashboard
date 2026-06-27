# Goals

<role>Fullstack engineer + product designer cho gamified personal dashboard</role>

<context>
Quests và Habits xử lý mục tiêu hàng ngày. Goals là tầng cao hơn — mục tiêu lớn, dài hạn mà user muốn đạt trong tháng / quý / năm. Ví dụ: "Đọc 12 cuốn sách trong năm", "Chạy 100km trong tháng 7". Goals chưa tồn tại trong codebase.
</context>

<task>
Xây dựng Goals feature: model, API CRUD, UI panel trên dashboard để user tạo và theo dõi tiến độ goals. Goals có thể cập nhật progress thủ công hoặc liên kết với Habits.
</task>

<requirement>

## Model: Goal

```
Goal {
  userId: ObjectId
  title: string           // max 100 chars
  description?: string    // max 300 chars
  scope: 'monthly' | 'quarterly' | 'yearly' | 'custom'
  startDate: string       // YYYY-MM-DD
  endDate: string         // YYYY-MM-DD
  target: number          // giá trị đích (VD: 12 cuốn sách)
  unit: string            // đơn vị (VD: "books", "km", "quests")
  current: number         // tiến độ hiện tại (manual update)
  color: string           // màu hiển thị (reuse HabitColor)
  icon: string            // emoji
  active: boolean
  createdAt: Date
  updatedAt: Date
}
```

## API

- `GET /api/v1/goals` — danh sách goals đang active của user
- `POST /api/v1/goals` — tạo goal mới
- `PUT /api/v1/goals/[id]` — cập nhật title, description, target, icon, color
- `PATCH /api/v1/goals/[id]/progress` — cập nhật `current` (+= delta hoặc set value)
- `DELETE /api/v1/goals/[id]` — xóa goal (soft delete: active=false)

## UI: GoalsPanel

Vị trí: cột phải dashboard, thay thế hoặc nằm dưới GuildPanel.

```
┌──────────────────────────────┐
│ GOALS                 + New  │
├──────────────────────────────┤
│ 🎯 Read 12 Books      [====] │
│    7 / 12 books  · Yearly    │
│                              │
│ 🏃 Run 100km          [==  ] │
│    38 / 100 km  · July       │
│                              │
│ ✦ Complete 50 Habits  [====] │
│    50 / 50  · Monthly ✓      │
└──────────────────────────────┘
```

- Progress bar màu theo `color` của goal
- Completed goal (current >= target): hiển thị ✓ + border gold
- Expired goal (endDate < today + chưa đạt): opacity giảm
- Click vào goal → mở GoalDetailModal để edit / log progress

## GoalDetailModal

- Inline edit: title, target, unit, icon, color
- Progress log: input để nhập giá trị tăng (+delta) hoặc set giá trị tuyệt đối
- Date range hiển thị, không edit sau khi tạo
- Nút "Archive" (soft delete)

## Scope defaults

| scope     | startDate          | endDate    |
| --------- | ------------------ | ---------- |
| monthly   | đầu tháng hiện tại | cuối tháng |
| quarterly | đầu quý            | cuối quý   |
| yearly    | 01/01 năm hiện tại | 31/12      |
| custom    | user chọn          | user chọn  |

## Notification khi đạt goal

Khi `PATCH /progress` khiến `current >= target`:

- Tạo notification type `reward`: "🎯 Goal Achieved — [title]"

</requirement>

<tone>Concise, technical. Giữ đơn giản — Goals là feature nhẹ nhàng, không over-engineer.</tone>
