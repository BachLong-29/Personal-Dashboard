# Finance — Quick Add Transaction (Global Shortcut)

<role>Fullstack engineer cho gamified personal dashboard</role>

<context>
Overview page (`RecentTransactionsCard.tsx`) đã có ô "Quick add: 85k lunch momo" —
`parseQuickEntry()` (`src/features/finance/quick-entry.ts`) đọc 1 dòng text thành
`QuickEntryDraft` (amount/type/note + wallet/category match mờ theo tên), rồi
`TransactionFormModal` mở lên với draft đó để user xác nhận. Vấn đề: chỉ dùng được khi
đang đứng ở Overview. User phải điều hướng tới `/finance` mỗi lần muốn ghi nhanh 1 khoản
chi nhỏ (vd "5k giữ xe"), mất thời gian hơn cả việc tự tìm category.

App đã có sẵn pattern "mount 1 instance ở `(protected)/layout.tsx` + phím tắt toàn cục"
qua 2 tiền lệ: Global Search (`Ctrl/Cmd+K`, `ui.store.searchOpen`) và Quick Add Task
(`Ctrl/Cmd+Shift+Q`, `ui.store.quickAddTaskOpen` — xem
[quick-add-task.md](./quick-add-task.md)). Tính năng này tái dùng đúng pattern đó, cộng
thêm việc tái dùng `CommandPalette` (component đứng sau Global Search) làm khung UI cho ô
nhập liệu, thay vì tạo overlay mới.
</context>

<task>
Phím tắt toàn cục **Ctrl/Cmd + Shift + A**: mở 1 ô nhập liệu kiểu command-palette (dùng lại
`CommandPalette`, không tạo overlay mới) ở bất kỳ trang nào trong `(protected)`. Gõ 1 dòng
theo đúng cú pháp `parseQuickEntry()` đã có, Enter → đóng palette, mở `TransactionFormModal`
với draft đã parse để user xác nhận (không tự động lưu).
</task>

<requirement>

## State — `ui.store`

Thêm vào `UIState`, giữ đúng style field `search*`/`quickAddTask*`:

```ts
quickAddTransactionOpen: boolean;
openQuickAddTransaction: () => void;
closeQuickAddTransaction: () => void;
```

Không cần `toggle*` — không có UI nào cần toggle field này (khác `searchOpen` được cả
phím tắt lẫn nút bấm dùng).

## Component `QuickAddTransaction`

File mới: `src/features/finance/components/QuickAddTransaction.tsx`.

- Tự fetch `useWallets()` + `useFinanceCategories()` — cần data này để `parseQuickEntry()`
  match tên category/wallet, bất kể đang ở trang nào (không phụ thuộc `/finance` đã fetch
  sẵn hay chưa).
- State local: `text` (nội dung đang gõ) và `pendingDraft: QuickEntryDraft | null` (draft
  đã confirm, để mở `TransactionFormModal` sau khi palette đóng).
- `draft = parseQuickEntry(text, wallets, categories)` tính lại mỗi lần `text` đổi (useMemo).
- Render `<CommandPalette>` với:
  - `open={quickAddTransactionOpen}`, `query={text}`, `onQueryChange={setText}`,
    `disableFilter`.
  - `placeholder` = `t('overview.quickAddPlaceholder')`, `emptyLabel` =
    `t('overview.quickAddHelp')` — tái dùng 2 key i18n đã có, không thêm key mới cho phần
    này.
  - `groups`: rỗng nếu `draft` null (không có amount) → palette tự hiện `emptyLabel`.
    Có `draft` → 1 group, 1 item duy nhất:
    - `label`: `"{+|-}{formatCurrency(amount)}{note ? ' · ' + note : ''}{categoryName ? ' · ' + categoryName : ''}"`.
    - `onSelect`: `setPendingDraft(draft)` rồi mở `TransactionFormModal` (đóng palette là
      hành vi có sẵn của `CommandPalette` khi `onSelect` chạy).
- `<TransactionFormModal open={!!pendingDraft} draft={pendingDraft} wallets={wallets}
categories={categories} onClose={...} />` — đóng thì clear cả `pendingDraft` lẫn `text`,
  giống `FinancePage.closeTxModal()` (không để draft cũ rò sang lần mở tiếp theo).

## Phím tắt

Y hệt cấu trúc listener của `QuickAddTask.tsx` — tự quản lý trong component, không tách
hook chung:

```ts
useEffect(() => {
  const handle = (e: KeyboardEvent) => {
    if (!(e.metaKey || e.ctrlKey) || !e.shiftKey || e.key.toLowerCase() !== 'a') return;

    const target = e.target as HTMLElement;
    const isTyping =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    if (isTyping) return;

    const store = useUIStore.getState();
    if (store.searchOpen || store.quickAddTaskOpen || store.quickAddTransactionOpen) return;

    e.preventDefault();
    store.openQuickAddTransaction();
  };
  window.addEventListener('keydown', handle);
  return () => window.removeEventListener('keydown', handle);
}, []);
```

## Mount

Thêm `<QuickAddTransaction />` vào `src/app/[locale]/(protected)/layout.tsx`, cạnh
`<GlobalSearch />` và `<QuickAddTask />`.

## Mobile

**Không** thêm nút bấm tương đương ở topbar (khác tiền lệ Quick Add Task) — topbar mobile
đã có nút `＋` cho Quick Add Task, thêm 1 nút `＋` thứ hai làm việc khác sẽ gây nhầm lẫn và
topbar mobile vốn đã chật (đã fix cramped nhiều lần trước đó). Trên mobile user vẫn dùng ô
quick-add có sẵn ở Overview hoặc nút "Add transaction" ở `FinancePageHeader`.

## Edge cases

| Case                                           | Xử lý                                                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Đang gõ trong 1 input/textarea bất kỳ          | Bỏ qua phím tắt                                                                                                   |
| Search / Quick Add Task / palette này đang mở  | Bỏ qua, không mở chồng                                                                                            |
| Gõ text không có amount hợp lệ                 | Palette hiện `emptyLabel` (help text), Enter không làm gì                                                         |
| Category không match được tên nào              | `TransactionFormModal` mở với `categoryId` rỗng — user tự chọn (đúng hành vi hiện có của quick-add trên Overview) |
| Đóng `TransactionFormModal` (Save hoặc Cancel) | Clear `pendingDraft` + `text`, palette đã đóng từ bước chọn item                                                  |

## Reuse / Types

| File                                                            | Thay đổi                                                                    |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/stores/ui.store.ts`                                        | thêm `quickAddTransactionOpen` + 2 action                                   |
| `src/features/finance/components/QuickAddTransaction.tsx` (mới) | palette + phím tắt + modal                                                  |
| `src/features/finance/quick-entry.ts`                           | tái sử dụng nguyên trạng, không sửa                                         |
| `src/components/ui/CommandPalette.tsx`                          | tái sử dụng nguyên trạng, không sửa                                         |
| `src/features/finance/components/TransactionFormModal.tsx`      | tái sử dụng nguyên trạng, không sửa                                         |
| `src/app/[locale]/(protected)/layout.tsx`                       | mount `<QuickAddTransaction />`                                             |
| i18n                                                            | không thêm key mới — tái dùng `overview.quickAddPlaceholder`/`quickAddHelp` |

## Trạng thái hiện tại

❌ Chưa có gì mới cần build ngoài `QuickAddTransaction.tsx` + 2 field trong `ui.store` +
1 dòng mount — mọi phần tính toán/UI khác đều tái dùng nguyên trạng.

</requirement>

<tone>Concise, technical. Tái dùng tối đa (`parseQuickEntry`, `CommandPalette`,
`TransactionFormModal`) — không viết form/parser/overlay mới. Không thêm nút mobile để
tránh trùng nút Quick Add Task đã có.</tone>
