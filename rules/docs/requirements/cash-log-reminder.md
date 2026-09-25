# Cash Log Reminder — nhắc ghi chi tiêu tiền mặt cuối ngày

<role>Fullstack engineer nối lớp notification sẵn có vào dữ liệu finance</role>

<context>
Chi tiêu qua ngân hàng tự vào sổ: webhook SePay (`/api/v1/webhooks/sepay`) tạo transaction mà
không ai phải gõ. Chi bằng **tiền mặt** thì không có nguồn nào bắn về — nó chỉ tồn tại nếu user
tự nhập, và đó đúng là thứ hay bị quên.

Hệ thống **không có scheduler**: không cron, không service worker, không web-push. Mọi thông báo
được sinh **lúc đọc** — `GET /api/v1/notifications` gọi `generateScheduleNotifications`, và
`generateBudgetNotifications` chạy tương tự khi đọc budget. Cả hai upsert theo `dedupeKey` nên
gọi lại bao nhiêu lần cũng chỉ ra một hàng.

Hệ quả phải chấp nhận: nhắc lúc 22:00 nghĩa là **mở app từ 22:00 trở đi thì thông báo đã nằm sẵn
trong chuông**, không phải điện thoại reo. Push thật là giai đoạn sau, cần PWA + cron ngoài.
</context>

<task>
Thêm một mục trong profile để đặt giờ nhắc và chọn category cần nhắc; sinh mỗi ngày tối đa một
thông báo liệt kê **những category chưa có chi tiêu tiền mặt nào** trong ngày.
</task>

<requirement>

## Dữ liệu

`UserSetting.cashLog` (sub-document mới, `user-setting.model.ts`):

| Field         | Kiểu           | Mặc định        | Ghi chú                         |
| ------------- | -------------- | --------------- | ------------------------------- |
| `enabled`     | boolean        | `true`          |                                 |
| `time`        | string `HH:MM` | `'22:00'`       | Đọc theo `UserSetting.timezone` |
| `categoryIds` | ObjectId[]     | **`undefined`** | Cố ý không để `[]`              |

`categoryIds` **không có default `[]`** vì phải phân biệt hai trạng thái khác nhau:

- `undefined` — user chưa từng mở mục này → lấy mặc định suy từ **tên category của chính họ**
- `[]` — user đã xem và cố ý bỏ chọn hết → tôn trọng, không ghi đè

Mặc định suy bằng cách khớp chuỗi con, chữ thường, trên tên category expense:
`giữ xe · xăng · cafe · coffee · ăn · church · nhà thờ`.
`ăn` cố ý khớp cả `Ăn sáng`, `Ăn trưa`, `Ăn tối` — ba khoản cần nhớ riêng.

Hàm `resolveCashLogCategoryIds` là **nguồn duy nhất** của luật này, dùng chung bởi
`GET /api/v1/profile` (để picker mở lên đã tick sẵn) và bộ sinh thông báo.

## Múi giờ

`UserSetting.timezone` đã tồn tại từ trước nhưng **chưa từng được logic nào đọc**, mặc định
`'UTC'`. Tính năng này là nơi đầu tiên dùng nó, nên section trong profile **phải** hiện ô timezone
kèm nút điền từ `Intl.DateTimeFormat().resolvedOptions().timeZone`.

Không có bước đó thì user UTC+7 sẽ bị nhắc lúc **05:00 sáng** mà không hiểu vì sao.

Ranh giới ngày được tính bằng offset thật của zone tại thời điểm chạy, nên truy vấn khớp
**ngày của user**, không phải ngày của server.

## Luật sinh thông báo

`generateCashLogNotifications(userId)` — gọi từ `GET /api/v1/notifications`, bọc `try/catch`
riêng để một bộ sinh hỏng không cướp mất thông báo của bộ kia.

Thứ tự dừng sớm, rẻ trước đắt:

1. Throttle 5 phút trong tiến trình (như `budget-notifications`)
2. `cashLog.enabled` tắt → dừng
3. Giờ hiện tại theo zone của user **chưa tới** `cashLog.time` → dừng
4. Không có category nào được chọn → dừng
5. Không có category nào còn thiếu → **dừng, không nhắc**

Điểm 5 là điều kiện quan trọng nhất: ngày đã ghi đủ thì **im lặng**. Thông báo bắn cả vào ngày
user đã làm xong việc là thông báo người ta học cách bỏ qua.

Chỉ đếm transaction `type: 'expense'` trên ví `type: 'cash'`. Ví bank và e-wallet đã tự vào sổ
qua webhook — đó là toàn bộ lý do tính năng này tồn tại.

`dedupeKey = cash-log:<YYYY-MM-DD>` → mở app 10 lần vẫn một hàng.
`expiresAt` = hết ngày **hôm sau**, nên mở app lúc 1h sáng vẫn còn thấy nhắc của hôm trước.

## Giao diện

- Profile section `IX — Cash Reminder`: bật/tắt, giờ, timezone, lưới tick chọn category
- Lưới category bám cấu trúc `FocusSection` (ô tile, viền vàng khi chọn), `grid-cols-2 sm:grid-cols-3`
- `PrefRow` tách khỏi `PrefsSection` thành file dùng chung
- Notification type mới `'cash-log'`, icon `💵`, click → `/finance`

## Ngoài phạm vi

Push thật · email/Telegram · nhắc nhiều lần trong ngày · snooze · nhắc theo thứ trong tuần ·
tự tạo transaction · nhắc cho thu nhập.

## Chưa làm — nợ đã biết

Chuỗi trong thông báo là **tiếng Anh cố định**, sinh ở server nơi không có `useTranslations` —
giống hệt `budget-notifications`. Section trong profile cũng hardcode tiếng Anh cho khớp tám
section anh em. Muốn đa ngôn ngữ thì phải dịch cả trang profile và cả lớp notification một lượt.

</requirement>

<tone>Ngắn, nói lý do thay vì mô tả lại code.</tone>
