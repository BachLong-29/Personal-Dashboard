# Global Search (Command Palette)

<role>Fullstack engineer cho gamified personal dashboard</role>

<context>
Người dùng có nhiều task, habit, quest và project rải rác qua nhiều trang (dashboard,
tasks, projects). Hiện không có cách nào tìm nhanh một mục theo tên. Cần một thanh tìm
kiếm toàn cục mở bằng phím tắt, dùng lại component `CommandPalette` đã có sẵn trong
design system (`src/components/ui/CommandPalette.tsx`).
</context>

<task>
Thêm tính năng search toàn cục: gõ `Ctrl/Cmd + K` mở Command Palette, gõ từ khóa để tìm
theo tên Task, Habit, Quest, Project. Chọn một kết quả → điều hướng tới trang tương ứng.
Trên mobile thêm 1 nút search ở topbar để mở palette (không có phím tắt vật lý).
</task>

<requirement>

## Logic search (cốt lõi)

- Tìm theo **tên/tiêu đề**, case-insensitive, khớp **chuỗi con** (`$regex`, `$options:'i'`).
- Phạm vi: chỉ dữ liệu của user đang đăng nhập. Task/Habit/Project lọc `active: true`;
  Quest không có `active` nên lấy tất cả (mọi ngày, không giới hạn date range).
- Query rỗng / chỉ khoảng trắng → trả mảng rỗng (không query DB).
- Debounce input **300ms** (`useDebounce`) trước khi gọi API.
- Mỗi loại giới hạn tối đa **5 kết quả**, sort theo `updatedAt` desc (gần đây nhất trước).
- Không phân biệt dấu là tùy chọn (KHÔNG bắt buộc) — giữ regex đơn giản.

## API — endpoint gộp

`GET /api/v1/search?q=<term>&limit=<n>` (mới)

- Auth bắt buộc (`getAuthUser`), chưa đăng nhập → 401.
- `q` required, min 1 ký tự sau trim; `limit` optional (1..10, default 5) — số kết quả/loại.
- Chạy **4 truy vấn song song** (`Promise.all`) trên Task, Habit, Quest, Project.
- Escape ký tự regex đặc biệt trong `q` trước khi đưa vào `$regex` (tránh lỗi/injection).
- Trả về nhóm theo loại:

```
SearchHit { id, type, label, icon, color, href }
type: 'task' | 'habit' | 'quest' | 'project'

response.data = {
  tasks:    SearchHit[],
  habits:   SearchHit[],
  quests:   SearchHit[],
  projects: SearchHit[],
}
```

- `label` = name (task/habit/project) hoặc title (quest). `icon`/`color` lấy từ document
  (quest không có icon → để icon mặc định theo `type`, color 'violet').
- `href` (điều hướng đích):
  - task → `/tasks`
  - habit → `/dashboard?tab=habits`
  - quest → `/dashboard?tab=quests`
  - project → `/projects/[id]`

## Client — mở/đóng & phím tắt

- State mở/đóng đặt ở `ui.store` (Zustand): `searchOpen`, `openSearch()`, `closeSearch()`,
  `toggleSearch()` — để topbar (nút) và palette (mounted nơi khác) dùng chung.
- Listener toàn cục: `Ctrl+K` hoặc `Cmd+K` → `toggleSearch()` + `preventDefault` (chặn
  search mặc định của trình duyệt). `Esc` đóng (CommandPalette đã xử lý sẵn).
- Mount **một** instance `<GlobalSearch />` ở `(protected)/layout.tsx` (client wrapper) để
  dùng được trên mọi trang protected, độc lập với topbar.

## Client — component GlobalSearch

- Owns: `query` (input), `useDebounce(query, 300)`, React Query
  `useQuery(['global-search', debounced], …)` chỉ chạy khi `debounced.trim()` có nội dung.
- Map kết quả API → `CommandGroup[]` (mỗi loại 1 group có label: "Tasks", "Habits",
  "Quests", "Projects"); `onSelect` của mỗi item → `router.push(hit.href)` rồi `closeSearch()`.
- Reset `query` khi đóng palette.

## Mở rộng CommandPalette (giữ tương thích ngược)

Thêm props **optional** vào `CommandPalette` (mặc định = hành vi cũ):

- `query?`, `onQueryChange?` — chế độ **controlled input** (để query điều khiển fetch server).
- `disableFilter?: boolean` — bỏ lọc client-side `label.includes` (kết quả đã lọc ở server).
- `loading?: boolean` — hiện trạng thái đang tìm.
- `emptyLabel?: string` — text khi không có kết quả.

Khi không truyền các props này, component hoạt động y như hiện tại (uncontrolled, tự lọc).

## Mobile — nút search

- Thêm nút icon `⌕` ở cụm mobile của `DashboardTopbar` (cạnh `NotificationBell` + hamburger),
  chỉ hiện `< 1025px`, `onClick = openSearch()`, `aria-label="Search"`.

## Reuse / Types

| File                                                    | Thay đổi                                           |
| ------------------------------------------------------- | -------------------------------------------------- |
| `src/components/ui/CommandPalette.tsx`                  | thêm props optional ở trên                         |
| `src/app/api/v1/search/route.ts` (mới)                  | endpoint gộp                                       |
| `src/types/search.ts` (mới)                             | `SearchHit`, `SearchHitType`, `GlobalSearchResult` |
| `src/services/endpoints/search.ts` (mới)                | client `search(q, limit)`                          |
| `src/features/search/components/GlobalSearch.tsx` (mới) | palette + Ctrl+K                                   |
| `src/features/search/hooks/useGlobalSearch.ts` (mới)    | React Query hook                                   |
| `src/stores/ui.store.ts`                                | `searchOpen` + actions                             |
| `src/app/[locale]/(protected)/layout.tsx`               | mount `<GlobalSearch />`                           |
| `src/features/dashboard/components/DashboardTopbar.tsx` | nút search mobile                                  |
| i18n `common.json` (en/vi/th)                           | `nav.search`, group labels                         |

</requirement>

<tone>Concise, technical. Tái sử dụng tối đa, không over-engineer — search là tiện ích nhẹ, một round-trip.</tone>
