# Quests — thử thách gói gọn trong một ngày

<role>Fullstack engineer giữ entity Quest và các chỗ hiển thị nó trên lịch</role>

<context>
Quest là thử thách gamified gắn với **một ngày** (`dueDate`), thưởng theo độ khó. Khác Task
(có status, có thể kéo nhiều ngày, có session — xem [tasks](./tasks.md)). Quest được đọc ở bốn chỗ:
schedule engine (`src/server/services/schedule-engine.ts`), adapter day view
(`questToUITask` trong `src/features/tasks/data/adapters.ts`), mapping riêng của week view
(`WeekView.tsx`) và penalty flow. Thay đổi field nào cũng phải tới đủ cả bốn.
</context>

<task>
Mô tả model, API, luồng tạo / hoàn thành / dời / xoá quest và daily rollover như đang chạy.
</task>

<requirement>

## Dữ liệu — `Quest` (`src/server/models/quest.model.ts`)

| Field         | Kiểu                   | Ghi chú                                                 |
| ------------- | ---------------------- | ------------------------------------------------------- |
| `title`       | string ≤100, bắt buộc  |                                                         |
| `desc`        | string ≤300            | Default `"Complete this quest"`                         |
| `type`        | `QuestType`            | `focus·habit·reflect·admin·create·health·break`         |
| `difficulty`  | `S·A·B·C·D`            |                                                         |
| `xp`, `coins` | number                 | **Tính sẵn lúc tạo** từ `XP_MAP`/`COIN_MAP`, lưu vào DB |
| `done`        | boolean, default false | `completedAt` set/clear theo `done`                     |
| `tags`        | string[]               | Default `[type]`                                        |
| `dueDate`     | Date, bắt buộc         | Default = lúc tạo                                       |
| `dueTime`     | `"HH:MM"`?             | **Mới** — vắng = "trong ngày, không giờ cụ thể"         |

| Difficulty | S   | A   | B   | C   | D   |
| ---------- | --- | --- | --- | --- | --- |
| XP         | 150 | 120 | 90  | 60  | 50  |
| Coins      | 40  | 30  | 25  | 15  | 12  |

**Vì sao `dueTime` là field riêng, không nhét giờ vào `dueDate`:** row cũ nằm ở UTC midnight =
07:00 giờ VN, nên không có cách kiểm tra midnight nào (local hay UTC) phân biệt được "trong ngày"
với "đúng 07:00" mà không đọc sai toàn bộ quest cũ. Chuỗi `HH:MM` riêng cũng là cách habit và
schedule block đang mang giờ. Khi có `dueTime`, nó quyết định cả giờ hiển thị lẫn slot trong day
view (quest buổi chiều không còn bị xếp vào "deep work"), và schedule engine dùng nó làm
`startTime`/`endTime` của calendar item.

## API

| Method   | Endpoint                                 | Ghi chú                                                   |
| -------- | ---------------------------------------- | --------------------------------------------------------- |
| `GET`    | `/api/v1/quests?date=YYYY-MM-DD&dateTo=` | Lọc `dueDate` trong [date, dateTo]; vắng `date` = hôm nay |
| `POST`   | `/api/v1/quests`                         | `dueTime` optional, regex `HH:MM` 24h                     |
| `PATCH`  | `/api/v1/quests/:id`                     | **Chỉ** `done` và/hoặc `dueDate` (`YYYY-MM-DD`)           |
| `DELETE` | `/api/v1/quests/:id`                     | **Hard delete** + xoá ScheduleBlock của quest             |
| `POST`   | `/api/v1/quests/rollover`                | Dời quest chưa xong có `dueDate < hôm nay` → hôm nay      |

Không có cách sửa title/desc/type/difficulty/dueTime sau khi tạo — vì vậy **xoá** là lối duy nhất
để sửa một lần gõ nhầm.

**Vì sao xoá cứng:** Quest không có cờ `active` như Task/Event, và bốn chỗ đọc quest đều phải học
cách lọc nếu xoá mềm — không đáng cho việc gỡ một lỗi gõ. Block trỏ tới quest bị xoá cùng: mồ côi
thì `buildCalendar` không vẽ nhưng vẫn ăn capacity của ngày.

## UI

- **Tạo** — `AddQuestModal` (`src/features/dashboard/components/schedule/`): title, desc, type
  (default `focus`), difficulty (default `B`), ngày (default hôm nay), giờ (optional, trống =
  hành vi cũ). Mở từ nút Forge Quest ở `/tasks` và menu tạo của dashboard schedule.
  `useCreateQuest` invalidate `quests` + `calendar` — trước đây thiếu nên quest mới vô hình đến
  khi reload (day/week view đọc query cache, không đọc mảng local).
- **Card trong day view** — `QuestCard.tsx`, style giống app mobile: nền tint theo màu category,
  icon dẫn đầu hàng, dòng `giờ · thời lượng` phía trên title đậm, vòng tick bên phải. Rank,
  thưởng và các action nằm trong panel mở rộng; cột giờ bên cạnh card đã bỏ.
- **Hoàn thành** (dashboard day panel, qua `useScheduleDayTasks.onToggleDone`): tick lạc quan →
  `PATCH { done }` → thưởng `quest.xp`/`quest.coins` qua `onReward`. Bỏ tick PATCH `done:false`,
  **không thu hồi** thưởng (cố ý).
- **Week view**: quest kéo-thả sang ngày khác → `PATCH { dueDate }` (`useMoveQuest`); bấm vào
  quest → modal xác nhận xoá.
- **Xoá** có modal xác nhận ở week view, dashboard day panel và quick-action của `QuestCard`
  (desktop: hàng hover; mobile: menu "⋯", vì hover không có trên cảm ứng).

## Daily rollover

`useDailyInit` (dashboard): nếu `localStorage['aetheria_quest_rollover_date'] !== hôm nay` →
`POST /quests/rollover`; thành công mới ghi key. Nếu có quest bị dời, danh sách được chuyển cho
penalty flow ([penalty](./penalty.md)). Route idempotent: gọi lại không còn gì để dời.

## Quest, habit, task trên cùng một danh sách ngày

| Loại  | Nguồn            | Done khi                                                     |
| ----- | ---------------- | ------------------------------------------------------------ |
| Quest | Quest collection | `done === true`                                              |
| Habit | Habit + HabitLog | HabitLog ngày đó `done`                                      |
| Task  | Task (+TaskLog)  | `status === 'done'` (single-day) hoặc có TaskLog (multi-day) |

## Open questions

- `ConfirmQuestModal` + "Don't ask again today" (`aetheria_skip_quest_confirm`) và thưởng **+5 gems
  cho quest S** chỉ chạy qua `handleToggleQuest` của `useQuestOrchestration`, nhưng
  `MainDashboard` không gọi hàm đó. Luồng đang dùng (day panel) không hỏi xác nhận và không cho
  gems. Bỏ hẳn luồng cũ, hay nối lại?
- `startOfDay` của route quests dùng giờ local của server, còn Task dùng UTC midnight. Server chạy
  ở UTC thì không sao — có cần thống nhất không?

</requirement>
