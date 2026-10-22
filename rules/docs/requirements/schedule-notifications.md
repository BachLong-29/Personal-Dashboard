# Schedule Notifications — thông báo tự sinh từ lịch

<role>Engine sinh reminder, deadline, overload, conflict cho Notification Center</role>

<context>
[notification-center](./notification-center.md) có bảng + panel nhưng không tự biết lịch. Engine
này đọc lịch hôm nay qua `buildCalendar` + [conflict-capacity](./conflict-capacity.md) rồi upsert
notification còn thiếu. Không có cron: chạy **lazy** khi client đọc danh sách notification. Gốc:
[schedule-engine](./schedule-engine.md) §15.
</context>

<task>
`generateScheduleNotifications(userId)` trong `src/server/services/schedule-notifications.ts`, gọi
từ `GET /api/v1/notifications`.
</task>

<requirement>

## Kích hoạt — không chặn request

1. `GET /notifications` gọi `generateScheduleNotifications` (try/catch riêng, lỗi chỉ log), rồi
   `generateCashLogNotifications` (try/catch riêng — xem [cash-log-reminder](./cash-log-reminder.md)).
2. **Throttle 5 phút, lưu DB** (`NotificationGenStateModel`, unique `userId`): claim slot bằng
   upsert `{lastGeneratedAt < now-5'}`; trùng key (11000) = request khác đang giữ slot → bỏ qua.
   Map in-memory không dùng được vì các invocation serverless không chung process.
3. Claim được → việc dựng lịch + upsert chạy trong `after()` của Next — **sau khi response đã
   gửi**. Trước đây list chờ dựng xong cả calendar mới trả, mỗi lần mark-read/dismiss lại invalidate
   vào đúng đường chậm đó.

Hệ quả: notification mới sinh hiện ở lần đọc **kế tiếp**, không phải lần đang gọi.

## Các loại

Cửa sổ: hôm nay → hôm nay + `deadlineWarningDays`.

| Type       | Khi nào                                                              | dedupeKey                              |
| ---------- | -------------------------------------------------------------------- | -------------------------------------- |
| `reminder` | item habit/quest/event hôm nay, `planned`, có giờ, chưa tới giờ      | `reminder:<itemId>`                    |
| `deadline` | item task (mọi loại) hoặc quest deadline-only chưa done trong cửa sổ | `deadline:<today>:<source>:<sourceId>` |
| `overload` | capacity hôm nay `overloaded`                                        | `overload:<today>`                     |
| `conflict` | mỗi **hard** conflict hôm nay                                        | `conflict:<today>:<aId>:<bId>`         |

Tất cả `expiresAt` = 23:59:59 hôm nay. Deadline có `entityId = sourceId`. Deadline key gắn ngày để
tạo lại mỗi ngày, thay vì sinh một lần rồi biến mất khi hết hạn ngày đầu.

`habitReminderLead` / `questReminderLead` chỉ được **in trong message** ("nhắc trước N phút"); chúng
không quyết định lúc nào reminder xuất hiện — reminder sinh ngay ở lần chạy đầu tiên trong ngày cho
mọi item chưa tới giờ.

## Ghi

`updateOne({userId, dedupeKey}, {$setOnInsert: …}, {upsert:true})` — idempotent, không bao giờ ghi
đè row đã có. Xong gọi `enforceNotificationCap` (cap 60/user, xoá row đã đọc cũ nhất trước, rồi tới
row chưa đọc cũ nhất).

## Dismiss phải bám

`DELETE /notifications/:id` **không xoá** mà set `dismissedAt`. Vì sao: generator upsert theo
`dedupeKey`, row đã xoá sẽ được tạo lại ở lần chạy sau vài phút. Row đã dismiss vẫn khớp filter
upsert nên `$setOnInsert` không làm gì. List và `unread-count` đều lọc `dismissedAt: {$exists:false}`.

Client (`useNotificationActions.ts`) cập nhật panel **optimistic** trước, có snapshot để rollback nếu
ghi lỗi — không chờ round-trip mới cho row biến mất.

## Bấm notification

`NotificationPanel.tsx`: `deadline` / `overload` / `conflict` → tab Schedule, sub-tab `day`, ngày hôm
nay. (`reminder` không có điều hướng riêng.)

## Nội dung

Chuỗi do generator viết **cứng tiếng Việt** (`⏰ <title>`, `⚠ Đến hạn: …`, `🔥 Ngày quá tải`,
`✕ Trùng lịch`), không qua i18n.

## Edge cases

- Cap sweeper xoá thật, nên row đã dismiss bị cap đẩy ra có thể sinh lại. 3/4 key gắn ngày nên chỉ
  sống trong ngày đó — giữ rủi ro hẹp. `reminder:<itemId>` thì itemId đã chứa ngày.
- Event `busy:false` vẫn góp vào overload/conflict (xem conflict-capacity).

## Open questions

- Reminder có nên chỉ sinh khi `now ≥ start − lead` như tên setting gợi ý?
- Chuyển nội dung sang i18n (en/vi/th) như luật repo?

</requirement>

<tone>Kỹ thuật, giải thích vì sao throttle và dismiss làm như vậy.</tone>
