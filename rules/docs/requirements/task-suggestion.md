# Task Suggestion — gợi ý task backlog khi chọn task cho một ngày

<role>Fullstack engineer cho gamified personal dashboard</role>

<context>
Ở week view của dashboard, mỗi ngày có nút "pick task" mở `TaskPickerModal`
(`src/features/dashboard/components/schedule/TaskPickerModal.tsx`). Trước đây modal chỉ có ô
search theo tên — user phải tự nhớ mình còn task gì chưa xếp. Backlog (task chưa có `startDate`)
thì cứ phình ra; AnalyticsPanel cảnh báo "Backlog Alert" khi ≥5 task nhưng không có đường xử lý.
</context>

<task>
Khi mở picker với ô search trống, hiện sẵn task backlog đã **chấm điểm và xếp hạng** theo mức hợp
với đúng ngày đang chọn, kèm chip lý do. Chọn một gợi ý → `PATCH { startDate: day, endDate: day }`
(dùng chung `onPick`). Gõ từ khoá → quay về luồng search cũ.
</task>

<requirement>

## Backlog

`{ userId, active: true, status != 'done', startDate: { $exists: false } }`, sort `createdAt` asc.

## Chấm điểm — `src/server/services/task-suggestion.ts`

Cộng dồn rồi **clamp ≤100**, làm tròn. Sort score desc; `Array.sort` ổn định nên hoà điểm thì task
nằm backlog lâu hơn đứng trước.

| Tín hiệu       | Điểm | Điều kiện                                                                                          | Chip                     |
| -------------- | ---- | -------------------------------------------------------------------------------------------------- | ------------------------ |
| `deadline`     | 5–35 | Project có `deadline`: ≤0 ngày 35 · ≤`deadlineWarningDays` 32 · ≤3 28 · ≤7 20 · ≤14 12 · còn lại 5 | **Luôn** khi có deadline |
| `priority`     | 3–15 | Task thuộc project: high 15 · medium 8 · low 3                                                     | Chỉ `high`               |
| `stale`        | 0–25 | `floor(ageDays / 3) * 5`, cap 25 (`ageDays` từ `createdAt`)                                        | `ageDays >= 7`           |
| `fits`         | 8/20 | Không có `duration` → 8 (trung tính); `duration <= remainingMinutes` → 20                          | Chỉ khi 20               |
| `same_project` | 15   | Cùng `projectId` với một task đã có trên ngày đó                                                   | Có                       |
| `same_tag`     | 10   | Cùng `tagId` — **chỉ xét khi không khớp `same_project`**                                           | Có                       |
| `unblocked`    | 10   | Có `dependencies` và **tất cả** đã `done`                                                          | Có                       |

Chip sort theo trọng số giảm dần, cắt còn **tối đa 3**. Nhãn chip là tiếng Anh từ server
(`Deadline in 3d`, `In backlog 12d`, `Fits 90m left`…) và render thẳng.

**Loại khỏi kết quả (không phải trừ điểm):**

- Còn dependency chưa `done` → không actionable.
- Đã có `ScheduleBlock` trên đúng ngày đó (backlog task bị kéo vào ngày mà không có ngày) →
  đang hiện rồi, gợi ý nữa là trùng.

## `remainingMinutes`

```
dailyCapacityMinutes (UserSetting.schedule, default 600)
 − Σ duration mọi ScheduleBlock trong ngày (task + quest)
 − Σ duration task có ngày rơi vào hôm đó mà CHƯA có block   // tránh đếm hai lần
 − Σ duration event busy, không all-day trong ngày            // mới, từ khi có Event
→ clamp ≥ 0
```

Vì sao trừ event: họp, lớp học không phải task nhưng ăn giờ thật; trước khi có
[event](./event.md) scorer tính như thể ngày họp 4 tiếng vẫn trống, nên `fits` chấm sai.
Event all-day hoặc không `busy` nằm trên lịch mà không chiếm giờ.

## API — `GET /api/v1/tasks/suggestions?date=YYYY-MM-DD&limit=n`

- Cần auth → 401. `date` bắt buộc, regex `^\d{4}-\d{2}-\d{2}$`; `limit` 1..20, default 5.
- Segment tĩnh `tasks/suggestions` được Next.js ưu tiên hơn `tasks/[id]`.
- Backlog rỗng → trả `[]` sớm.
- Query: **5 truy vấn song song** (backlog · setting · block trong ngày · task trong ngày ·
  `expandEvents`), rồi một `Promise.all` cho dependencies + projects. Không query trong vòng lặp.
- Mọi mốc ngày tính theo UTC midnight, khớp route `tasks` và `schedule-blocks`.

```
SuggestionReasonCode = 'deadline'|'priority'|'stale'|'fits'|'same_project'|'same_tag'|'unblocked'
SuggestionReason { code, label }
TaskSuggestion   { task: Task, score: number, reasons: SuggestionReason[] }   // src/types/task-suggestion.ts
```

Task serialize giống `GET /tasks` nhưng **không** kèm `progress` (backlog chưa có block).

## Client

**Hook** `useTaskSuggestions(date | null, limit = 5)` (`src/features/dashboard/hooks/`):
`queryKey ['tasks','suggestions',date,limit]`, `enabled: Boolean(date)`, `staleTime 60s`.

**`TaskPickerModal`** (rộng 380px):

- `isBrowsing` = ô search trống sau `trim()`. Chỉ khi `open && isBrowsing` mới truyền `dateStr`
  vào hook; ngược lại `null` → không gọi API.
- Section **"✦ Suggested from backlog"** ở trên; nhãn **"Recent"** chỉ hiện khi có gợi ý và còn
  kết quả recent. Recent = `useTaskSearch(query, 20)`, lọc `active`, chưa done.
- Lọc `excludeIds` (task đã có trên ngày) cho cả hai list; bỏ khỏi Recent những id đã ở block gợi ý.
- Dòng gợi ý: icon · tên · chip lý do (`flex-wrap`) · badge score bên phải; viền/nền gold nhạt.
- Text tiếng Anh hardcode, đúng idiom sẵn có của file (modal chưa dùng `next-intl`).

## Open questions

- Chip `deadline` hiện cả khi deadline còn xa (5 điểm) — có muốn chỉ hiện khi gần hạn?
- Chọn gợi ý chỉ đặt ngày, không tạo session; day view (`requireBlock`) sẽ không hiện task đó
  cho tới khi có block. Có nên mở Session Planner sau khi pick?

</requirement>

<tone>Concise, technical. Scoring thuần in-memory sau vài query song song, không thêm collection hay cron.</tone>
