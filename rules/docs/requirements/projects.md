# Projects — gom task về một mục tiêu, xong hết thì nhận thưởng

<role>Fullstack engineer + product designer cho gamified personal dashboard</role>

<context>
Task là đơn vị rời rạc. Project là tầng gom: một "đợt việc" nhiều task cùng phục vụ một đích
("Ra mắt landing page", "Dọn nhà cuối năm"). Project **chỉ chứa task** — không habit, không
quest — và **độc lập với Goal** (không link, không gộp). Hoàn thành project trả XP/coins do
user tự đặt lúc tạo.
</context>

<task>
Mô tả model, API, trang `/projects` + `/projects/[id]` và panel dashboard như đang chạy.
</task>

<requirement>

## Dữ liệu — `src/server/models/project.model.ts`

| Field                   | Kiểu                              | Ghi chú                                          |
| ----------------------- | --------------------------------- | ------------------------------------------------ |
| `name`                  | string ≤100, bắt buộc             |                                                  |
| `description`           | string ≤500                       |                                                  |
| `color`                 | `TaskColor` (7 màu)               |                                                  |
| `icon`                  | string, bắt buộc                  | Chọn bằng `IconPickerSheet`                      |
| `status`                | `active \| completed \| archived` | Mặc định `active`                                |
| `priority`              | `high \| medium \| low`           | Mặc định `medium`                                |
| `startDate`, `deadline` | Date?                             | API nhận ISO hoặc `YYYY-MM-DD`; trả `YYYY-MM-DD` |
| `xp`, `coins`           | int ≥0                            | Thưởng khi complete                              |
| `completedDate`         | Date?                             |                                                  |
| `active`                | boolean                           | `false` = đã archive/xoá                         |

Task có `projectId?` (ref `Project`, index `{ userId, projectId }`); một task thuộc tối đa một
project, không có `projectId` = task độc lập. Task API nhận `projectId` (nullable).

**`progress` không lưu** — serializer tính `done / total` trên task con `active` (0 khi chưa có
task), kèm `doneTasks`, `totalTasks`. Lưu thì phải đồng bộ mỗi lần task đổi status ở bất kỳ đâu.

## API

| Method   | Endpoint                        | Hành vi                                                                                   |
| -------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| `GET`    | `/api/v1/projects?status=`      | Project `active: true` của user (lọc thêm theo status), mới nhất trước                    |
| `POST`   | `/api/v1/projects`              | Tạo                                                                                       |
| `GET`    | `/api/v1/projects/:id`          | Chi tiết + `tasks[]` (task con active)                                                    |
| `PUT`    | `/api/v1/projects/:id`          | Sửa field; `description/startDate/deadline` nhận `null` để xoá                            |
| `PATCH`  | `/api/v1/projects/:id/archive`  | `status='archived'`, `active=false`; ẩn **mọi** task con và xoá `ScheduleBlock` của chúng |
| `POST`   | `/api/v1/projects/:id/complete` | Nhận thưởng — luật dưới                                                                   |
| `DELETE` | `/api/v1/projects/:id`          | Như archive nhưng **không** xoá ScheduleBlock                                             |

**Complete:** 409 nếu đã completed; 400 nếu chưa có task hoặc còn task chưa `done`. Đổi status
bằng `findOneAndUpdate({ status: { $ne: 'completed' } })` nguyên tử — double-submit chỉ một
request thắng, nên thưởng không bị cộng hai lần. Sau đó `$inc` `xp`/`coins` vào `UserProfile` và
tạo notification `reward` "🚀 Project Complete — name +X XP, +Y coins".

**Không tự complete khi progress = 1** — user phải bấm Complete: tick nhầm task cuối không được
tự động phát thưởng không rút lại được.

## Trang danh sách — `ProjectsList.tsx`

- Tab lọc **Active** (mặc định) / **Completed** / **All**; nút "＋ New Project" mở `ProjectFormModal`.
- Dưới `sm` header xếp dọc: tiêu đề → tab lọc full-width → nút New full-width. Bản `flex-wrap`
  cũ để title co về 0 nên h1 tràn xuống đè lên tab.
- `ProjectCard`: icon, tên, badge priority, thanh progress theo `color`, `done/total`, thưởng,
  deadline. Completed: viền gold + ✓. Quá deadline mà chưa xong: accent đỏ.

## Trang chi tiết — `ProjectDetail.tsx`

- **Header**: tên, progress `done/total · %`, XP, coins, deadline; nút **Edit** · **Archive**
  (ẩn khi completed, hỏi `confirm` vì kéo theo task) · **✓ Complete** (chỉ bật khi
  `totalTasks > 0 && progress >= 1`, tooltip "Claim reward" / "Finish all tasks first"; lỗi →
  `alert`).
- **Toolbar** (ẩn khi project completed): search, lọc tag, toggle Kanban ↔ List, "Hide empty",
  "+ Add Task" (mở `AddTaskModal` gắn sẵn `projectId`). Bấm task → `EditTaskModal`.
- **Kanban** (`ProjectTaskBoard`): cột `To Do · In Progress · Pending · Waiting · Done`, kéo-thả
  đổi status rồi refetch project. Tên task wrap 2 dòng (`line-clamp-2`) trước khi cắt.
- **Hide empty columns**: ẩn cột không có task (sau khi lọc). Nếu không còn task nào thì vẫn hiện
  đủ cột — một board trống trơn trông như lỗi chứ không như "chưa có gì".
- **List** (`ProjectTaskList`): checkbox toggle done; rỗng thì "No tasks yet." hoặc "No tasks match
  your filters." khi đang lọc.
- **Search & tag filter** (client-side, `project.tasks` đã load đủ): substring không phân biệt hoa
  thường trên `name` + `note`; dropdown tag **chỉ liệt kê category mà task của project đang dùng**
  — liệt kê cả DB thì đa số lựa chọn ra kết quả rỗng. Lọc áp cho cả Kanban lẫn List; **không**
  đổi progress ở header.
- `projectViewMode` và `hideEmptyKanbanColumns` ở `src/stores/ui.store.ts` (devtools, không
  persist — reload về Kanban, không ẩn).

## Form — `ProjectFormModal.tsx`

Name · Description · Icon (`IconPickerSheet`) · Color · Priority · **Deadline (optional)** dùng
`@/components/ui/DatePicker` có nút clear — không dùng date input native để đồng bộ giao diện ·
XP Reward · Coin Reward. Form không có field `startDate`.

## Dashboard — `ProjectsPanel.tsx`

Cột phải dashboard, liệt kê project `active` kèm progress và `done/total tasks`, mỗi dòng link
tới `/projects/[id]`; rỗng → "No active projects."

## Edge cases

- Archive/xoá ẩn cả task đã `done`; khôi phục project không có (không có route unarchive).
- `$inc` XP phía server không xét level-up và có thể bị dashboard đè — xem `character.md`.

## Câu hỏi mở

- `DELETE` có nên xoá ScheduleBlock như archive không? Hiện block của task ẩn vẫn còn trên lịch.
- Có cần unarchive / reopen project completed?

</requirement>

<tone>Concise, technical. Project là lớp gom task — giữ nhẹ.</tone>
