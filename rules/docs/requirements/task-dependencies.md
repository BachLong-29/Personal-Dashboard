# Task Dependencies — task B chỉ làm được khi task A xong

<role>Fullstack engineer giữ quan hệ phụ thuộc giữa các task</role>

<context>
User cần mô hình hoá thứ tự làm việc. Hiện quan hệ này chỉ là **dữ liệu + gợi ý hiển thị**: không
có gì tự đổi status, server không kiểm tra gì ngoài kiểu dữ liệu.
</context>

<task>
Lưu danh sách task phải xong trước, cho chọn trong form, và dùng nó ở week view và gợi ý backlog.
</task>

<requirement>

## Dữ liệu

`Task.dependencies: ObjectId[]` (ref `Task`), rỗng = không phụ thuộc. Không có endpoint riêng —
gửi cùng task:

- `POST /api/v1/tasks` — `dependencies: string[]`, default `[]`.
- `PATCH /api/v1/tasks/:id` — `dependencies: string[]`, **thay cả mảng**.

Server **không** kiểm tra: id có tồn tại, có cùng user, có vòng lặp. Client cũng không chặn vòng
lặp — chỉ loại chính task đang sửa khỏi danh sách chọn.

## Status `waiting`

`waiting` là một giá trị status bình thường, **user tự đặt** trong dropdown Status (chỉ có ở chế
độ edit). Không có logic tự chuyển `todo → waiting` khi thêm phụ thuộc, cũng không tự chuyển về
`todo` khi các phụ thuộc xong.

## UI — picker trong `TaskForm`

`src/features/tasks/components/shared/TaskForm.tsx`, mục "Dependencies (optional)" cuối form,
có dòng help "This task will be blocked until all selected tasks are done."

- Ô search → `useTaskSearch(q, 10, editingId)`: debounce 300ms, gọi `GET /tasks?limit=10&q=`.
  Ô trống → **10 task tạo gần nhất**. Kết quả lọc bỏ `editingId` ở client.
- Danh sách là các hàng **checkbox** (icon · tên · `startDate`), cao tối đa 130px, cuộn được.
  Không có chip. Kết quả **gồm cả task đã done** — không lọc theo status.
- Task đã chọn nhưng không nằm trong kết quả search hiện tại → dòng "✓ N more selected (search
  to view)", để user biết lựa chọn không bị mất khi đổi từ khoá.

## Nơi phụ thuộc có tác dụng

| Chỗ                                                     | Hành vi                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Dashboard week view (`WeekView.tsx`)                    | Task **`status === 'todo'`** có phụ thuộc chưa done → mờ + 🔒                   |
| Gợi ý backlog ([task-suggestion](./task-suggestion.md)) | Còn phụ thuộc chưa done → **loại hẳn**; mọi phụ thuộc đã done → +10 `unblocked` |
| Clone task (`/tasks`)                                   | Bản sao giữ nguyên `dependencies`                                               |

`isBlocked` ở week view chỉ xét task có trong tập `allTasks` đã tải; một phụ thuộc không có trong
tập đó bị coi là **chưa done** (lock hiện). Task ở status khác `todo` (kể cả `waiting`) **không**
hiện lock.

## Chưa làm

- Tự chuyển status theo trạng thái phụ thuộc.
- Kiểm tra vòng lặp (server hoặc client).
- Liệt kê tên task đang chặn (tooltip / panel), hiển thị "blocked" ở day view, All view.
- Đồ thị chuỗi phụ thuộc.

## Open questions

- Lock ở week view bỏ qua task `waiting` — trạng thái đúng nghĩa "bị chặn". Có nên xét
  `todo | waiting` thay vì chỉ `todo`?
- Picker cho chọn cả task đã done làm phụ thuộc; có nên ẩn chúng?

</requirement>
