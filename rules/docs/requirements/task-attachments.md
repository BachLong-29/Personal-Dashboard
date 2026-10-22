# Task Attachments — tối đa 3 ảnh đính kèm một task

<role>Fullstack engineer giữ phần ảnh đính kèm trong form tạo / sửa task</role>

<context>
`TaskForm.tsx` dùng chung cho create và edit. Ảnh lưu trên Cloudinary, task chỉ giữ URL. Route
upload này cũng là route mà **icon ảnh** dùng (`useIconUpload`, `IconPickerSheet`) — giới hạn file
vì thế nằm chung ở `src/constants/upload.ts`.
</context>

<task>
User đính kèm tới 3 ảnh khi tạo hoặc sửa task, xem lại ảnh cỡ lớn, và xoá được trên cả điện thoại.
</task>

<requirement>

## Dữ liệu

`Task.attachments: string[]` — default `[]`, model validate `length <= 3`.

| Route                     | Schema                                      | Ghi chú                                 |
| ------------------------- | ------------------------------------------- | --------------------------------------- |
| `POST /api/v1/tasks`      | `attachments: z.array(url).max(3)` optional | `AddTaskModal` gửi `undefined` khi rỗng |
| `PATCH /api/v1/tasks/:id` | `attachments: z.array(url).max(3)` optional | **Thay cả mảng**, không merge           |

## API upload — `POST /api/v1/upload/attachment`

`src/app/api/v1/upload/attachment/route.ts`

- `multipart/form-data`, field `file`. Cần auth (401 nếu không có).
- Type: `image/jpeg · image/png · image/webp · image/gif`. Size ≤ **5 MB**. Sai → 400.
- Upload Cloudinary folder `attachments/`, `public_id = <userId>_<timestamp>`, `overwrite:false`.
- Response `{ url }` (secure URL).
- Không có endpoint xoá: bỏ ảnh khỏi task **không** xoá file trên Cloudinary.

## Component — `TaskAttachmentsField`

`src/features/tasks/components/shared/TaskAttachmentsField.tsx`, props `{ value, onChange }`.
Render trong `TaskForm` ngay sau Note, nhãn "optional · max 3".

**Drop zone** — `<Upload multiple maxSizeMb={5} files={[]}>` (truyền `files=[]` để ẩn list mặc
định của Upload). Hint là số chỗ còn lại (`attachmentsField.remaining`). **Ẩn hẳn** khi đã đủ 3
(tính cả ảnh đang upload). Dưới `sm` drop zone là một hàng icon + chữ gọn; từ `sm` trở lên giữ
khối cao như cũ — khối to chiếm quá nhiều chiều cao form trên điện thoại.

**Lưới ảnh** — `grid grid-cols-3`, mỗi ô `aspect-square`. Không dùng ô cố định 150px nữa: với
flex-wrap, ảnh thứ 3 rơi xuống một hàng lẻ trên màn hẹp; 3 cột luôn nằm đều một hàng ở mọi độ
rộng.

**Nút xoá ×** — **luôn hiện** (không còn `group-hover`), vì hover không bao giờ xảy ra trên cảm
ứng, nghĩa là trước đây mobile không xoá được ảnh. Xoá là bỏ URL khỏi `value` ngay lập tức.

**Preview** — chạm ảnh mở lightbox toàn màn (`z-[2000]`, `object-contain`, bấm nền hoặc × để
đóng), cùng pattern lightbox ảnh của `QuestCard`.

## Luồng upload

1. Chọn / thả nhiều file → chỉ lấy đủ số chỗ còn trống (snapshot lúc bắt đầu batch).
2. Mỗi file hiện placeholder từ `URL.createObjectURL` mờ đi + spinner.
3. Upload song song; xong file nào bỏ placeholder file đó và revoke object URL.
4. Cả batch xong → gọi `onChange` **một lần** với các URL thành công.
5. Lỗi → placeholder giữ lại với chữ "upload failed" và nút × để gỡ. Không toast.

## Hiển thị ngoài form

Chỉ `QuestCard` (day view, gồm cả day panel của dashboard) hiện ảnh — mục "📎 Đính kèm (n)" trong
panel mở rộng, chạm mở lightbox. All view và week view không hiện ảnh.

## Không có

Reorder, caption, crop/resize, xoá file trên Cloudinary.

## Open questions

- Ảnh mồ côi trên Cloudinary (bị gỡ khỏi task, hoặc upload xong rồi huỷ form) không bao giờ được
  dọn. Chấp nhận hay cần job dọn?

</requirement>

<tone>Đơn giản, không over-engineer.</tone>
