# Quick Notes — bắt một ý tưởng bằng một chạm

<role>Fullstack engineer thêm entity nhẹ nhất có thể vào dashboard</role>

<context>
Muốn lưu một ý tưởng thì trước đây chỉ có đường tạo Task. `⌘⇧Q` **không phải** quick-add thật —
nó mở nguyên `AddTaskModal`: tên, icon, **category bắt buộc**, màu, trạng thái, ngày bắt đầu,
ngày kết thúc, thời lượng, phụ thuộc, đính kèm, project. Trên điện thoại còn không có phím tắt.

Một ý tưởng vụt qua đầu không sống sót qua ngần ấy ô nhập.

"Backlog" cũng không phải chỗ chứa — nó chỉ là **cách lọc task chưa có `startDate`**, nên vẫn là
task, vẫn đủ ràng buộc như trên.
</context>

<task>
Một nút nổi trên mọi trang đã đăng nhập, mở ra một sheet để gõ và xem lại các note đã ghi.
</task>

<requirement>

## Dữ liệu

`Note` — cố ý gần như rỗng:

| Field        | Kiểu                | Ghi chú           |
| ------------ | ------------------- | ----------------- |
| `content`    | string, ≤2000, trim | Bắt buộc          |
| `archivedAt` | Date?               | Có mặt = đã xử lý |

Không category, không ngày, không độ ưu tiên. **Mọi thứ cần một quyết định lúc ghi đều thuộc về
Task, không thuộc về đây.** Thêm bất kỳ field nào vào đây là đang dựng lại cái rườm rà vừa tránh.

`archivedAt` dùng **sự vắng mặt** để biểu thị "chưa xử lý", nên route `PATCH` phải `$unset` chứ
không set `null` — có vậy serializer mới trả `undefined` đúng nghĩa.

## Luật giao diện

**Lối vào duy nhất là nút ＋ nổi** `QuickCreateFab` (`src/components/common/QuickCreateFab.tsx`),
góc dưới phải, `z-40`, ở **mọi kích thước màn**. Bấm mở một dial ba mục — **Note**, Task
(`⌘⇧Q`), Transaction (`⌘⇧E`) — ba thứ đáng bắt vội; mục gần ngón cái nhất hiện trước, chạm ra
ngoài là đóng, nút xoay 45° thành nút đóng. Note **không có** phím tắt riêng. Trước đây desktop
mở từ menu ＋ trên topbar; menu đó bị cạnh phải cửa sổ cắt mất nên đã bỏ — mỗi màn chỉ một chỗ
để tạo thứ gì đó. Panel còn mở được từ link "View notes" của trợ lý (`ui.store.openNotes`).

`QuickNotes` mount một lần trong `src/app/[locale]/(protected)/layout.tsx`, cạnh `GlobalSearch`
và `QuickAddTask` — mở không tốn một lần điều hướng, vì mất trang đang xem chính là ma sát tính
năng này muốn bỏ.

Màn < 1025px nút đặt ở `bottom-[72px]`, không phải `bottom-4`: bottom nav của dashboard cao 56px
và cố định — đặt thấp hơn là chôn nút dưới thanh nav. Màn rộng không có thanh đó → `bottom-6`.

**Nút ẩn ở `/profile`.** Trang đó có thanh lưu cố định dọc cạnh dưới (`ProfilePage.tsx`), nút sẽ
đè lên nút phải của thanh đó. Thanh đó **thường trực**, khác toast hay banner chỉ hiện thoáng
qua — nên nút nhường chỗ.

**Enter xuống dòng, không lưu.** Một ý tưởng thường hai dòng; phím lặng lẽ commit nửa ý tưởng
còn tệ hơn một cái nút. `⌘/Ctrl + Enter` là lối tắt cho đúng cái nút đó, theo tiền lệ `BingoView`.

**Note đã xử lý chìm xuống cuối danh sách**, gạch ngang và mờ đi — không biến mất. Server vì vậy
không lọc `archivedAt` (`GET /api/v1/notes`: mới nhất trước, tối đa 200); client sắp xếp
(chưa xử lý trước, rồi mới → cũ) trong `QuickNotes.tsx`, nên tick một cái là nó trượt xuống ngay
theo optimistic update của `useToggleNoteArchived`, không chờ vòng mạng nào (lỗi thì rollback).

**Biến thành Task** đóng sheet rồi mở `AddTaskModal` với `defaultValues.name`. Không xếp chồng
hai panel. Note **không** tự động được đánh dấu đã xử lý khi promote — chưa có ai yêu cầu.

## Trợ lý đọc và ghi note

Trợ lý ([ai-task-agent-tools.md](ai-task-agent-tools.md), `src/server/agent/note-tools.ts`) có
đúng hai tool, cùng giới hạn như UI:

- `list_notes` — mặc định chỉ note **chưa xử lý** (không có `archivedAt`); `done` / `all` khi
  được hỏi; tìm theo `q`.
- `create_note` — đề xuất lưu **nguyên lời user**, chỉ ghi sau khi user Confirm. Việc cần làm vào
  một ngày là task, không phải note.

Note ghi qua trợ lý không có đường tắt nào khác: cùng model, cùng `content ≤ 2000`.

## Giai đoạn này KHÔNG có

**Sửa** và **xoá** note — ở UI lẫn ở trợ lý. Chỉ có đánh dấu đã xử lý (và trợ lý không có cả
cái đó). Thêm sau chỉ tốn vài dòng, nhưng đừng thêm
lặng lẽ — đó là quyết định đã chốt, không phải thiếu sót.

Ngoài ra: offline/PWA · ảnh, file, ghi âm · chia sẻ · markdown · tìm kiếm trong note · nhắc nhở.

## Ngôn ngữ

Chuỗi để tiếng Anh, khớp với `/profile`, `/manage/events` và mục Cash Reminder. Dịch riêng màn
này sẽ ra một app nửa Anh nửa Việt.

</requirement>

<tone>Ngắn, nói lý do thay vì mô tả lại code.</tone>
