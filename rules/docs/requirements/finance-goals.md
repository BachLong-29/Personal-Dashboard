# Finance — Savings Goals — mục tiêu tiết kiệm và phần góp mỗi tháng

<role>Fullstack engineer cho module Finance</role>

<context>
User để dành cho những khoản cụ thể (quỹ khẩn cấp, chuyến đi, xe…) và muốn biết **tháng này còn
phải để riêng bao nhiêu** để kịp hạn. Đây là sổ riêng của từng mục tiêu, khác `Goal` của phần
gamification ([goals.md](./goals.md)) — không XP, không coins.

Góp vào mục tiêu **không** tạo transaction và **không** trừ ví: đó là tiền được đánh dấu để dành,
không phải tiền đã tiêu. Gộp vào ledger sẽ làm phồng expense và làm sai budget.
</context>

<task>
Model `FinanceGoal` + `GoalContribution`, tính tiến độ và phần cần góp tháng này ở server, tab
Goals, và một banner duy nhất nhắc góp ở Overview.
</task>

<requirement>

## Dữ liệu

`FinanceGoal` (`src/server/models/finance-goal.model.ts`):

| Field          | Kiểu                                    | Ghi chú                               |
| -------------- | --------------------------------------- | ------------------------------------- |
| `name`         | string ≤100                             |                                       |
| `icon`         | string ≤8 (emoji)                       |                                       |
| `color`        | 7 màu, default `gold`                   |                                       |
| `targetAmount` | number ≥1                               |                                       |
| `targetDate`   | Date?                                   | Không có hạn thì không có nhịp để trễ |
| `status`       | `'active' \| 'completed' \| 'archived'` | `completed` do server tự đặt          |
| `completedAt`  | Date?                                   |                                       |

`GoalContribution` (`goal-contribution.model.ts`): `goalId`, `amount` (**dương = góp vào, âm =
rút ra**), `date`, `note?` ≤200. Số đã góp = **tổng contribution**, không lưu sẵn trên goal — một
nguồn sự thật, không có số để lệch.

## Tính tiến độ — `listGoalsWithProgress()` (`src/server/services/finance-goals.ts`)

Tính cho `month` + `today` của client. Goal `archived` bị bỏ khỏi danh sách.

| Field                  | Công thức                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `currentAmount`        | Σ contribution                                                                     |
| `remaining`            | `max(0, target − current)`                                                         |
| `progress`             | `round(current / target × 100)`, chặn 100                                          |
| `monthsLeft`           | Số tháng từ `month` tới tháng của `targetDate`, **tính cả tháng này**, tối thiểu 1 |
| `requiredMonthly`      | `ceil(remaining / monthsLeft)`                                                     |
| `contributedThisMonth` | Σ contribution có `date` trong `month`                                             |
| `unallocatedThisMonth` | `max(0, requiredMonthly − contributedThisMonth)`                                   |
| `requiredDaily`        | `ceil(unallocated / số ngày còn lại của tháng)`                                    |
| `onTrack`              | `unallocatedThisMonth === 0`                                                       |

Không có `targetDate` → các field theo nhịp là `null`, `unallocated = 0`, luôn `onTrack`.
`requiredMonthly` chia **phần còn lại** cho số tháng còn lại, nên tháng trước góp hụt thì tháng
sau tự gánh thêm — không có khái niệm "nợ tháng cũ" riêng.

`syncGoalStatus()` chạy sau mọi thay đổi contribution và sau mỗi lần sửa goal: đạt target →
`completed` + `completedAt`; rút xuống dưới target hoặc nâng target → về `active`. Goal
`archived` không bị đụng.

## API

| Method   | Endpoint                                  | Ghi chú                                                            |
| -------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/api/v1/finance/goals?month&today`       | Kèm progress; default = ngày server                                |
| `POST`   | `/api/v1/finance/goals`                   | `targetDate` dạng `YYYY-MM-DD`                                     |
| `PATCH`  | `/api/v1/finance/goals/:id`               | `targetDate: null` xoá hạn; `status` chỉ nhận `active \| archived` |
| `DELETE` | `/api/v1/finance/goals/:id`               | Hard delete, **xoá luôn contribution** — tách ra thì vô nghĩa      |
| `GET`    | `/api/v1/finance/goals/:id/contributions` | Sort `date↓`                                                       |
| `POST`   | `/api/v1/finance/goals/:id/contributions` | `amount ≠ 0`; rút quá số đang có → **409**                         |

Chặn rút quá ở chỗ ghi contribution chứ không kẹp tổng về 0 sau đó: sổ của goal chính là các
contribution, một tổng âm nghĩa là sổ đã sai.

## UI

**Tab Goals** (`/finance/goals`, `GoalsPage.tsx`): card mỗi goal — progress bar theo `color`, %,
`requiredMonthly` khi còn hạn và chưa xong, badge ✓ khi `completed`; thêm / sửa
(`GoalFormModal`) / xoá (confirm modal) / góp (`GoalContributionModal`).

**Góp tiền** (`GoalContributionModal`): **điền sẵn `unallocatedThisMonth`** — con số user cần
nhất lúc mở modal; ngày = `todayKey()` của client.

**Overview**:

- `AllocationBanner`: **chỉ một** goal — goal active có `unallocatedThisMonth` lớn nhất. Một
  quyết định, không phải một danh sách. Mọi goal đủ phần thì banner **biến mất** — banner lúc nào
  cũng ở đó là giấy dán tường.
- `SavingsGoalsCard`: goal chưa archive, **goal trễ nhịp lên trước** vì đó là cái cần quyết định.

## Edge cases

| Case                                   | Xử lý                                                     |
| -------------------------------------- | --------------------------------------------------------- |
| `targetDate` đã qua                    | `monthsLeft = 1` → toàn bộ phần còn lại dồn vào tháng này |
| Hạ `targetAmount` xuống dưới số đã góp | Lần sync tiếp theo đánh dấu `completed`                   |
| Goal không hạn                         | Không bao giờ xuất hiện ở banner                          |

## Chưa có trên UI

API có nhưng web **chưa có nút**: rút tiền (contribution âm — modal chỉ nhận số dương), archive
goal, xem lịch sử contribution.

</requirement>

<tone>Ngắn, nói lý do thay vì mô tả lại code.</tone>
