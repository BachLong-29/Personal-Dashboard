# Event Live — event đang diễn ra & marquee hôm nay

<role>Frontend engineer làm cho "đang diễn ra" nhìn thấy được mà không phải so giờ với đồng hồ</role>

<context>
[event](./event.md) đưa event lên lịch, nhưng lịch chỉ nói **khi nào** — muốn biết buổi nào
đang diễn ra user phải tự so giờ với đồng hồ. Ba chỗ cùng trả lời câu đó: marquee dưới topbar,
chip trên Week view và card trên `/manage/events`.
</context>

<task>
Một hàm "live" duy nhất, một dải marquee các event hôm nay trên mọi trang có `DashboardTopbar`,
và ba cách đánh dấu event đang diễn ra.
</task>

<requirement>

## `isEventLive(occ, now)` — `src/features/events/utils/live.ts`

| Trường hợp                   | Live khi                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `occ.date ≠ hôm nay (local)` | Không bao giờ — Week view hiện 7 ngày, thiếu check này thì event thứ Ba sáng lên vào thứ Sáu |
| `allDay`                     | **Suốt ngày đó**                                                                             |
| Có giờ, `duration > 0`       | `start ≤ now < start + duration`                                                             |
| Có giờ, `duration = 0`       | Coi như kéo dài **60 phút** (`ASSUMED_DURATION_MINUTES`)                                     |

- All-day từng bị cố ý loại ("marquee cháy từ nửa đêm thì mất nghĩa 'ngay bây giờ'"). Đã đảo
  lại: event đánh dấu cả ngày hôm nay **thực sự** đang diễn ra, vắng mặt nó ở cả ba chỗ trông
  như lỗi.
- `duration` optional trên series và tới client là `0` — đọc thẳng thì event đó không bao giờ
  live.
- Ba chỗ dùng chung hàm này và chung nhịp `LIVE_TICK_MS = 30s`; lệch một phút là vô hình với
  người đọc mà không re-render liên tục.
- Trang list lấy live từ **occurrence hôm nay** (`useEventOccurrences(today, today)`) rồi map về
  `eventId`, không tự tính từ rule — interval/override/ngày bị bỏ đã có ở server, một bản thứ
  hai sẽ lệch.

## Marquee — `src/features/events/components/EventMarquee.tsx`

- Render **bên trong `DashboardTopbar`** → mọi trang mount topbar tự có, trang mới không phải
  nhớ thêm.
- Dữ liệu: occurrence của hôm nay. Không có event nào → **không render** (không dải rỗng).
- Mỗi item: icon (`<Icon>`, hỗ trợ ảnh upload) · giờ hoặc nhãn all-day (gold) · `·` · title;
  click → `/manage/events`. Event vẫn ở Week view — marquee là thêm một chỗ liếc, không phải dời.
- Chạy bằng motion value bước theo animation frame, 36px/s. Không dùng `animate` khai báo vì
  pause sẽ giật về đầu. Số lượt lặp = `ceil(rộng dải / rộng 1 lượt) + 1`, tối đa 24 — nhân đôi
  không đủ khi list ngắn trên màn rộng. Lượt lặp `aria-hidden`, `tabIndex=-1`.
- Hover → dừng. `prefers-reduced-motion` → không chạy, dải thành hàng cuộn ngang tay.
- Tab mở qua nửa đêm: hẹn giờ tới 00:00 + 1s rồi đổi `today` → query key mới.
- **Có event live** → hai mép trên/dưới dải hiện "aurora": hairline + ribbon blur + halftone
  chấm, cùng một gradient ở ba tốc độ không chia hết nhau (nên trông như chảy), thêm sparkle.
  Hiệu ứng nằm trên mép, **không** trên chữ, để giờ vẫn đọc được khi trôi. Light theme: nền dải
  pha violet 7% và chữ có halo màu panel. Reduced motion: dải đứng yên, không sparkle.

## Week view — `WeekView.tsx` + `EventFlame.tsx`

- Chip event đang live mang ngọn lửa động **sau chữ**, các chip khác giữ nguyên.
- Artwork là video có alpha, không phải GIF (GIF 7.1MB, decode phần mềm, không dừng được khi
  reduced motion). Hai bản: HEVC `/events/flame.mov` (Safari) đặt **trước** VP9
  `/events/flame.webm` — đảo thứ tự thì Chrome lấy HEVC và mất trong suốt.
- `HEAD /events/flame.webm` một lần cho cả trang; thiếu file → fallback ba lưỡi lửa CSS +
  framer. SSR luôn coi là thiếu để không nháy ô rỗng.
- Chip live ép class `dark` cho subtree: artwork vẽ cho nền tối.

## Manage list — `EventsPage.tsx`

- Card live: pill **LIVE** đỏ với chấm nhấp nháy, viền đỏ, glow **màu của event** (không phải
  đỏ — stack nhiều card thì glow đỏ lem sang hàng xóm), một vệt sáng quét ngang mỗi 3.5s
  (transform-only, tắt khi reduced motion).
- Đỏ chứ không gold: gold đã nghĩa là "đang chọn" khắp app; on-air phải nói điều trang không
  nói ở chỗ nào khác.
- Card live lên **đầu tầng của nó** (xem thứ tự ở [event](./event.md)); re-sort theo tick
  30s, framer giữ card nên nó trượt lên thay vì nháy.

## Edge cases

- Event `paused` / đã xoá không có occurrence → không bao giờ live.
- Override dời giờ: live tính theo giờ của override (occurrence đã mang giờ mới).
- Event giờ chạy qua nửa đêm: chỉ live tới 23:59 của ngày bắt đầu — không có occurrence ngày sau.

## Câu hỏi mở

- Nhãn trên marquee đã i18n (`events.marquee.*`), pill "Live" ở list thì chưa.

</requirement>

<tone>Concise, technical. Motion luôn có đường lui cho reduced motion; màu chỉ từ token.</tone>
