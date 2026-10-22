# Category — nhãn dùng chung cho Habit, Task và Event

<role>Fullstack engineer giữ một danh sách nhãn nhỏ, riêng cho từng user</role>

<context>
Category (trong code là `tagId`) là nhãn để nhóm và lọc theo chủ đề ("Work", "Health"…). Mỗi user
tự quản lý danh sách của mình. Nó **chỉ có tên** — màu và icon thuộc về từng Habit/Task/Event, nên
cùng một category có thể mang nhiều màu.

Không nhầm với finance category (`FinanceCategory`, xem `finance-categories.md`) — model và API khác hẳn.
</context>

<task>
Mô tả model, API, cách seed mặc định, ràng buộc xoá và UI quản lý.
</task>

<requirement>

## Model — `src/server/models/category.model.ts`

| Field      | Ghi chú                   |
| ---------- | ------------------------- |
| `userId`   | ref User, index           |
| `name`     | required, trim, ≤50 ký tự |
| timestamps | `createdAt`, `updatedAt`  |

- Index unique `(userId, name)` — không trùng tên trong cùng user (phân biệt hoa thường theo
  collation mặc định).
- Không soft delete.

## Quan hệ

| Entity | Field   | Ghi chú                                 |
| ------ | ------- | --------------------------------------- |
| Habit  | `tagId` | string id                               |
| Task   | `tagId` | string id                               |
| Event  | `tagId` | required ở dòng series (xem `event.md`) |

`tagId` lưu dạng string, không phải ObjectId ref — không có populate, client tự tra tên từ
`useCategories()`.

## API — `src/app/api/v1/categories`

| Action  | Route                    | Ghi chú                                                              |
| ------- | ------------------------ | -------------------------------------------------------------------- |
| List    | `GET /categories`        | Của user, sort `createdAt` asc. **Rỗng thì seed mặc định**           |
| Tạo     | `POST /categories`       | `{ name }` (1–50, trim) → `201`                                      |
| Đổi tên | `PATCH /categories/:id`  | `{ name }`; chỉ owner, không thấy → `404`                            |
| Xoá     | `DELETE /categories/:id` | Hard delete; `409` nếu còn **habit active** dùng; không thấy → `404` |

Body sai → `400` (Zod). Mọi route cần Bearer (`getAuthUser`), thiếu → `401`.

**Seed:** `Morning Routine`, `Healthy Lifestyle`, `Work` được tạo **mỗi khi** `GET` thấy danh sách
rỗng — không phải chỉ một lần. Xoá hết category thì lần GET sau chúng quay lại. Lý do giữ vậy: form
Task/Habit/Event đều cần ít nhất một category để chọn.

**Ràng buộc xoá** chỉ kiểm `HabitModel.exists({ tagId, active: true })`. Task và Event đang dùng
category vẫn xoá được → chúng còn giữ `tagId` mồ côi.

## Ai dùng

- Hooks ở `src/features/dashboard/hooks/`: `useCategories` (query key `['categories']`),
  `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`.
- `TaskForm`: `Select` có ô tìm kiếm (`searchable`, `21ea8e5`) thay cho hàng chip — danh sách dài
  dần đã chiếm ba dòng và có scroll lồng nuốt thao tác cuộn của form. Có luồng "+ NEW" thêm category
  ngay trong form. Category mặc định: cái tên `task` (không phân biệt hoa thường), không có thì cái
  đầu tiên.
- `AddHabitModal`, `EventFormModal`, `EventsPage`, `ProjectDetail`, `TaskAllView`, `TaskManagement`
  đọc danh sách để chọn hoặc hiện tên.
- AI assistant (`src/server/agent/habit-tools.ts`): tool `list_categories`; tạo habit không có
  `tagId` thì lấy category đầu tiên.

## UI quản lý — `CategoryModal`

`src/features/dashboard/components/habits/CategoryModal.tsx`, **chỉ mở từ `HabitPanel`**. Dùng
`Modal` chung (`maxWidth 440px`).

- Ô "Add Category" + nút Add; `Enter` cũng tạo.
- Mỗi dòng: tên, `✎`, `✕`.
- `✎` → sửa inline; `Enter` lưu, `Escape` huỷ.
- `✕` → xoá ngay, không confirm. API `409` → thông báo lỗi ngay dưới dòng đó.
- Danh sách cuộn riêng, `maxHeight: 300px`.
- Đóng bằng nút Close, Escape, hoặc click backdrop (hành vi của `Modal`).

## Câu hỏi mở

- **Tên trùng trả `500`, không phải `409`.** `POST`/`PATCH` không kiểm trùng trước; lỗi
  duplicate key (`E11000`) của Mongo rơi vào `asyncHandler` và thành `500` với message thô của Mongo.
- Ràng buộc xoá có nên kiểm cả Task và Event (đang mồ côi `tagId`)?
- Seed lại khi danh sách rỗng có phải hành vi mong muốn, hay nên chỉ seed một lần cho user mới?

</requirement>

<tone>Ngắn. Category cố ý chỉ có tên — thêm màu/icon vào đây là chồng chéo với Habit/Task.</tone>
