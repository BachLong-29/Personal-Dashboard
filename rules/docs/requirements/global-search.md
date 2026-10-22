# Global Search — Command Palette `Ctrl/⌘ + K`

<role>Fullstack engineer cho gamified personal dashboard</role>

<context>
Task, habit, quest, project rải qua nhiều trang (dashboard, tasks, projects). Cần một chỗ gõ
tên là tới — và vì palette đã là chỗ user gõ, nó cũng là cửa nhanh nhất vào các trang của app
và vào trợ lý. Dựng trên `CommandPalette` có sẵn (`src/components/ui/CommandPalette.tsx`).
</context>

<task>
`Ctrl/⌘ + K` (hoặc nút ⌕ ở topbar) mở palette trên mọi trang protected. Gõ để thấy: task /
habit / quest / project khớp tên, các trang của app, và một dòng "Ask Assistant" gửi nguyên câu
đã gõ cho trợ lý. Chọn task → mở modal sửa tại chỗ, không rời trang.
</task>

<requirement>

## API — `GET /api/v1/search?q=<term>&limit=<n>`

- Auth bắt buộc (`getAuthUser`) → 401 nếu thiếu. `q` bắt buộc, ≥ 1 ký tự sau trim;
  `limit` 1..10, mặc định 5 — **mỗi loại**.
- Khớp **chuỗi con, không phân biệt hoa thường** trên tên/tiêu đề; `q` được escape ký tự regex
  trước khi vào `$regex` (tránh lỗi/injection). Không bỏ dấu — giữ regex đơn giản.
- 4 truy vấn song song (`Promise.all`), chỉ dữ liệu của user, sort `updatedAt` desc.
  Task / Habit / Project lọc `active: true`; Quest không có `active` → lấy mọi quest, mọi ngày.
- Trả về nhóm theo loại:

```
SearchHit { id, type: 'task'|'habit'|'quest'|'project', label, icon, color, href }
data = { tasks: SearchHit[], habits: SearchHit[], quests: SearchHit[], projects: SearchHit[] }
```

- `label` = `name` (task/habit/project) hoặc `title` (quest). Quest không có icon → glyph theo
  `quest.type` (`QUEST_TYPE_ICON`, mặc định ⚔️), color `violet`.
- `href`: task `/tasks` · habit `/dashboard?tab=habits` · quest `/dashboard?tab=quests` ·
  project `/projects/[id]`. (Web không dùng `href` của task — xem dưới; giữ cho client khác.)

## Mở / đóng

- State ở `ui.store`: `searchOpen`, `openSearch()`, `closeSearch()`, `toggleSearch()` — để
  topbar và palette (mount nơi khác) dùng chung.
- Một instance `<GlobalSearch />` mount trong `src/app/[locale]/(protected)/layout.tsx`.
- Listener `keydown` toàn cục: `Ctrl/⌘ + K` → `preventDefault` (chặn search của trình duyệt) rồi
  bật/tắt. Listener đọc store **lúc bắn** (`useUIStore.getState()`) nên không cần deps; mọi
  đường đóng (kể cả phím) đều reset `query` để mở lại là trống.
- `Esc` đóng (CommandPalette tự xử lý).
- Nút mở trong `DashboardTopbar`: desktop (≥ 1025px) là thanh search giữa topbar có nhãn `⌘K`;
  dưới 1025px là nút icon `⌕` (`aria-label="Search"`) — điện thoại không có phím tắt.

## Kết quả trong palette (`features/search/components/GlobalSearch.tsx`)

`query` → `useDebounce(query, 300)` → `useGlobalSearch` (`['global-search', q]`, chỉ chạy khi
palette mở và `q` khác rỗng, `staleTime` 30 s). Palette chạy chế độ controlled với
`disableFilter` vì server đã lọc. Thứ tự nhóm:

1. **Tasks / Habits / Quests / Projects** — nhóm rỗng bị ẩn.
2. **Pages** — danh sách trang tĩnh lọc phía client trên nhãn (đã dịch) **hoặc** `keywords`
   tiếng Anh (vd. "wallet", "meeting", "shop"), để gõ tiếng Anh vẫn ra dù UI đang tiếng Việt.
   Gồm dashboard, tasks (Quest Log), projects, marketplace, achievements, rewards,
   `/manage/events`, profile, finance và các tab finance (wallets, budget, goals,
   transactions, categories). Chỉ hiện khi đã gõ.
3. **Assistant** — `Ask Assistant: "<query>"`, chỉ khi có chữ.

Empty label: chưa gõ → hint "Type to search tasks, habits, quests, projects, pages…"; có gõ mà
không ra → `No results for "<q>"`.

## Chọn một kết quả

- **Task → mở `EditTaskModal` tại chỗ** (`useTaskById` + `useUpdateTask`), không điều hướng tới
  `/tasks`: user đang ở đâu thì sửa ở đó. Lưu xong đóng modal.
  `EditTaskModal` được mount **luôn**, kể cả khi không có gì để sửa: nó giữ các dialog nối tiếp
  (session planner, "your sessions moved") trong state riêng và bật chúng **sau** khi save đã
  xoá task. Render có điều kiện sẽ huỷ component ngay lúc đó và các dialog không bao giờ hiện.
- Habit / quest / project / page → `router.push(href)` rồi đóng.
- **Ask Assistant** → `ui.store.setPendingAssistantPrompt(typed)`, đóng, `router.push('/assistant')`.
  Dùng `query` **sống**, không phải bản debounce, để không bao giờ gửi một nửa câu cũ. Trang
  assistant gửi nó đúng một lần ([ai-task-agent-ui.md](ai-task-agent-ui.md)); để trong store
  chứ không trong URL nên reload không gửi lại.

## Bàn phím trong palette

- ↑ / ↓ di chuyển (vòng), mục đang chọn được `scrollIntoView` khi vượt vùng nhìn thấy.
- **Enter chọn và phải `preventDefault`.** Không có nó, cùng cú Enter đó có thể bị đọc thành
  submit ngầm của form mà lựa chọn vừa mở và focus vào (vd. ô số tiền auto-focus của
  `TransactionFormModal`) — form bị gửi trước khi user bấm Enter lần hai.

## Mở rộng CommandPalette (tương thích ngược)

Props optional, không truyền thì hành vi cũ (uncontrolled, tự lọc `label.includes`):
`query?` + `onQueryChange?` (controlled), `disableFilter?`, `loading?`, `emptyLabel?`.

## File

| File                                              | Vai trò                                          |
| ------------------------------------------------- | ------------------------------------------------ |
| `src/app/api/v1/search/route.ts`                  | endpoint gộp                                     |
| `src/types/search.ts`                             | `SearchHit`, `GlobalSearchResult`                |
| `src/services/endpoints/search.ts`                | client `global(q)`                               |
| `src/features/search/hooks/useGlobalSearch.ts`    | React Query hook                                 |
| `src/features/search/components/GlobalSearch.tsx` | palette, Ctrl+K, pages, hand-off, modal          |
| `src/components/ui/CommandPalette.tsx`            | props mở rộng, phím, chặn Enter rò rỉ            |
| `src/stores/ui.store.ts`                          | `searchOpen`, `pendingAssistantPrompt`           |
| i18n `common.json` (en/vi/th)                     | namespace `search` (`pageNames`, `askAssistant`) |

</requirement>

<tone>Ngắn, kỹ thuật. Search là tiện ích nhẹ, một round-trip — đừng over-engineer.</tone>
