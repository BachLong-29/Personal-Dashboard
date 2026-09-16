# Share Agenda — chia sẻ lịch ngày / tuần

<role>Fullstack engineer đưa lịch trong app ra ngoài dưới dạng text và ảnh</role>

<context>
Lịch việc chỉ tồn tại bên trong app — muốn cho ai xem phải mở dashboard. `buildCalendar`
([calendar-item](./calendar-item.md)) đã gộp sẵn 4 nguồn (habit · quest · task · event) thành
`CalendarItem[]` qua `GET /api/v1/calendar`, nên dữ liệu cần chia sẻ đã có đủ; thiếu duy nhất
đường đưa nó ra ngoài.
</context>

<task>
Một modal toàn cục cho phép copy lịch **hôm nay** hoặc **tuần này** dạng text, hoặc tải về dạng
ảnh PNG. Lối vào: nút trong `DashboardTopbar` (mọi trang) và trong thanh công cụ của `ScheduleView`.
</task>

<requirement>

## Phạm vi

- Hai mốc cố định: **hôm nay** (`today..today`) và **tuần này** (thứ Hai → Chủ nhật của tuần
  chứa hôm nay). **Không** theo tuần đang xem trên Week view — share luôn là "bây giờ".
- Nội dung gồm **cả 4 loại** `CalendarItem`. Mục `status: 'done'` **vẫn hiện**, có đánh dấu.
- Range rỗng vẫn share được, in "Hôm nay trống" / "Tuần này trống".
- Đích đến: **clipboard** (text) và **tải file** (ảnh). Không sinh link công khai.

## Text

`buildAgendaText()` — hàm thuần, nhận `CalendarItem[]` + nhãn đã dịch sẵn, trả chuỗi.

- Nhóm theo ngày; trong ngày sắp theo `startTime`, item `startTime: null` (all-day /
  deadline-only) xuống cuối.
- Scope `day` không lặp lại tên ngày (heading đã nói rồi); scope `week` in tên ngày mỗi nhóm,
  item thụt lề 2 khoảng trắng.
- Mục đã xong gắn hậu tố ` ✓`.
- Kết thúc bằng dòng tổng `{done}/{total} xong`.
- Không khung, không màu — chuỗi này dán sang app của người khác.

## Ảnh — `GET /api/v1/share/agenda`

Query: `from` · `to` · `heading` · `scopeLabel` · `emptyLabel` · `locale` · `summaryLabel?` ·
`moreLabel?`.
**Mọi chữ trên thẻ đều được dịch sẵn ở client rồi gửi lên** — locale nằm phía client, route chỉ
dàn trang. Auth bắt buộc, đi qua middleware như mọi route `/api/v1/*`.

Dựng bằng `ImageResponse` của `next/og` (Next 16 có sẵn, **không thêm dependency**). Server gọi
lại `buildCalendar` — không tin số liệu client gửi lên.

### Ba ràng buộc của Satori phải tuân

1. **Không đọc được design token.** Satori không hiểu CSS variable lẫn `oklch()`. Toàn bộ màu
   gom vào `src/features/share/constants/og-palette.ts`, mỗi hằng số chú thích rõ nó là ảnh
   chiếu của token nào. Đây là ngoại lệ có chủ đích với rule "không hard-code màu".
2. **Không glyph nào được tin.** Font mặc định (Geist) phủ Latin + tiếng Việt nhưng **thiếu
   Thai và `✓`**; Satori cũng không vẽ emoji nếu không tải ảnh emoji lúc render. Nên thẻ ảnh
   **không dùng icon, không dùng ✓**: trạng thái xong thể hiện bằng `opacity` + gạch ngang,
   phân loại thể hiện bằng vạch màu trái.
3. **Chỉ flexbox**, không `grid`; bundle tối đa 500KB.

### Kích thước

`ImageResponse` mặc định 1200×630 — sẽ cắt cụt lịch dài hoặc để trống lịch ngắn. Chiều cao tính
từ số dòng + số dòng tên ngày (`cardHeight()`), rộng cố định 1000.

Scope `week` **nhóm theo ngày**, mỗi ngày một dòng tên ngày (`Intl.DateTimeFormat` với `locale`
gửi lên — Node chạy full ICU). Scope `day` không có dòng này vì heading đã nói rồi.

Cắt theo `ogMaxRows(scope)`: **16** dòng cho ngày, **40** cho tuần — một tuần chứa nhiều ngày
làm việc nên được phép dài hơn hẳn. Cắt trọn item, không cắt giữa ngày. Hằng số để ở
`og-palette.ts` để client tính phần dư và tự dịch nhãn `+N mục nữa`.

## UI — `ShareAgendaModal`

Mount một lần ở `(protected)/layout.tsx`, cạnh `<GlobalSearch />`; mở qua `ui.store`
(`shareAgendaOpen` / `openShareAgenda` / `closeShareAgenda`) — đúng pattern `searchOpen`.

- `Tabs` variant `pill`: Hôm nay / Tuần này.
- Khung `<pre>` xem trước đúng chuỗi sẽ được copy — share là hành động đẩy nội dung ra ngoài
  tầm kiểm soát, nhìn trước một giây rẻ hơn dán nhầm.
- Footer: `Đóng` · `Tải ảnh` · `Copy text` (primary).
- Loading → `SkelBlock`; lỗi → thông báo + nút thử lại; không bao giờ copy chuỗi rỗng.
- Copy xong báo bằng `addToast`. Clipboard bị chặn (không phải secure context) → toast lỗi
  gợi ý bôi đen copy tay.

## Lối vào

| Chỗ                                       | Ghi chú                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `DashboardTopbar` cụm mobile (`<1025px`)  | Cạnh `NotificationBell`                                                              |
| `DashboardTopbar` cụm desktop (`≥1025px`) | **Bắt buộc riêng** — menu ＋ chỉ tồn tại ở mobile                                    |
| `ScheduleView`, cụm `rightControls`       | Cạnh nút ⚡ Quests, **trước** cặp toggle để không tách đôi cặp đó. Có ở cả 3 sub-tab |

## Files

| File                                                 |                                                      |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `src/features/share/constants/og-palette.ts`         | mới — bảng màu hex cho Satori                        |
| `src/features/share/utils/agenda-text.ts`            | mới — `groupByDay` · `countDone` · `buildAgendaText` |
| `src/features/share/components/ShareAgendaModal.tsx` | mới — modal                                          |
| `src/app/api/v1/share/agenda/route.tsx`              | mới — `ImageResponse`                                |
| `src/stores/ui.store.ts`                             | sửa — slice `shareAgenda`                            |
| `src/app/[locale]/(protected)/layout.tsx`            | sửa — mount modal                                    |
| `DashboardTopbar.tsx` · `ScheduleView.tsx`           | sửa — nút mở                                         |
| i18n `share.*` (en/vi/th)                            | sửa — 17 key                                         |

## Ngoài phạm vi

Không link công khai · không Web Share API · không đăng thẳng lên mạng xã hội · không PDF /
iCal / Google Calendar · không share kỳ quá khứ hay thống kê · không trang cho người khác
tương tác.

## Trạng thái hiện tại

✅ Đã implement đủ phần trên.

🟡 Chưa: locale **Thai** sẽ ra ô vuông trong ảnh (font mặc định thiếu glyph Thai) — text vẫn
đúng. Muốn sửa phải nhúng font phủ Thai và cân lại ngân sách 500KB.

</requirement>

<tone>Concise, technical. Dữ liệu dùng lại `buildCalendar`; không thêm model, không cron, không dependency mới.</tone>
