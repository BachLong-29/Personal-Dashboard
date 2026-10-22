# Requirements — mục lục spec tính năng Aetheria

Mỗi file mô tả một tính năng **như code đang chạy**, không phải như từng định làm. Code và spec
lệch nhau thì code đúng, và spec phải được sửa trong cùng nhánh với thay đổi code.

## Quy ước

- Cấu trúc: `# Tên — mô tả ngắn`, rồi `<role>`, `<context>`, `<task>`, `<requirement>` (các `##`
  cho dữ liệu, API, luật giao diện, edge case), `<tone>` tuỳ chọn. Văn tiếng Việt, định danh kỹ
  thuật giữ tiếng Anh. Giải thích **vì sao** cho mọi luật không hiển nhiên.
- Mỗi file **≤150 dòng**. Không đủ chỗ thì tách thành `<chủ-đề>-<phần>.md` và link qua lại.
- Tính năng mới: thêm file ở đây **và** một dòng vào mục lục dưới đây.
- Trạng thái: ⚠️ có phần chưa nối / đang ẩn · ❌ chưa làm · 🗑 đã gỡ · 📏 vượt 150 dòng, chờ tách.

## Lõi: task, quest, lịch

- [tasks.md](tasks.md) — Task một ngày / nhiều ngày, API `GET /tasks` (4 chế độ, phân trang), trang `/tasks`
- [tasks-sessions.md](tasks-sessions.md) — giữ session khớp khi task đổi ngày, mở Session Planner
- [quests.md](quests.md) — thử thách trong một ngày, `dueTime`, xoá hẳn, rollover
- [task-attachments.md](task-attachments.md) — tối đa 3 ảnh đính kèm
- [task-dependencies.md](task-dependencies.md) — task B chờ task A
- [task-defer.md](task-defer.md) — dời task kèm lý do
- [task-suggestion.md](task-suggestion.md) — gợi ý task backlog theo thời gian rảnh
- [quick-add-task.md](quick-add-task.md) — tạo task từ mọi trang (phím tắt, `QuickCreateFab`)
- [schedule-block.md](schedule-block.md) — một phiên làm việc của Task/Quest
- [block-driven-scheduling.md](block-driven-scheduling.md) — giờ của task đến từ block
- [week-view-rescheduling.md](week-view-rescheduling.md) — lập kế hoạch tuần bằng kéo-thả
- [overdue-task-handling.md](overdue-task-handling.md) — quá hạn: leo thang, phạt, dọn hàng loạt
- [conflict-capacity.md](conflict-capacity.md) — trùng giờ và quá tải trong ngày
- [calendar-item.md](calendar-item.md) — lớp chuẩn hoá chung của 4 nguồn lịch
- [schedule-statistics.md](schedule-statistics.md) — số liệu theo giờ
- [week-stats.md](week-stats.md) — ⚠️ dải thống kê tuần, hiện không được mount
- [schedule-engine.md](schedule-engine.md) — 📏 đặc tả engine gốc, có ghi chú "Thực tế"
- [mission.md](mission.md) — 📏 đặc tả hệ thống lịch gốc, có ghi chú "Thực tế"

## Habit & Event

- [habits.md](habits.md) — hoạt động lặp theo tuần, tạm ngưng, xoá vĩnh viễn
- [reschedule-habit.md](reschedule-habit.md) — dời một lần xuất hiện của habit thành Task
- [event.md](event.md) — event cố định / lặp, override từng lần, trạng thái tạm dừng
- [event-live.md](event-live.md) — event đang diễn ra, marquee hôm nay
- [share-agenda.md](share-agenda.md) — chép / tải lịch ngày, tuần

## Dashboard & điều hướng

- [dashboard.md](dashboard.md) — trang `/dashboard`: layout, tab, nút tạo nổi, panel
- [global-search.md](global-search.md) — Command Palette `Ctrl/⌘ + K`
- [quick-notes.md](quick-notes.md) — bắt ý tưởng bằng một chạm
- [notification-center.md](notification-center.md) — chuông thông báo, danh sách, thông báo tự sinh
- [schedule-notifications.md](schedule-notifications.md) — các thông báo sinh từ lịch
- [sunday-planning-reminder.md](sunday-planning-reminder.md) — nhắc lên kế hoạch tuần, tháng
- [not-found-page.md](not-found-page.md) — trang 404 của app
- [guild-panel.md](guild-panel.md) — 🗑 panel đã gỡ, ghi lại phần còn sót

## Trợ lý AI

- [ai-task-agent.md](ai-task-agent.md) — vòng hội thoại, đề xuất → xác nhận, `targets`, API
- [ai-task-agent-tools.md](ai-task-agent-tools.md) — danh mục tool đọc / ghi
- [ai-task-agent-ui.md](ai-task-agent-ui.md) — trang `/assistant`, ProposalCard, link "Xem …"

## Gamification

- [character.md](character.md) — XP, level, rank, stat
- [penalty.md](penalty.md) — phạt khi bỏ dở hôm qua
- [goals.md](goals.md) — goal dài hạn, mốc, Goal Bingo
- [achievements.md](achievements.md) — goal đã chinh phục thành thành tựu
- [marketplace.md](marketplace.md) — Reward Forge `/manage/rewards`, storefront
- [projects.md](projects.md) — gom task theo mục tiêu, nhận thưởng khi xong

## Finance

- [finance.md](finance.md) — spec gốc: Transaction, số dư, 6 tab, danh sách spec con
- [finance-wallets.md](finance-wallets.md) — ví: số dư đặt tay, ẩn số, không âm
- [finance-categories.md](finance-categories.md) — nhãn thu/chi, tự phân loại theo từ khoá
- [finance-budget.md](finance-budget.md) — hạn mức chi theo tháng
- [finance-budget-import.md](finance-budget-import.md) — dựng ngân sách cả tháng từ một bảng
- [finance-goals.md](finance-goals.md) — mục tiêu tiết kiệm và phần góp
- [finance-gold.md](finance-gold.md) — tài khoản vàng theo giá thị trường
- [finance-stats.md](finance-stats.md) — Overview & số liệu tháng
- [finance-monthly-report.md](finance-monthly-report.md) — báo cáo tháng đã kết thúc
- [finance-quick-add-transaction.md](finance-quick-add-transaction.md) — ghi khoản chi từ mọi trang
- [finance-transaction-presets.md](finance-transaction-presets.md) — preset cho widget mobile
- [finance-sepay.md](finance-sepay.md) — webhook SePay, giao dịch ngân hàng tự vào sổ
- [cash-log-reminder.md](cash-log-reminder.md) — nhắc ghi chi tiêu tiền mặt
- [finance-recurring.md](finance-recurring.md) — ❌ giao dịch định kỳ, chưa làm

## Tài khoản & nền tảng

- [auth.md](auth.md) — JWT hai tầng, cookie trên web, Bearer cho API và app Expo
- [google-login.md](google-login.md) — đăng nhập bằng Google ID token
- [user-setting.md](user-setting.md) — tuỳ chọn theo tài khoản, ai đọc / ghi field nào
- [profile.md](profile.md) — Hero Identity, các section của `/profile`
- [avatar-upload.md](avatar-upload.md) — ảnh đại diện trên Cloudinary
- [category.md](category.md) — nhãn dùng chung cho Habit, Task, Event
- [theme.md](theme.md) — sáng / tối / hệ thống, token màu, `--gold-fill*`
- [icon-picker.md](icon-picker.md) — `<Icon>`, sheet chọn icon, upload, thư viện ảnh
