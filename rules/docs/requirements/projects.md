# Projects

<role>Fullstack engineer + product designer cho gamified personal dashboard</role>

<context>
Task hiện tại là đơn vị rời rạc theo ngày. Project là tầng gom nhóm: một "đợt việc" gồm
nhiều task con cùng phục vụ một mục tiêu (VD: "Ra mắt landing page", "Dọn nhà cuối năm").
Project CHỈ chứa task — không có habit, không có quest. Project độc lập hoàn toàn với Goal
(không link, không gộp). Project chưa tồn tại trong codebase.
</context>

<task>
Xây dựng Project feature: model mới, gắn `projectId` vào Task, API CRUD, trang danh sách
`/projects` và trang chi tiết `/projects/[id]` (toggle Kanban ↔ List). Hoàn thành project
thưởng XP/coins riêng.
</task>

<requirement>

## Model: Project

```
Project {
  userId: ObjectId
  name: string             // max 100, required
  description?: string     // max 500
  color: TaskColor         // reuse TASK_COLORS
  icon: string             // emoji
  status: 'active' | 'completed' | 'archived'   // default 'active'
  priority: 'high' | 'medium' | 'low'           // default 'medium'
  startDate?: Date
  deadline?: Date
  xp: number               // reward khi complete, min 0
  coins: number            // reward khi complete, min 0
  progress: number         // 0..1, DERIVED từ task con (không nhập tay)
  completedDate?: Date
  active: boolean          // soft-delete / archive flag, default true
  createdAt / updatedAt
}
```

## Thay đổi Task Model

```
projectId?: ObjectId   // ref 'Project', optional, indexed
```

- Task không có `projectId` = task độc lập (giữ nguyên hành vi cũ).
- Một task thuộc tối đa 1 project.
- Index: `{ userId: 1, projectId: 1 }`

## Tính progress & auto-complete

- `progress = số task con (status='done') / tổng task con active`. Tổng = 0 → progress = 0.
- Tính server-side khi đọc project hoặc khi task con đổi status.
- Khi mọi task con `done` (progress = 1) → KHÔNG tự complete; hiện nút "Complete Project"
  để user xác nhận nhận thưởng (tránh complete ngoài ý muốn).

## API

- `GET /api/v1/projects` — list project `active` của user, kèm `progress` + `{done, total}`.
- `POST /api/v1/projects` — tạo project.
- `GET /api/v1/projects/[id]` — chi tiết project + danh sách task con (active).
- `PUT /api/v1/projects/[id]` — update name, description, color, icon, priority, deadline, xp, coins.
- `PATCH /api/v1/projects/[id]/archive` — **archive cùng nhau**: set project
  `status='archived'`, `active=false` VÀ set tất cả task con `active=false`.
- `POST /api/v1/projects/[id]/complete` — set `status='completed'` + `completedDate`,
  cộng `xp`/`coins` vào Stats, tạo notification `reward`. Chỉ cho phép khi progress = 1.
- Task API (`POST`/`PATCH /api/v1/tasks`) nhận thêm `projectId` (optional, nullable).

## UI — Routing

```
src/app/[locale]/(protected)/projects/
├── page.tsx          // danh sách project
└── [id]/page.tsx     // chi tiết project
```

Thêm mục "Projects" vào sidebar/nav (protected).

## UI — ProjectsListPage

Grid các ProjectCard:

```
┌──────────────────────────────┐
│ 🚀 Ra mắt Landing  · High    │
│ [========     ] 6/10         │
│ ✦ 200 XP · 50c  · 30/06      │
└──────────────────────────────┘
```

- Progress bar theo `color`. Badge priority. Reward + deadline.
- Project `completed`: border gold + ✓. Quá `deadline` chưa xong: accent đỏ.
- Click card → `/projects/[id]`. Nút "+ New Project" mở modal tạo.

## UI — ProjectDetailPage

- Header: tên, icon, progress bar, reward (xp/coins), deadline, nút Edit / Archive /
  Complete (Complete chỉ enable khi progress = 1).
- **View toggle Kanban ↔ List** (lưu lựa chọn ở ui.store).
  - **Kanban**: cột theo TaskStatus (`todo / in_progress / pending / waiting / done`),
    kéo-thả task đổi status (reuse TaskCard). Cập nhật progress sau mỗi lần đổi.
  - **List**: list task có checkbox toggle done + progress bar tổng.
- Nút "+ Add Task" tạo task với `projectId` gắn sẵn (reuse modal task hiện có).

## Reuse / Types

| File                              | Thay đổi                                                |
| --------------------------------- | ------------------------------------------------------- |
| `src/server/models/task.model.ts` | thêm `projectId?` + index                               |
| `src/types/task.ts`               | `Task.projectId?`, payload `projectId?: string \| null` |
| `src/types/project.ts` (mới)      | `Project`, `ProjectStatus`, `ProjectPriority`, payloads |
| `src/services/endpoints/`         | client `projects.ts`                                    |
| `src/stores/ui.store.ts`          | `projectViewMode: 'kanban' \| 'list'`                   |
| i18n `src/i18n/locales/`          | strings cho projects                                    |

## Notification & Stats

- Complete project → notification type `reward`: "🚀 Project Complete — [name]".
- Cộng `xp`/`coins` vào Stats như các nguồn thưởng khác.

</requirement>

<tone>Concise, technical. Không over-engineer — Project là lớp gom task, giữ nhẹ.</tone>
