# Notification Center — chuông, danh sách, và thông báo tự sinh từ lịch

<role>Product designer + fullstack engineer cho gamified personal dashboard</role>

<context>
Toast thì tạm thời, tự biến mất. User cần nhắc nhở theo ngữ cảnh (lên kế hoạch Chủ nhật, deadline,
ngày quá tải, ghi chi tiêu tiền mặt) và xem lại được. Phần lớn thông báo **không do user tạo** mà
do server tự sinh lúc đọc danh sách — điều đó quyết định gần như mọi luật dưới đây.
Nguồn sinh: [schedule-notifications](schedule-notifications.md),
[sunday-planning-reminder](sunday-planning-reminder.md),
[cash-log-reminder](cash-log-reminder.md).
</context>

<task>
Chuông 🔔 trên `DashboardTopbar` với badge chưa đọc, panel danh sách (đọc / đọc hết / bỏ qua /
bấm để tới đúng chỗ), và API cho các feature khác tạo thông báo.
</task>

<requirement>

## Model: `Notification` (`src/server/models/notification.model.ts`)

```
Notification {
  userId, title ≤100, message ≤500, isRead (false)
  type: planning | monthly-plan | reminder | system | reward | deadline | overload | conflict | cash-log
  dismissedAt?   // có mặt = user đã bỏ qua
  dedupeKey?     // khoá idempotent, vd. "overload:2026-06-19"
  entityId?      // vd. id task của "Quest Failed"
  expiresAt?     // TTL index — Mongo tự xoá khi hết hạn
}
```

**Bỏ qua là đánh dấu, không phải xoá.** Generator upsert theo `dedupeKey`; xoá row thì lần chạy
sau (vài phút) tạo lại y hệt, user tưởng bấm × không ăn. Row có `dismissedAt` vẫn khớp upsert,
`$setOnInsert` không làm gì, còn list và unread-count đều bỏ qua nó.

## API

| Route                             | Hành vi                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `GET /notifications`              | Chạy generator (xem dưới), rồi trả **20** mới nhất chưa bỏ qua, chưa hết hạn |
| `GET /notifications/unread-count` | `countDocuments` chưa đọc, chưa bỏ qua, chưa hết hạn → `{ count }`           |
| `PUT /notifications/[id]/read`    | Đánh dấu đã đọc                                                              |
| `PUT /notifications/read-all`     | Đánh dấu mọi cái chưa đọc                                                    |
| `DELETE /notifications/[id]`      | Set `dismissedAt` (không xoá row)                                            |
| `POST /notifications`             | Tạo (dùng nội bộ), dedupe, rồi giữ trần                                      |

- Id không hợp lệ → **404**, không phải 500.
- Badge dùng endpoint đếm riêng vì list bị cắt 20 — đếm trong list sẽ thiếu khi có nhiều hơn.
- `POST` dedupe: có `dedupeKey` → khớp chính xác; không có mà có `expiresAt` → cùng ngày + cùng
  `type` + cùng `title`. Heuristic cũ (type + ngày) từng nhập nhầm các thông báo không liên quan.
- Trần **60 row/user** (`enforceNotificationCap`, `src/server/services/notification-cleanup.ts`):
  xoá row **đã đọc** cũ nhất trước; chỉ khi vẫn vượt mới xoá row chưa đọc cũ nhất — không lặng
  lẽ mất cái user chưa thấy, nhưng bảng cũng không phình mãi.

## Sinh thông báo khi đọc danh sách

`GET /notifications` gọi `generateScheduleNotifications` rồi `generateCashLogNotifications`,
**mỗi cái một try/catch**: generator lỗi chỉ được log, user vẫn nhận danh sách và thông báo của
generator kia.

- Generator lịch dựng lại cả calendar → **throttle 5 phút/user**, claim nguyên tử trong Mongo
  (`NotificationGenStateModel`, unique `userId`) chứ không dùng Map trong RAM, vì các invocation
  serverless không chia sẻ bộ nhớ. Cash-log throttle 5 phút trong process (mất khi cold start chỉ
  tốn thêm một lần chạy).
- `deadline` sinh lại mỗi ngày thay vì hết hạn một lần rồi biến mất.
- Backfill `entityId` cho "☠ Quest Failed" cũ: gom một truy vấn task theo tên rồi update, không
  query từng cái.

## UI: `NotificationBell` + `NotificationPanel`

File: `src/features/dashboard/components/notifications/`, hook ở
`src/features/dashboard/hooks/useNotifications.ts` và `useNotificationActions.ts`.

- Badge đỏ = unread-count, ẩn khi 0, quá 9 hiện `9+`.
- Panel chỉ mount khi mở → danh sách fetch lúc mở (React Query, không polling).
- **Một ref bọc cả nút chuông lẫn panel** cho `useOnClickOutside`: tách ra thì bấm chuông để đóng
  sẽ thành mousedown-đóng rồi click-mở lại.
- Vị trí: < 1025px `fixed` theo viewport (`left-3 right-3 top-[60px]`) — neo vào nút với 360px cố
  định từng tràn ra ngoài màn; ≥ 1025px dropdown `absolute` 360px, cao tối đa 480px.
- Header "Notifications" + "Mark all read" (chỉ khi có chưa đọc); empty "No notifications".
- Item: icon theo type (`TYPE_ICON`; glyph trùng ở đầu/cuối title bị bỏ để không hiện hai lần),
  title, message, thời gian tương đối, nút ×. Chưa đọc có nền khác.

## Bấm vào một thông báo

Đánh dấu đã đọc (nếu chưa), đóng panel, rồi điều hướng qua store `pendingScheduleNav` — không
đọc localStorage lúc mount (cách cũ chỉ chạy một lần nên hay trượt):

| Type                                 | Đi tới                                                   |
| ------------------------------------ | -------------------------------------------------------- |
| `system` (Quest Failed)              | `pendingRestoreTaskId = entityId` → mở modal sửa task đó |
| `planning`                           | `/dashboard?tab=schedule`, view tuần bắt đầu thứ Hai tới |
| `monthly-plan`                       | `/dashboard?tab=schedule`, view tháng sau                |
| `deadline` · `overload` · `conflict` | `/dashboard?tab=schedule`, view ngày hôm nay             |
| `cash-log`                           | `/finance` — nơi ghi giao dịch                           |

## Đọc / đọc hết / bỏ qua: cập nhật trước, đối chiếu sau

Mọi mutation đọc lại list → chạy lại generator, nên chờ round-trip mới đổi UI làm thao tác trông
như bị treo. Vì thế mỗi mutation: huỷ query đang chạy, **chụp snapshot** list + count, sửa cache
ngay (đánh dấu đọc / bỏ row / trừ count), lỗi thì **rollback** + toast lỗi, xong thì invalidate
cả list lẫn count.

## Không có

Browser push / thông báo hệ điều hành — chỉ in-app.

</requirement>

<tone>Ngắn, kỹ thuật; mỗi luật lạ đều kèm lý do vì nó từng là bug.</tone>
