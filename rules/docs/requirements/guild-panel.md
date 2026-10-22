# Guild Panel — đã gỡ, chỉ còn lại cái tên

<role>Frontend engineer dọn dẹp layout dashboard</role>

<context>
Guild Panel từng là một panel cột phải liệt kê 4 "đồng đội" hardcode (Zephyr Cole, Nova Kim…)
với chấm online. Không có model, không API — thuần trang trí.

Commit `8d7668b` (2026-07-09, "remove dead dashboard components") **đã xoá**
`src/features/dashboard/components/GuildPanel.tsx`. Hiện không còn UI guild nào trong khu vực
đăng nhập. Spec này giữ lại để giải thích những dấu vết còn sót, tránh ai đó tưởng tính năng vẫn
sống rồi đi tìm.
</context>

<task>
Ghi lại thứ đang chiếm chỗ cũ của Guild Panel và những định danh "guild" còn sót trong code.
</task>

<requirement>

## Cột phải dashboard hiện tại

`src/features/dashboard/components/layout/RightColumn.tsx`, theo thứ tự:

1. `GoldPriceTicker` — giá vàng (xem `finance-gold.md`).
2. `ProjectsPanel` — project `active` (xem `projects.md`).
3. Thẻ "Daily Wisdom" — khi `settings.showQuoteCard`.
4. `WeekPeekPanel` — khi `settings.showGuildPanel`.

## Dấu vết "guild" còn lại

| Chỗ                                               | Thực chất là gì                                           |
| ------------------------------------------------- | --------------------------------------------------------- |
| `DashboardSettings.showGuildPanel`                | Bật/tắt **WeekPeekPanel** ("This Week"), không phải guild |
| `DEFAULT_SETTINGS.showGuildPanel = false`         | Tắt để nhường chỗ cho Projects                            |
| `MobileNav` tab id `guild`, nhãn `tabs.guild`, 🏰 | Mở panel cột phải (projects, tuần, giá vàng)              |
| `GuildMember` trong `features/dashboard/types`    | Type chết, không còn ai import                            |
| `features/home/components/GuildSection.tsx`       | Section marketing trên landing page công khai             |

**Vì sao cờ vẫn mang tên cũ:** `DEFAULT_SETTINGS` là hằng số client
(`features/dashboard/constants`), `MainDashboard` đọc thẳng, không có setting nào lưu DB — đổi
tên chỉ là refactor thuần. Ai làm thì đổi luôn thành `showWeekPeek`, đừng thêm cờ thứ hai.

**Tab mobile:** comment trong `MobileNav.tsx` giải thích vì sao không gọi tab này là "Timer" —
panel không còn FocusTimer, và một nav gọi sai tên còn tệ hơn một nav gọi chung chung.

## Không làm

Không dựng lại guild/social khi chưa có yêu cầu thật. Nếu sau này có, cần quyết trước:
thành viên là ai (bạn được mời hay cộng đồng mở), trạng thái online lấy từ đâu (WebSocket hay
polling), có tương tác không (xem profile, gửi cheer), và model `Guild`/`GuildMember` — rồi
viết spec mới, không sửa file này.

## Câu hỏi mở

- Có xoá hẳn type `GuildMember` và đổi `showGuildPanel` → `showWeekPeek` không?
- Nhãn tab mobile "Guild" có nên đổi thành tên phản ánh nội dung (vd. "Board")?
- `dashboard.md` (agent khác phụ trách) vẫn vẽ Guild Panel trong sơ đồ layout — cần sửa theo.

</requirement>

<tone>Ngắn. Nói rõ cái gì đã chết để người đọc khỏi tìm.</tone>
