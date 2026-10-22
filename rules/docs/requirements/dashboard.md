# Dashboard — trang trung tâm `/dashboard`

<role>Fullstack engineer giữ cho trang dùng hằng ngày luôn với tới được mọi thứ ở mọi bề rộng</role>

<context>
User mở dashboard để xem game state (level, coin, streak) và làm hầu hết việc trong ngày: tick
item trên lịch, xem habit, xem thống kê. Entry: `src/features/dashboard/components/layout/MainDashboard.tsx`.

Nhiều quyết định dưới đây đến từ commit "repair six things the dashboard made hard" (`aa3ffee`):
có khoảng bề rộng mà cả cột phải lẫn bottom nav cùng ẩn, có nút tạo không ai thấy, có filter
ẩn dữ liệu mà không báo.
</context>

<task>
Layout 3 cột responsive, topbar mỏng, một nút tạo nổi, center panel 3 tab, và các panel phụ.
</task>

<requirement>

## Layout

| Bề rộng      | Bố cục                                                                                 |
| ------------ | -------------------------------------------------------------------------------------- |
| `≥1280` (xl) | 3 cột `220px · 1fr · 260px`: Left · Center · Right                                     |
| `1025–1279`  | 2 cột `240px · 1fr`; nội dung cột Right **dồn xuống dưới cột Left** (cột này vốn cuộn) |
| `<1025`      | 1 panel + `MobileNav` cố định đáy (5 tab), `pb-14` chừa chỗ                            |

Lý do dồn Right vào Left ở 1025–1279: trước đây cột 3 ẩn mà bottom nav cũng ẩn từ 1025px →
Projects và giá vàng không có đường nào tới.

**MobileNav** (`MobileNav.tsx`): Habits · Schedule · Stats · Hero (cột Left) · Guild (cột Right).
Tab cuối từng tên "Timer" nhưng panel không có timer nào — đổi thành "Guild", label qua i18n.

## Topbar — `DashboardTopbar.tsx` (dùng chung ~10 trang)

- **Desktop:** avatar (link về `/dashboard`, không dropdown) · gem + coin · thanh search giữa
  (`⌘K`) · streak · share · `NotificationBell`.
- **Mobile:** trái = logo app (về dashboard) · search · share · bell; phải = `CharacterCard`
  mở bottom sheet (hồ sơ, streak + ngày, link Profile/Marketplace/Quest Log/Events/Assistant/
  Projects/Achievements/Finance, đổi ngôn ngữ, theme, logout).
- Nav desktop (Profile, Quest Log, Events, Assistant, Projects, Achievements, Finance,
  Marketplace, ngôn ngữ, logout) nằm trong menu của `CharacterPanel`.
- **Share ẩn trên `/dashboard`** — thanh Schedule đã có nút share cạnh chính lịch nó share. Một
  màn không bao giờ có hai nút share.
- `EventMarquee` render ngay dưới topbar — xem [event-live](./event-live.md).
- **Không còn** nút "End Day", không nút ＋ trên topbar.

## Tạo mới — `src/components/common/QuickCreateFab.tsx`

Một FAB ＋ góc dưới phải ở **mọi bề rộng** (mount toàn cục, ẩn ở `/profile` vì thanh lưu cố
định). Mở dial: Note · Task (`⌘⇧Q`) · Transaction (`⌘⇧E`); phím tắt chỉ in từ `sm` trở lên.

- Mobile `bottom-[72px]` để không chìm dưới bottom nav 56px; desktop `bottom-6`.
- Vì sao bỏ menu ＋ trên topbar: góc trái mobile từng có 5 icon ở chỗ ngón cái với tới cuối cùng;
  còn menu desktop mở sát mép phải cửa sổ và bị cắt. Một chỗ tạo duy nhất cho mọi form factor.
- Dial bung từ dưới lên (gần nhất trước), ＋ xoay 45° thành ✕, chạm ra ngoài là đóng.

## Center — `CenterColumn.tsx`

Tab: **Schedule** (mặc định) · **Habits** · **Stats**; `?tab=` trên URL chọn tab và được
re-sync khi URL đổi (click notification push cùng route). Hàng tab chỉ hiện `≥1025px` —
dưới đó bottom nav đã có, hai hàng cùng lựa chọn chỉ ăn mất một dòng của day list.

**Schedule** (`ScheduleView.tsx`, state lưu `localStorage` `aetheria_schedule_state`):

- Sub-tab **Day · Week**. Month "parked" trong `SUB_TABS`; state cũ đang ở `month` bị đưa về
  `day` để không kẹt ở view không có nút.
- 4 công tắc: 📋 Tasks · ⚡ Quests · ✦ Habits · 📅 Events, có `aria-pressed`. Load state merge
  sâu `display` để key mới thêm không thành `undefined` (= tắt ngầm).
- Có công tắc nào tắt → nút cảnh báo "Show all (N)" — tuần bị lọc trông như mất dữ liệu.
- Dưới `sm`: 4 công tắc gộp vào `ScheduleDisplayMenu` (trigger giữ số đang ẩn); share và
  Quest Log (`/tasks`) vẫn là nút một chạm. Label 10px ở mọi bề rộng.
- Week view: cột **hôm nay** có gradient gold + ring + glow tĩnh (luôn trên màn → không animate);
  đồng hồ giờ mỗi cột chỉ đếm cái cột đang hiện. Chi tiết tuần ở
  [week-view-rescheduling](./week-view-rescheduling.md), event ở [event](./event.md).
- Tick done ở Day view trả XP/coin như quest (`onReward`): task 60/15, habit 30/10.

**Habits** → [habits](./habits.md). **Stats** → `AnalyticsPanel` ([week-stats](./week-stats.md)).

## Left — `LeftColumn.tsx`

- `CharacterPanel`: tên, class, level/XP, rank, stat; menu điều hướng desktop.
- `AchievementsPanel`: tối đa 6 chip từ **Goals** — `completed` trước (gradient gold + glow),
  rồi `in-progress`/`not-started` (🔒). Click chip → `AchievementDetailModal`: progress ring,
  status/rank/priority, target hoặc ngày xong, reward XP·coin, milestones, note, trophy.
  Link "view all" → `/achievements`.

## Right — `RightColumn.tsx`

1. `GoldPriceTicker`: giá **SJC** mua/bán (màu tách mua/bán), tag stale, link `/finance/wallets`.
   Dùng lại `useGoldPrice()`; loading = skeleton, không có SJC → không render.
2. `ProjectsPanel`: cao tới 480px khi xếp chồng; ở cột xl chiếm hết chiều cao còn lại.
3. Quote card (`showQuoteCard`).
4. `WeekPeekPanel` — **ẩn**: `DEFAULT_SETTINGS.showGuildPanel = false`, nhường chỗ cho Projects.

Settings đang là hằng `DEFAULT_SETTINGS` (`constants/index.ts`), chưa đọc từ UserSetting.

## Luồng khi mở trang

- `useDailyInit`: rollover quest một lần/ngày (`aetheria_quest_rollover_date`) → nếu có quest
  bị dời thì phát penalty; nhắc lập kế hoạch Chủ nhật và ngày 29.
- `usePenaltyFlow` tự phát penalty khi có task overdue ([penalty](./penalty.md)).
- Thứ tự modal: penalty → `OverdueReviewModal` → `CashLogReminderModal` (nhẹ nhất, cuối cùng).
- `EditTaskModal` luôn mount để khôi phục task fail từ notification.

## Câu hỏi mở

- `CharacterPanel` và bottom sheet sắp link theo thứ tự khác nhau — chưa thống nhất.
- Quest không còn tab riêng; chỉ hiện trong Schedule. Cần xác nhận đây là chủ đích lâu dài.

</requirement>

<tone>Concise, technical. Mỗi thứ có đúng một đường tới ở mỗi bề rộng.</tone>
