# Share Agenda — chia sẻ lịch ngày / tuần

<role>Fullstack engineer đưa lịch trong app ra ngoài dưới dạng text và ảnh</role>

<context>
Lịch chỉ tồn tại bên trong app — muốn cho ai xem phải mở dashboard. `buildCalendar`
([calendar-item](./calendar-item.md)) đã gộp đủ 4 nguồn (habit · quest · task · event) thành
`CalendarItem[]`; thiếu duy nhất đường đưa nó ra ngoài.
</context>

<task>
Modal toàn cục để copy lịch **hôm nay** hoặc **tuần này** dạng text, hoặc tải ảnh PNG.
</task>

<requirement>

## Phạm vi

- Hai mốc cố định: **hôm nay** và **tuần này** (thứ Hai → Chủ nhật của tuần chứa hôm nay).
  **Không** theo tuần đang xem trên Week view — share luôn là "bây giờ".
- Gồm cả 4 loại item; mục `done` **vẫn hiện**, có đánh dấu. Range rỗng vẫn share được.
- Đích: clipboard (text) và tải file (ảnh). Không link công khai.

## Text — `src/features/share/utils/agenda-text.ts`

`buildAgendaText()` — hàm thuần, nhận `CalendarItem[]` + nhãn đã dịch, trả chuỗi.

- `groupByDay`: nhóm theo ngày; trong ngày sort `startTime`, cùng giờ thì theo title, item
  `startTime: null` xuống cuối (in 5 khoảng trắng thay giờ để cột thẳng).
- Scope `day` không in tên ngày (heading đã nói); `week` in tên ngày ngắn mỗi nhóm, item thụt 2.
- Mục xong gắn ` ✓`. Cuối: dòng tổng `{done}/{total}` (bỏ khi không có item).
- Không khung, không màu — chuỗi này dán sang app người khác.

## Ảnh — `GET /api/v1/share/agenda`

Query: `from` · `to` · `heading` · `scopeLabel` · `emptyLabel` · `locale` · `summaryLabel?` ·
`moreLabel?`. **Mọi chữ trên thẻ được dịch ở client** — locale sống ở client, route chỉ dàn
trang. Auth bắt buộc. Server gọi lại `buildCalendar`, không tin số liệu client gửi.

Dựng bằng `ImageResponse` của `next/og` — **không thêm dependency**.

### Ba ràng buộc của Satori

1. **Không đọc được design token** (CSS variable, `oklch()`). Màu gom ở
   `src/features/share/constants/og-palette.ts`, mỗi hằng chú thích token gốc — ngoại lệ có chủ
   đích với rule "không hard-code màu".
2. **Không glyph nào được tin.** Geist phủ Latin + tiếng Việt nhưng thiếu Thai và `✓`; Satori
   không vẽ emoji. Thẻ ảnh **không icon, không ✓**: xong = `opacity` + gạch ngang, phân loại =
   vạch màu trái.
3. **Chỉ flexbox**, bundle ≤500KB.

### Kích thước & cắt

Rộng cố định 1000, cao tính từ số dòng (`cardHeight()`) — 1200×630 mặc định sẽ cắt lịch dài.
Scope tuần (route nhận biết bằng `from ≠ to`) có dòng tên ngày (`Intl.DateTimeFormat` theo
`locale`, Node full ICU).

`ogMaxRows(scope)`: **16** dòng cho ngày, **40** cho tuần. Lấp theo thứ tự ngày tới khi đủ trần;
cắt **trọn item** (không cắt nửa dòng) — ngày cuối có thể chỉ hiện một phần. Client dùng cùng
hằng để tự dịch nhãn `+N mục nữa`.

## UI — `src/features/share/components/ShareAgendaModal.tsx`

Mount một lần ở `(protected)/layout.tsx`; mở qua `ui.store` (`shareAgendaOpen` /
`openShareAgenda` / `closeShareAgenda`). Dữ liệu qua `useCalendar(from, to, open)` — chỉ fetch
khi modal mở.

- `Modal` với `bottomSheet`: dưới `sm` trượt lên từ đáy, chỉ bo hai góc trên; từ `sm` là dialog
  giữa màn. Dialog giữa màn là sai hình dạng trên điện thoại.
- `Tabs` pill: Hôm nay / Tuần này. Heading theo `Intl` của locale đang dùng.
- `<pre>` xem trước đúng chuỗi sẽ copy — share đẩy nội dung ra ngoài tầm kiểm soát, nhìn trước
  một giây rẻ hơn dán nhầm.
- **Footer theo thứ tự đọc = tab order = DOM:** `Copy text` (primary, gold) → `Tải ảnh`
  (`DownloadImageButton`, nền filled) → `Đóng` (ghost). Ba tầng thị giác; trước đây Tải ảnh và
  Đóng cùng ghost khiến lối thoát trông như một hành động. Mobile xếp dọc full-width.
- `DownloadImageButton.tsx`: sheen chậm, halo thở, sparkle, mũi tên rơi vào khay khi đang tạo
  file, flash khi xong. Toàn bộ `aria-hidden` và dừng khi `prefers-reduced-motion` — còn lại là
  một nút có nhãn bình thường.
- Loading → `SkelBlock`; lỗi → thông báo + thử lại; Copy/Tải ảnh disabled khi loading/lỗi.
  Đóng disabled khi đang tải ảnh.
- Copy xong → `addToast` success. Clipboard bị chặn → toast lỗi. Tải ảnh lỗi → toast lỗi.
- Tên file: `agenda-<from>.png` hoặc `agenda-<from>_<to>.png`.

## Lối vào

| Chỗ                                  | Ghi chú                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `DashboardTopbar` (mobile + desktop) | ⇪ cạnh bell — **ẩn trên `/dashboard`** để một màn không có hai nút share |
| `ScheduleView` `rightControls`       | `⇪ Share` từ `sm`, trước 4 công tắc hiển thị; dưới `sm` là nút ⇪ compact |

## Ngoài phạm vi

Không link công khai · không Web Share API · không đăng mạng xã hội · không PDF / iCal ·
không share kỳ quá khứ hay thống kê.

## Câu hỏi mở

- Locale **Thai** ra ô vuông trong ảnh (font thiếu glyph) — text vẫn đúng. Sửa phải nhúng font
  phủ Thai và cân lại ngân sách 500KB.
- Event luôn `planned` nên dòng tổng `{done}/{total}` tính cả event vào mẫu số — tuần nhiều
  cuộc họp sẽ trông "ít xong". Có nên loại event khỏi tổng?

</requirement>

<tone>Concise, technical. Dùng lại `buildCalendar`; không model mới, không cron, không dependency mới.</tone>
