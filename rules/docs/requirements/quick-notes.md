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

**Nút nổi** góc dưới phải, `z-30`, hiện ở **mọi kích thước màn**. Chọn "chỉ mobile" thì desktop
không còn đường vào nào, vì tính năng này không có phím tắt và không có mục trong menu.

Trên màn hẹp nút đặt ở `bottom-[72px]`, không phải `bottom-4`: bottom nav của dashboard cao 56px
và cố định — đặt thấp hơn là chôn nút dưới thanh nav, ngay trên trang dễ đang mở nhất.

**Nút ẩn ở `/profile`.** Trang đó có thanh lưu cố định dọc cạnh dưới (`ProfilePage.tsx`), trên
điện thoại nút sẽ đè lên nút phải của thanh đó. Thanh đó **thường trực**, khác với toast hay
banner chỉ hiện thoáng qua — nên nút nhường chỗ.

**Enter xuống dòng, không lưu.** Một ý tưởng thường hai dòng; phím lặng lẽ commit nửa ý tưởng
còn tệ hơn một cái nút. `⌘/Ctrl + Enter` là lối tắt cho đúng cái nút đó, theo tiền lệ `BingoView`.

**Note đã xử lý ở nguyên chỗ cũ**, gạch ngang và mờ đi — không biến mất. Server vì vậy không lọc
`archivedAt`, client tự đánh dấu.

**Biến thành Task** đóng sheet rồi mở `AddTaskModal` với `defaultValues.name`. Không xếp chồng
hai panel. Note **không** tự động được đánh dấu đã xử lý khi promote — chưa có ai yêu cầu.

## Giai đoạn này KHÔNG có

**Sửa** và **xoá** note. Chỉ có đánh dấu đã xử lý. Thêm sau chỉ tốn vài dòng, nhưng đừng thêm
lặng lẽ — đó là quyết định đã chốt, không phải thiếu sót.

Ngoài ra: offline/PWA · ảnh, file, ghi âm · chia sẻ · markdown · tìm kiếm trong note · nhắc nhở.

## Ngôn ngữ

Chuỗi để tiếng Anh, khớp với `/profile`, `/manage/events` và mục Cash Reminder. Dịch riêng màn
này sẽ ra một app nửa Anh nửa Việt.

</requirement>

<tone>Ngắn, nói lý do thay vì mô tả lại code.</tone>
