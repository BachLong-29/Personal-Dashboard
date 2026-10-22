# WeekStats Panel — dải thống kê tuần (đang không được mount)

<role>Engineer quyết định số phận một component UI đã tách khỏi màn đang chạy</role>

<context>
`WeekStats` là dải 5 thẻ thống kê đặt trên grid 7 cột của `TaskWeekView`
(`src/features/tasks/components/week/`). Từ commit `5b8026c` (2026-06-24) trang Tasks thôi render
`TaskWeekView`; Week View thật giờ là `src/features/dashboard/components/schedule/WeekView.tsx`
([week-view-rescheduling](./week-view-rescheduling.md)) và **không** có dải thống kê.

Nghĩa là `WeekStats.tsx` hiện **không xuất hiện ở đâu trên app** — chỉ `TaskWeekView` (cũng không
được mount) import nó.
</context>

<task>
Ghi lại component như đang có, để quyết định nối lại hay xoá — không mô tả nó như tính năng sống.
</task>

<requirement>

## Component — `src/features/tasks/components/week/WeekStats.tsx`

Prop duy nhất `tasks: UITask[]`.

| Stat           | Giá trị                  | Màu    | Nguồn thật?            |
| -------------- | ------------------------ | ------ | ---------------------- |
| Quests Cleared | `done/total`             | gold   | ✅ đếm từ `tasks` prop |
| XP Earned      | `+Σ xp` item done        | violet | ✅ từ `tasks` prop     |
| Combo          | `×3`, sub "active"       | cyan   | ❌ hardcode            |
| Streak         | `14d`, sub "best 21d"    | rose   | ❌ hardcode            |
| Focus Hours    | `16.5h`, sub "this week" | mint   | ❌ hardcode            |

Label viết cứng tiếng Anh, không qua i18n.

## Layout

- **≥ md:** 5 `StatCard` một hàng — label uppercase nhỏ, số lớn `font-title` theo màu stat,
  sub-label tuỳ chọn, border-top 2px màu stat.
- **< md:** hàng 1 là 2 `StatCard` (Quests Cleared + XP Earned), hàng 2 là 3 `StatPill` gọn
  (border-left thay border-top).

## Số thật đã có ở chỗ khác

Ba stat hardcode giờ đã có dữ liệu thật, nhưng ở `AnalyticsPanel`
(`src/features/dashboard/components/analytics/AnalyticsPanel.tsx`), không ở đây:

| Stat ở WeekStats | Tương đương thật                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Streak           | thẻ **Day Streak** = `stats.character.streak` (UserProfile)                                                                |
| Focus Hours      | thẻ **Focus Time** = `stats.schedule.completedMinutes` (7 ngày gần nhất — [schedule-statistics](./schedule-statistics.md)) |
| Combo            | không có — chưa có định nghĩa/nguồn                                                                                        |

## Nếu nối lại

Không mount như cũ — sẽ in số giả lên màn đang chạy. Tối thiểu cần:

1. Streak và Focus Hours lấy từ `useStats()` thay vì hardcode.
2. Bỏ hoặc định nghĩa Combo (ví dụ: số ngày liên tiếp trong tuần có ≥1 item done).
3. Focus Hours theo **tuần đang xem** sẽ cần API nhận range — `/stats` hiện cố định 7 ngày gần
   nhất.
4. Chuỗi qua next-intl (en/vi/th).

## Open questions

- Xoá `WeekStats` cùng `TaskWeekView`, `WeekColumn`, `WeekDropDialog`, `HabitEditScopeDialog`
  (tất cả không được mount), hay nối `WeekStats` lên đầu dashboard `WeekView`?

</requirement>

<tone>Thẳng: đây là code không chạy, ghi đủ để quyết định.</tone>
