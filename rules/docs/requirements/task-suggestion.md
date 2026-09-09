# Task Suggestion from Backlog

<role>Fullstack engineer cho gamified personal dashboard</role>

<context>
Ở Week view của Dashboard, mỗi ngày có nút "pick task" mở `TaskPickerModal`
(`src/features/dashboard/components/schedule/TaskPickerModal.tsx`). Modal chỉ có ô search
theo tên — người dùng phải tự nhớ mình còn task gì chưa xếp lịch. Trong khi đó backlog
(task `active`, chưa `done`, **không có `startDate`**) ngày càng phình ra; AnalyticsPanel
đã cảnh báo "Backlog Alert" khi ≥ 5 task nhưng không có đường dẫn nào để xử lý ngay.
</context>

<task>
Khi mở modal pick task ở Week view (ô search còn trống), hiển thị sẵn danh sách task
backlog được **chấm điểm và xếp hạng** theo mức phù hợp với đúng ngày đang chọn, kèm
chip lý do. Chọn một gợi ý → gán `startDate`/`endDate` = ngày đó (dùng lại `onPick` sẵn có).
Gõ từ khóa → quay về luồng search cũ, không đổi.
</task>

<requirement>

## Định nghĩa backlog

`{ userId, active: true, status != 'done', startDate: { $exists: false } }` — trùng với
định nghĩa đang dùng ở `adapters.ts` và section "07 · Backlog" của AnalyticsPanel.

## Logic chấm điểm (cốt lõi)

Điểm cộng dồn rồi **clamp 0–100**. Tie-break: task nằm backlog lâu hơn xếp trước
(query sort `createdAt` asc, `Array.sort` ổn định).

| Tín hiệu       | Điểm | Điều kiện                                                                                                          |
| -------------- | ---- | ------------------------------------------------------------------------------------------------------------------ |
| `deadline`     | 5–35 | Project có `deadline`: quá hạn/đúng hạn 35 · ≤ `deadlineWarningDays` 32 · ≤ 3d 28 · ≤ 7d 20 · ≤ 14d 12 · còn lại 5 |
| `priority`     | 3–15 | Project `priority`: high 15 · medium 8 · low 3 (chỉ high mới hiện chip)                                            |
| `stale`        | 0–25 | `floor(ageDays / 3) * 5`, cap 25. Chip khi `ageDays >= 7`                                                          |
| `fits`         | 0–20 | `duration <= remainingMinutes` → 20. Không có `duration` → 8 (trung tính, không chip)                              |
| `same_project` | 15   | Cùng `projectId` với task đã có trên ngày đó                                                                       |
| `same_tag`     | 10   | Cùng `tagId` — **chỉ xét khi không khớp `same_project`**                                                           |
| `unblocked`    | 10   | Task có `dependencies` và **tất cả** đã `done`                                                                     |

**Loại khỏi kết quả (không phải trừ điểm):**

- Còn dependency chưa `done` → không actionable, ẩn hẳn (khớp `isBlocked` trong WeekView).
- Đã có `ScheduleBlock` trên đúng ngày đó → task đang hiển thị rồi, tránh gợi ý trùng.

**`remainingMinutes`** = `schedule.dailyCapacityMinutes` (UserSetting, default 600)
− tổng `duration` mọi `ScheduleBlock` trong ngày (cả task lẫn quest)
− tổng `duration` các task có `startDate` rơi vào ngày đó **mà chưa có block** (tránh đếm 2 lần).
Clamp `>= 0`.

**Reasons:** sort theo trọng số giảm dần, cắt còn tối đa **3 chip**.

## API

`GET /api/v1/tasks/suggestions?date=YYYY-MM-DD&limit=<n>` (mới)

- Auth bắt buộc (`getAuthUser`) → chưa đăng nhập trả 401.
- `date` required, regex `^\d{4}-\d{2}-\d{2}$`; `limit` optional (1..20, default 5).
- Đặt ở segment tĩnh `tasks/suggestions` — Next.js ưu tiên hơn `tasks/[id]`.
- Backlog rỗng → trả `[]` sớm, không chạy thêm query nào.
- Response:

```
SuggestionReasonCode =
  'deadline' | 'priority' | 'stale' | 'fits' | 'same_project' | 'same_tag' | 'unblocked'

SuggestionReason { code, label }        // label render thẳng thành chip
TaskSuggestion   { task: Task, score: number, reasons: SuggestionReason[] }

response.data = TaskSuggestion[]        // sort score desc
```

## Ràng buộc kỹ thuật

- **Timezone:** mọi mốc ngày trong DB lưu ở UTC midnight (`new Date("YYYY-MM-DD")`).
  Service phải tính bound bằng UTC, đồng nhất với route `tasks` và `schedule-blocks`.
- **Số query:** 4 query song song (backlog / setting / blocks trong ngày / task trong ngày),
  rồi 1 lượt `Promise.all` nữa cho dependencies + projects. Không query trong vòng lặp.
- Task trả về serialize giống `GET /api/v1/tasks` (không kèm `progress` — backlog chưa có block).

## Client — hook

`useTaskSuggestions(date: string | null, limit = 5)`

- `queryKey: ['tasks', 'suggestions', date, limit]`, `enabled: Boolean(date)`, `staleTime: 60s`.
- Gọi `apiClient` trực tiếp trong hook (khớp `useTaskSearch`, chưa có `endpoints/tasks.ts`).

## Client — TaskPickerModal

- `isBrowsing` = ô search trống sau `trim()`. Chỉ khi `open && isBrowsing` mới truyền
  `dateStr` vào hook (ngược lại truyền `null` → không gọi API).
- Layout: section **"✦ Suggested from backlog"** ở trên, section **"Recent"** ở dưới
  (nhãn "Recent" chỉ hiện khi có gợi ý). Đang gõ → chỉ còn kết quả search như cũ.
- Lọc `excludeIds` cho cả gợi ý; dedupe id đã nằm ở block gợi ý ra khỏi list Recent.
- Mỗi dòng gợi ý: icon · tên · các chip lý do (wrap) · badge score bên phải.
  Viền/nền gold nhạt để tách khỏi dòng Recent.
- `onPick` đổi kiểu tham số sang `Task` của `@/types` (trước đó cast nhầm sang
  `Task` của `features/dashboard/types` — type này bắt buộc `startDate`, backlog thì không có).
  WeekView chỉ dùng `task.id` nên không phải sửa gì.
- Text hardcode tiếng Anh theo đúng idiom sẵn có của file (modal này chưa dùng `next-intl`).
- Responsive: chip `flex-wrap`, vùng list `max-h-[320px] overflow-y-auto`, modal giữ 380px.

## Files

| File                                                             | Thay đổi                     |
| ---------------------------------------------------------------- | ---------------------------- |
| `src/types/task-suggestion.ts` (mới)                             | 3 type ở trên                |
| `src/types/index.ts`                                             | export barrel                |
| `src/server/services/task-suggestion.ts` (mới)                   | `suggestBacklogTasks()`      |
| `src/app/api/v1/tasks/suggestions/route.ts` (mới)                | endpoint GET                 |
| `src/features/dashboard/hooks/useTaskSuggestions.ts` (mới)       | React Query hook             |
| `src/features/dashboard/components/schedule/TaskPickerModal.tsx` | section gợi ý + chip + score |

</requirement>

<tone>Concise, technical. Tái sử dụng modal và luồng onPick sẵn có; scoring thuần in-memory sau vài query song song, không thêm collection hay cron.</tone>
