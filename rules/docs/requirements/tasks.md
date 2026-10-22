# Tasks — việc phải xong, có thể kéo dài nhiều ngày

<role>Fullstack engineer giữ entity Task và trang `/tasks` (Quest Log)</role>

<context>
Task là việc user **tự làm để xong**: có `status`, có thể quá hạn, có thể nằm backlog. Khác Quest
(thử thách trong một ngày, xem [quests](./quests.md)) và Event (việc xảy đến, không có "done").
Task **không mang giờ** — giờ làm nằm ở các `ScheduleBlock` (session) gắn vào task, xem
[block-driven-scheduling](./block-driven-scheduling.md) và [tasks-sessions](./tasks-sessions.md).
</context>

<task>
Mô tả model, API và trang `/tasks` đúng như đang chạy. Code nguồn: `src/server/models/task.model.ts`,
`src/app/api/v1/tasks/`, `src/app/api/v1/task-logs/route.ts`, `src/features/tasks/`.
</task>

<requirement>

## Dữ liệu — `Task`

| Field          | Kiểu                  | Ghi chú                                                                               |
| -------------- | --------------------- | ------------------------------------------------------------------------------------- |
| `name`         | string ≤100, bắt buộc |                                                                                       |
| `note`         | string ≤500           | Textarea 5 dòng; xuống dòng được giữ khi hiển thị                                     |
| `tagId`        | string, bắt buộc      | Category dùng chung với habit/event                                                   |
| `color`        | `TaskColor`           | `gold·mint·violet·cyan·rose·amber·blue`                                               |
| `icon`         | string, bắt buộc      | Emoji, key của icon registry, **hoặc URL ảnh upload**                                 |
| `status`       | `TaskStatus`          | `todo` (default) · `in_progress` · `pending` · `waiting` · `done`                     |
| `duration`     | int phút 1..1440      | Ước lượng, không phải giờ đặt lịch                                                    |
| `startDate`    | Date?                 | **Vắng = backlog** (task trôi nổi, chưa có ngày)                                      |
| `endDate`      | Date?                 | Vắng = single-day                                                                     |
| `habitRef`     | ObjectId?             | Task thay thế một lần xuất hiện của habit ([reschedule-habit](./reschedule-habit.md)) |
| `projectId`    | ObjectId?             | Thuộc project ([projects](./projects.md))                                             |
| `deferReason`  | string ≤200           | Xem [task-defer](./task-defer.md)                                                     |
| `attachments`  | string[] ≤3           | Xem [task-attachments](./task-attachments.md)                                         |
| `dependencies` | ObjectId[]            | Xem [task-dependencies](./task-dependencies.md)                                       |
| `active`       | boolean, default true | Soft delete                                                                           |

Không còn field `startTime` trên Task (spec cũ ghi sai): giờ hiển thị lấy từ block sớm nhất của
task trong ngày. Mọi ngày lưu ở **UTC midnight** (`new Date("YYYY-MM-DD")`), client gửi chuỗi
ngày theo giờ local (`toLocalDate`) để tránh lệch một ngày ở UTC+7.

## Single-day vs multi-day

- **Single-day** (`endDate` vắng hoặc = `startDate`): done = `status === 'done'`. Tick → PATCH
  `status: done|todo`.
- **Multi-day** (`endDate > startDate`): "xong hôm nay" = có `TaskLog` cho ngày đó. Tick →
  `POST /task-logs` (toggle); log đầu tiên khi task đang `todo` tự đặt `status: in_progress`.
  Status và log là hai khái niệm tách biệt — log không bao giờ tự đặt `done`.
- Thưởng mỗi lần tick xong: **60 XP + 15 coins** (`TASK_XP`/`TASK_COINS`), multi-day thì mỗi ngày.
  Bỏ tick **không thu hồi** thưởng.

## API

| Method   | Endpoint                    | Ghi chú                                                                        |
| -------- | --------------------------- | ------------------------------------------------------------------------------ |
| `GET`    | `/api/v1/tasks`             | 4 mode, xem dưới; chỉ trả task `active`, kèm `progress`                        |
| `GET`    | `/api/v1/tasks/:id`         | Trả cả task đã xoá mềm (để mở từ link cũ)                                      |
| `POST`   | `/api/v1/tasks`             | `startDate`/`endDate` optional; `status` không nhận khi tạo                    |
| `PATCH`  | `/api/v1/tasks/:id`         | `null` = `$unset` (startDate, endDate, duration, note, projectId, deferReason) |
| `DELETE` | `/api/v1/tasks/:id`         | `active:false` **và xoá mọi ScheduleBlock** của task                           |
| `GET`    | `/api/v1/task-logs?date=`   | Log của một ngày                                                               |
| `POST`   | `/api/v1/task-logs`         | Toggle: có thì xoá, chưa có thì tạo (unique user+task+date)                    |
| `GET`    | `/api/v1/tasks/suggestions` | [task-suggestion](./task-suggestion.md)                                        |

**Các mode của `GET /tasks`** (xét theo thứ tự):

1. `projectId` → mọi task của project, bỏ qua lọc ngày, sort `createdAt` asc.
2. **Có `offset`** (kể cả `0`) → **phân trang server**: `skip/limit` (default 20, max 100), kết hợp
   được `q` (regex tên, không phân biệt hoa thường), `tagId`, `start`/`end`; `sort` =
   `startDate` (default) · `createdAt` · `-createdAt`. Response kèm `meta` (`total`, `page`,
   `totalPages`, `hasNextPage`, `hasPrevPage`). Vì sao opt-in bằng `offset`: mọi caller cũ không
   gửi `offset` nên không bị ảnh hưởng.
3. `q`, hoặc `limit` mà không có khoảng ngày → search/recent, sort `createdAt` desc, default 10.
4. Còn lại → lọc khoảng ngày theo **overlap** `[startDate, endDate] ∩ [start, end]`.

## Trang `/tasks`

`src/app/[locale]/(protected)/tasks/page.tsx` → `TaskManagement`.

- **Chỉ còn view All.** Day view đang **tạm ẩn** (comment trong `VIEW_META` của `PageHeader.tsx`,
  không xoá, để dễ bật lại); khi chỉ còn một view thì nút chuyển view không render.
  `TaskDayView` vẫn chạy trong day panel của dashboard. `TaskWeekView`/`TaskMonthView` là code chết.
- **`?q=` mở trang đã search sẵn** — dùng bởi link "đã lưu task" của trợ lý AI
  (`features/assistant/utils/target-links.ts`). Giá trị chỉ seed `useState` một lần lúc mount.
- All view dùng `useTasksPaged` (`offset/limit=20/q/tagId`), không dùng ledger của day view. Đổi
  search hoặc category → về trang 1 (reset ngay trong render, không thêm effect). Giữ dữ liệu
  trang cũ khi đang tải trang mới (`placeholderData`).
- Sort (deadline · xp · priority · title) và lọc status trong `TaskAllView` chạy **client-side
  trên đúng trang 20 task đang tải**, không phải toàn bộ danh sách. UI chưa gửi param `sort`.
- Footer phân trang: "from–to / total" + Prev/Next; xoá task có modal xác nhận.
- Header: chip category (5 cái + "More"), ô search, nút Forge Quest và Add Task.

## Form tạo / sửa — `TaskForm.tsx`

- **Icon** mở `IconPickerSheet` ([icon-picker](./icon-picker.md): quest artwork, emoji, ảnh upload qua `useIconUpload` →
  `/api/v1/upload/attachment`, thư viện upload theo user). Default `📄` nên tạo task không bắt buộc
  chọn icon. Icon là ảnh upload thì hiện gợi ý "keep it simple" vì nó được vẽ ở cỡ icon.
- **Category** là `Select` **searchable + selectedFirst**, kèm "+ NEW" tạo category inline. Không
  chọn thì tự lấy category tên `task`, không có thì category đầu tiên. Đổi từ chip sang dropdown
  vì danh sách dài ra, ba hàng chip đẩy phần còn lại của form khỏi màn hình.
- **Status** chỉ hiện ở chế độ edit. Đổi `startDate` lớn hơn `endDate` thì `endDate` tự kéo theo.
- `canSave` = có tên + icon + category + `endDate >= startDate`. Enter ở ô tên = submit.
- Sau khi lưu có thể bật Session Planner / prompt dời session — xem [tasks-sessions](./tasks-sessions.md).

## Edge cases

| Case                             | Hành vi hiện tại                                            |
| -------------------------------- | ----------------------------------------------------------- |
| `POST` với `endDate < startDate` | Trả **200 với `data: null`** và message lỗi, không tạo task |
| Backlog task trong All view      | `day = NaN` → sort "deadline" không xếp được nó ổn định     |
| Task trong day view / dashboard  | Chỉ hiện ở ngày **có block** (`requireBlock: true`)         |
| Mở task từ Global Search         | Mở `EditTaskModal` tại chỗ, không điều hướng                |

</requirement>
