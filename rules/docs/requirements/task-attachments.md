<role>Engineer adding image attachments to the task create/edit form</role>

<context>
Task form (TaskForm.tsx) dùng chung cho create và edit mode. Task model hiện chưa có field attachments. Upload component đã có trong design system tại src/components/ui/Upload.tsx — có drop zone, progress bar, remove. Avatar upload endpoint đã có tại /api/v1/upload/avatar làm reference.
</context>

<task>
Cho user upload tối đa 3 ảnh trong task form (create và edit). Hiển thị preview dạng ô vuông 150×150. Ảnh lưu trên Cloudinary, URL lưu vào Task.attachments.
</task>

<requirement>

## API

| Method | Endpoint                    | Mô tả                                   |
| ------ | --------------------------- | --------------------------------------- |
| `POST` | `/api/v1/upload/attachment` | Upload 1 ảnh lên Cloudinary, trả về URL |

### POST /api/v1/upload/attachment

- Accept: `multipart/form-data`, field tên `file`
- Chỉ accept: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max size: 5 MB mỗi ảnh
- Upload lên Cloudinary folder `attachments/`, public_id ngẫu nhiên (dùng timestamp + userId)
- Response: `{ url: string }`
- Lỗi: 400 nếu sai type / quá size; 401 nếu không có auth

## Task Model

Thêm field vào ITask và taskSchema:

```
attachments: string[]   // max 3 URLs, default []
```

## Task API routes

- `POST /api/v1/tasks` — thêm `attachments?: string[]` vào createSchema, lưu vào task
- `PATCH /api/v1/tasks/[id]` — thêm `attachments?: string[]` vào updateSchema, merge (replace toàn bộ mảng)

## Types

- `CreateTaskPayload` — thêm `attachments?: string[]`
- `UpdateTaskPayload` — thêm `attachments?: string[]`
- `Task` (response type) — thêm `attachments: string[]`

## Frontend: TaskAttachmentsField Component

Vị trí: `src/features/tasks/components/shared/TaskAttachmentsField.tsx`

### Layout

```
[Drop zone — Upload component]  ← dùng nguyên, truyền files=[] để ẩn list mặc định
[Preview grid]                   ← custom 150×150 squares bên dưới
```

### Drop zone

- Dùng `<Upload accept="image/*" maxSizeMb={5} files={[]} hint="Max 3 images · 5 MB each" />`
- Ẩn (hide / disable) khi đã có đủ 3 ảnh (không render Upload nữa)

### Preview grid

- Hiển thị các ảnh đã chọn dưới dạng `flex gap-2 flex-wrap`
- Mỗi ảnh: ô vuông `w-[150px] h-[150px]` với `object-cover`, bo góc `var(--r-md)`
- Overlay loading: spinner khi đang upload
- Overlay remove: icon `×` góc trên phải, click để xóa
- Ảnh đã xóa khỏi list ngay lập tức (optimistic)

### Upload flow

1. User drop/chọn file → validate type/size ở client → upload ngay lên `/api/v1/upload/attachment`
2. Trong lúc upload: hiện placeholder 150×150 với spinner
3. Upload xong: thay bằng `<Image>` thật với URL từ Cloudinary
4. Error: hiện toast / inline text, remove placeholder

### Props

```typescript
interface TaskAttachmentsFieldProps {
  value: string[]; // current attachment URLs
  onChange: (urls: string[]) => void;
}
```

### Tích hợp vào TaskForm.tsx

- Thêm `attachments: string[]` vào `TaskFormValues` (default `[]`)
- Render `<TaskAttachmentsField>` trong form, sau field Note
- Truyền `attachments` vào payload khi submit (create + edit)

## Constraints

- Max 3 ảnh — không allow thêm khi đã đủ 3
- Không crop/resize UI
- `cloudinary` package: server-side only
- Reuse `/api/v1/upload/avatar` pattern làm reference implementation

</requirement>

<tone>
Đơn giản, không over-engineer. Không cần reorder hay caption ảnh.
</tone>
