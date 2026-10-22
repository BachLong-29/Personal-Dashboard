# AI Task Agent — danh mục tool

<role>Fullstack engineer giữ cho tool của trợ lý đi đúng đường của app</role>

<context>
Trợ lý ([ai-task-agent.md](ai-task-agent.md)) chỉ làm được những gì tool cho phép. Mỗi tool là
một zod schema + description; JSON schema gửi cho model sinh từ zod (`spec()` trong
`src/server/agent/tools.ts`). Tool chia theo domain:

| File             | Read                                             | Write                                                                                                              |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `tools.ts`       | `list_tasks`, `list_categories`, `list_sessions` | `create_task`, `update_task`, `complete_task`, `delete_task`, `create_session`, `update_session`, `delete_session` |
| `habit-tools.ts` | `list_habits`                                    | `create_habit`, `update_habit`, `set_habit_active`, `delete_habit`                                                 |
| `event-tools.ts` | `list_events`                                    | `create_event`, `update_event`, `delete_event`, `cancel_occurrence`, `move_occurrence`                             |
| `note-tools.ts`  | `list_notes`                                     | `create_note`                                                                                                      |
| `plan-tools.ts`  | `list_unscheduled`, `get_free_time`              | `plan_schedule`                                                                                                    |

Cộng `ask_user` (không phải read cũng không phải write — kết thúc lượt).
</context>

<task>
Mỗi write tool phải ghi **giống hệt** route REST tương ứng, để dữ liệu do trợ lý tạo không khác
dữ liệu do form tạo.
</task>

<requirement>

## Luật chung

- Read tool lọc theo `userId`; write tool chỉ **đề xuất** (xem proposal ở spec chính).
- Write trên entity có sẵn **tra entity ngay lúc đề xuất**: card xác nhận ghi đúng tên, và id
  sai quay về model thành lỗi thay vì tới tay user.
- Action thành công trả `target` (task / habit / event / note); action xoá không trả.
- Model được dặn: tra id bằng `list_*` thay vì đoán; nhiều kết quả khớp → hỏi lại.

## Task & session (`tools.ts`)

- `list_tasks { start?, end?, q?, limit≤50 (20) }` — có range thì trả mọi task **có ngày nằm
  trong range** (overlap), nên task nhiều ngày bắt đầu từ trước vẫn hiện.
- `create_task` — category không thuộc user → dùng category đầu tiên; user chưa có category →
  fail "Create a category first.". Màu `gold`, icon `📝` mặc định. Có `startTime` (24h `HH:MM`,
  cần `startDate`) → **book luôn một session** (`ScheduleBlock`, cùng record
  `POST /schedule-blocks` ghi), dài `duration` hoặc 60'. Không có giờ → chỉ tạo task.
  Model được dặn **không bịa giờ** user không nói.
- `update_task` — chỉ đổi field được truyền; `null` xoá `endDate` / `duration` / `note`;
  không set được `done` (đó là `complete_task`). Session sau khi sửa:
  - task **một ngày**: session `planned` bị kéo về `startDate` (và `startTime`/`duration` nếu
    có); chưa có session mà có `startTime` → book một cái. Session `done`/`missed` giữ nguyên
    chỗ đã xảy ra.
  - task **nhiều ngày**: không dời session — kết quả đếm số session giờ nằm ngoài range; sửa
    từng cái bằng `list_sessions` + `create_session`/`update_session`/`delete_session`, các
    tool này giữ session trong range của task.
- `complete_task` — từ chối task nhiều ngày ("complete it from the app"): loại đó tick theo
  ngày qua task log.
- `delete_task` — soft delete như `DELETE /tasks/:id`: `active: false` + xoá `ScheduleBlock`
  của task.

## Habit (`habit-tools.ts`)

- `update_habit` với `schedule` **thay toàn bộ** lịch (prompt dặn giữ lại slot user không bỏ).
- `set_habit_active` — tạm dừng/tiếp tục, giữ lịch sử; habit tạm dừng rời khỏi quest và stats.
  Đề xuất trùng trạng thái hiện tại → lỗi về model.
- `delete_habit` — hard delete như `DELETE /habits/:id`, xoá cả log. Prompt hướng "nghỉ một
  thời gian" sang pause.

## Event (`event-tools.ts`)

Giữ đúng model của app ([event.md](event.md)): một row rule + một row override cho mỗi ngày bị
huỷ/dời.

- `list_events` — có `start`+`end` (phải đi cùng nhau, ≤ 62 ngày) → occurrence đã bung; không
  range → danh sách rule để tìm theo tên. Occurrence bị dời báo `eventId` = **id series**
  (cái mà mọi lệnh sửa sau đó nhắm tới), kèm `moved: true`.
- `create_event` — `recurrence { freq: weekly|monthly, days | dayOfMonth, interval }`; không
  `startTime` = cả ngày; `busy` mặc định true.
- `update_event` / `delete_event` tác động **cả series**. `recurrence: null` biến thành
  một lần và retire override; xoá cũng retire override. Gán giờ cho event cả ngày → thành event
  có giờ (mặc định 60').
- `cancel_occurrence` / `move_occurrence` nhận id series + **ngày occurrence đang nằm hiện
  tại**; kiểm tra có occurrence thật ở đó, tra ngày gốc mà rule sinh ra (occurrence đã dời
  được override dưới ngày cũ), rồi ghi qua `applyEventOverride`
  (`src/server/services/event-override.ts`), dùng chung với `POST /events/:id/override`.
  Event không lặp → lỗi, hướng sang `update_event`/`delete_event`.

## Note (`note-tools.ts`)

- `list_notes { status: open (mặc định) | done | all, q?, limit≤100 (30) }` — "open" = không
  có `archivedAt`.
- `create_note { content≤2000 }` — lưu **nguyên lời user**, không viết lại/tóm tắt. Việc cần
  làm vào một ngày là task, không phải note. Card hiện 60 ký tự đầu.
- Sửa, xoá, đánh dấu đã xử lý **không có** — đúng quyết định ở [quick-notes.md](quick-notes.md).
- Hệ quả: note giờ **được gửi tới LLM** khi model gọi `list_notes`, không chỉ khi user gõ.

## Lên kế hoạch (`plan-tools.ts` + `plan-core.ts`)

`plan_schedule { from, to, taskIds?≤20, dayStart?, dayEnd?, breakMinutes?≤60 }` xếp task vào
giờ trống và đề xuất **mọi vị trí cùng lúc** dưới dạng action thường: task một ngày hoặc chưa
có ngày → `update_task` (`startDate` + `startTime` + `duration`, `endDate: null`); task nhiều
ngày → `create_session` trong range. Summary dạng `Plan "X" -> 2026-10-23 09:00 (60 min)`.

- **Xếp tất định** (`plan-core.ts`, thuần, không DB): gấp nhất trước (quá hạn → endDate sớm →
  startDate → dài nhất). Cùng lịch + cùng task luôn ra cùng kế hoạch.
- **Ngày nào**: task có startDate riêng hoặc quá hạn → ngày sớm nhất được phép. Task chưa ngày
  hoặc nhiều ngày → ngày **ít tải nhất** (hoà thì sớm hơn) — để tuần được rải đều, không dồn
  thứ Hai.
- **Busy** lấy từ `buildCalendar`: session, habit, quest, event có giờ; event `busy: false`
  bỏ qua. Mỗi block nới thêm `breakMinutes` (15).
- **Luật**: bắt đầu tròn 15'; giờ làm 09:00–18:00; hôm nay không xếp trước "bây giờ"; không
  kéo task sớm hơn startDate của nó; task nhiều ngày ở trong range.
- **Trần**: tối đa 240' mới mỗi ngày, 480' tổng; window ≤ 14 ngày, bỏ ngày đã qua.
- **Task nào**: `taskIds` nếu có, không thì mọi task mở chưa có session `planned` (tối đa 30).
  Không vừa → `unplaced` kèm lý do, không bao giờ nhét ép. Một vị trí mà `proposeAction` từ
  chối cũng thành `unplaced`.
- Kết quả kèm `days` (`bookedMinutes`, `addedMinutes`) để trợ lý nói được ngày trống là do đã
  kín hay do hết task. Vị trí tính lúc đề xuất — lịch có thể đổi trước khi user bấm.
- `get_free_time` là góc nhìn read-only của cùng các khoảng trống (lọc khoảng ≥ 30' mặc định).
  `list_unscheduled` trả task mở chưa có session trong **một** lần gọi.
- `plan_schedule` không bao giờ được `executeAction` chạy trực tiếp — chỉ các action nó sinh ra.

## Thêm một tool

1. Thêm zod schema + description vào map `*_READ_TOOLS` / `*_WRITE_TOOLS` của domain (hoặc
   `READ_TOOLS`/`WRITE_TOOLS` trong `tools.ts`); đăng ký vào `TOOL_SPECS`, `isReadTool` /
   `isWriteTool` nếu là domain mới.
2. Write tool: thêm tên vào `AgentPendingAction['tool']` (`src/types/agent.ts`), nhánh propose
   (summary) và nhánh execute trả `target` khi có thứ để mở.
3. Viết một dòng hướng dẫn trong `systemPrompt` (`run-agent.ts`) nếu model cần biết khi nào dùng.

</requirement>
