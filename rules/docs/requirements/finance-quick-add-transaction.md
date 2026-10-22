# Finance — Quick Add Transaction — ghi một khoản chi từ bất kỳ trang nào

<role>Fullstack engineer cho gamified personal dashboard</role>

<context>
Overview (`RecentTransactionsCard.tsx`) có ô "Quick add: 85k lunch momo": `parseQuickEntry()`
(`src/features/finance/quick-entry.ts`) đọc một dòng thành `QuickEntryDraft`, rồi
`TransactionFormModal` mở với draft đó để user xác nhận. Vấn đề: chỉ dùng được khi đang đứng ở
Overview — muốn ghi "5k giữ xe" phải điều hướng tới `/finance` trước, lâu hơn cả tự tìm category.

App đã có pattern "mount một instance ở `(protected)/layout.tsx` + phím tắt toàn cục": Global
Search (`⌘K`) và Quick Add Task (`⌘⇧Q`, [quick-add-task.md](./quick-add-task.md)).
</context>

<task>
Phím tắt toàn cục **Ctrl/Cmd + Shift + E** mở một ô nhập kiểu command palette (tái dùng
`CommandPalette`) ở mọi trang `(protected)`. Gõ một dòng, chọn → mở `TransactionFormModal` với draft
đã parse. **Không bao giờ tự lưu.**
</task>

<requirement>

## Parser — `parseQuickEntry(text, wallets, categories)`

Rule-based, không LLM, và **cố ý chỉ là draft**: parse là gợi ý user xác nhận trong form thường,
nên đọc sai không bao giờ ghi một con số sai vào ledger.

- Bỏ dấu tiếng Việt trước khi so (`ăn trưa` khớp được `Ăn uống`)
- Số tiền: `([+-]?)(\d+([.,]\d+)?)\s*(k|nghin|ngan|tr|trieu|m|ty)?` — `k/nghin/ngan` ×1.000,
  `tr/trieu/m` ×1.000.000, `ty` ×1.000.000.000; `,` trong số là dấu thập phân (`1,5tr`)
- Dấu `+` → `income`; còn lại `expense`
- Không có số tiền hợp lệ → `null`
- Ví: `@ten-vi` trước, rồi khớp theo từ; category: khớp theo **từ nguyên vẹn**, không chuỗi con
  (`an` không được khớp trong `thanh`), chỉ trong category cùng type
- `note` = text gốc (giữ hoa thường, dấu) trừ token số tiền và `@...`

## State — `src/stores/ui.store.ts`

`quickAddTransactionOpen` + `openQuickAddTransaction()` / `closeQuickAddTransaction()`, cùng kiểu
`search*` / `quickAddTask*`. Không có `toggle*` — không UI nào cần.

## Component — `src/features/finance/components/QuickAddTransaction.tsx`

- Tự fetch `useWallets()` + `useFinanceCategories()` — không phụ thuộc trang hiện tại đã fetch chưa
- State local `text` + `pendingDraft`; `draft = useMemo(parseQuickEntry(...))` theo `text`
- `CommandPalette`: `query={text}`, `disableFilter`, placeholder/empty tái dùng
  `overview.quickAddPlaceholder` / `overview.quickAddHelp`
- `draft` null → không group nào, palette hiện help text. Có draft → **một** item, icon category
  (hoặc ➕), label `{+|−}{số tiền} · {note} · {category}`; chọn → `setPendingDraft(draft)` (palette
  tự đóng)
- `TransactionFormModal` mở khi có `pendingDraft`; đóng (lưu hoặc huỷ) thì xoá cả `pendingDraft`
  lẫn `text` — draft cũ không rò sang lần mở sau

## Phím tắt

Listener `keydown` trên `window`, tự quản trong component (giống `QuickAddTask.tsx`):

- Cần `(meta || ctrl) && shift && key === 'e'`
- Bỏ qua khi đang gõ trong `INPUT` / `TEXTAREA` / `contentEditable`
- Bỏ qua khi Search, Quick Add Task, hoặc chính palette này đang mở — không mở chồng
- `preventDefault()` rồi `openQuickAddTransaction()`

Từng là `⌘⇧A`, đổi sang `⌘⇧E` (`f21aee1`).

## Mount

`<QuickAddTransaction />` trong `src/app/[locale]/(protected)/layout.tsx`, cạnh `<GlobalSearch />`
và `<QuickAddTask />`.

## Không có bàn phím — `QuickCreateFab`

Lối vào không cần phím tắt là **nút nổi `QuickCreateFab`** (`src/components/common/QuickCreateFab.tsx`,
mount ở cùng layout), mở ra ba lựa chọn: Note · Task (`⌘⇧Q`) · **Transaction (`⌘⇧E`)** — chọn
Transaction gọi `openQuickAddTransaction()`. Hiện ở **mọi** kích thước màn, ẩn ở `/profile`; chi
tiết vị trí ở [quick-notes.md](./quick-notes.md).

Thay cho dropdown `＋` trên `DashboardTopbar` của bản trước: góc trên trái là chỗ ngón cái khó với
nhất, và menu desktop cũ bị mép phải cửa sổ cắt mất. i18n `dashboard.quickAddMenu.*`.

Cash reminder ([cash-log-reminder.md](./cash-log-reminder.md)) cũng mở đúng palette này từ nút
trong dialog của nó.

## TransactionFormModal — những gì draft rơi vào

Form chung với Overview / Transactions: Enter submit, `DatePicker` của design system, category
searchable, `＋ New category`, lỗi server (vd. ví xuống âm) hiện ngay trong modal
([finance.md](./finance.md)).

## Edge cases

| Case                         | Xử lý                                      |
| ---------------------------- | ------------------------------------------ |
| Đang gõ trong input/textarea | Bỏ qua phím tắt                            |
| Palette khác đang mở         | Bỏ qua, không mở chồng                     |
| Không có số tiền hợp lệ      | Palette hiện help text, Enter không làm gì |
| Không khớp category          | Form mở với category rỗng — user tự chọn   |
| Không khớp ví                | Ví mặc định của form (ví đầu tiên)         |
| Lưu bị từ chối (ví âm)       | Modal giữ nguyên, hiện câu lỗi của server  |

</requirement>

<tone>Concise, technical. Tái dùng tối đa (`parseQuickEntry`, `CommandPalette`,
`TransactionFormModal`) — không viết form, parser hay overlay mới.</tone>
