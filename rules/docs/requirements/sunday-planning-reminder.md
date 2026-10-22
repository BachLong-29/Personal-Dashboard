# Sunday Planning Reminder — nhắc lên kế hoạch tuần mới

<role>Fullstack engineer cho gamified personal dashboard</role>

<context>
Người dùng hay quên lên kế hoạch cho tuần mới. Chủ nhật, dashboard tự tạo một in-app notification
nhắc lập kế hoạch, bấm vào là tới thẳng Week View của tuần sau. Phụ thuộc
[notification-center](./notification-center.md).
</context>

<task>
Mở dashboard vào Chủ nhật → tạo đúng một notification `planning` cho ngày đó.
</task>

<requirement>

## Trigger — `src/features/dashboard/hooks/useDailyInit.ts`

Chạy một lần khi `MainDashboard` mount (cùng hook với quest rollover và monthly reminder):

1. `new Date().getDay() !== 0` → bỏ qua.
2. `today = new Date().toDateString()`. `localStorage[SUNDAY_REMINDER_KEY] === today` → bỏ qua.
   Key là `'aetheria_sunday_planning_reminded'` (`src/features/dashboard/constants/index.ts`).
3. `POST /api/v1/notifications` với body dưới; **chỉ khi thành công** mới ghi localStorage — request
   lỗi thì lần mở sau còn thử lại.

```json
{
  "type": "planning",
  "title": "Plan Your Week 📋",
  "message": "It's Sunday! Take a moment to plan your quests and goals for tomorrow.",
  "expiresAt": "<23:59:59.999 Chủ nhật đó>",
  "dedupeKey": "planning:sunday:<toDateString()>"
}
```

## Dedupe hai lớp

| Lớp    | Cơ chế                                                                        |
| ------ | ----------------------------------------------------------------------------- |
| Client | localStorage key ở trên — chặn request thừa                                   |
| Server | `POST /notifications` thấy `dedupeKey` đã tồn tại → trả row cũ, không tạo mới |

Lớp server cần vì localStorage bị xoá, nhiều tab/thiết bị, hoặc race khi hai lần mount gần nhau. Row
đã dismiss vẫn giữ `dedupeKey` (dismiss chỉ set `dismissedAt`) nên cũng không bị tạo lại.

## Bấm notification — `NotificationPanel.tsx`

`setPendingScheduleNav({ tab: 'week', weekStart: <thứ Hai kế tiếp>, year })` rồi
`router.push('/dashboard?tab=schedule')` — mở đúng tuần cần lập kế hoạch thay vì tuần hiện tại.

## Không cron, không push

Hoàn toàn client-triggered khi user mở dashboard, như quest rollover. Không mở dashboard Chủ nhật →
không có nhắc; chấp nhận được vì mục tiêu là nhắc lúc user đang ở trong app.

## Nhắc cùng họ — Monthly plan

Cùng hook: ngày **29** hằng tháng tạo notification `monthly-plan` ("Plan for <tháng sau> 🗓"),
`dedupeKey: monthly-plan:<year>-<monthIndex>`, guard `MONTHLY_REMINDER_KEY`. Bấm vào trỏ sub-tab
`month`, nhưng month đang được cất (xem [week-view-rescheduling](./week-view-rescheduling.md)) nên
thực tế rơi về `day`.

## Edge cases

- Ngày theo **giờ máy client**, không theo timezone đã lưu của user.
- Chuỗi tiếng Anh viết cứng trong hook, không qua i18n.

## Open questions

- Monthly reminder nên trỏ đâu khi month còn bị cất — Week View tuần đầu tháng sau?
- Tháng 2 không có ngày 29 ở năm thường → không nhắc; có cần "ngày áp cuối tháng" thay vì cố định 29?

</requirement>

<tone>Ngắn, thực dụng, không over-engineer.</tone>
