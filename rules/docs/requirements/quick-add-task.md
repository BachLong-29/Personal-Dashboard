# Quick Add Task (Global Shortcut)

<role>Fullstack engineer cho gamified personal dashboard</role>

<context>
Người dùng muốn tạo task mới mà không cần điều hướng tới `/tasks`. App đã có sẵn
`AddTaskModal` (dùng lại `TaskForm`) và pattern "mount 1 instance ở protected layout +
phím tắt toàn cục" từ tính năng Global Search (`GlobalSearch.tsx`, `ui.store.searchOpen`).
Quick Add Task tái sử dụng đúng pattern đó, chỉ khác phím tắt và giá trị mặc định.
</context>

<task>
Thêm phím tắt toàn cục **Ctrl/Cmd + Shift + Q**: mở `AddTaskModal` với `startDate` =
hôm nay và icon mặc định đã có sẵn (không cần chọn tay). Hoạt động trên mọi trang trong
`(protected)`, không cần đang ở `/tasks`. Task tạo xong đóng modal, không điều hướng đi
đâu — người dùng ở nguyên trang hiện tại. Trên mobile (không có bàn phím vật lý) thêm nút
bấm tương đương ở topbar.
</task>

<requirement>

## State — `ui.store`

Thêm vào `UIState` (giữ đúng style các field `search*` đã có):

```ts
quickAddTaskOpen: boolean;
openQuickAddTask: () => void;
closeQuickAddTask: () => void;
toggleQuickAddTask: () => void;
```

## Component `QuickAddTask`

File mới: `src/features/tasks/components/shared/QuickAddTask.tsx`.

- Đọc `quickAddTaskOpen` từ `ui.store`, render `<AddTaskModal open onClose={closeQuickAddTask} defaultValues={{ startDate: new Date() }} />`.
  Không truyền `icon` — `TaskForm` đã tự fallback về `DEFAULT_ICON` (`📄`) khi không có,
  nên "icon chọn sẵn" đạt được miễn phí, không cần thêm logic.
- `onSaved` không cần override — hành vi mặc định của `AddTaskModal` (đóng modal, không
  navigate) đã đúng ý muốn "ở nguyên trang hiện tại".
- Listener bàn phím toàn cục, đặt trong component này (giống cách `GlobalSearch` tự quản
  lý listener của nó — không tách hook riêng):

  ```ts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey || e.key.toLowerCase() !== 'q') return;

      // Bỏ qua khi đang gõ trong input/textarea/contentEditable, hoặc khi một modal/
      // palette khác đang mở (search, edit task...) — tránh mở chồng.
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTyping) return;

      const store = useUIStore.getState();
      if (store.searchOpen || store.quickAddTaskOpen) return;

      e.preventDefault();
      store.openQuickAddTask();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  ```

- **Không** chặn khi `quickAddTaskOpen === true` và modal đang focus input bên trong (vd
  đang gõ tên task) — vì check `isTyping` ở trên đã tự loại các trường hợp đó.

## Mount

Thêm `<QuickAddTask />` vào `src/app/[locale]/(protected)/layout.tsx`, cạnh
`<GlobalSearch />` (cùng cấp, độc lập).

## Mobile — nút bấm tương đương

- Trên mobile không có phím tắt vật lý → thêm nút icon `＋` ở cụm mobile của
  `DashboardTopbar` (`src/features/dashboard/components/layout/DashboardTopbar.tsx`),
  cạnh nút search hiện có (dòng ~79), cùng style `tabletMenuBtn`.
- `onClick = () => useUIStore.getState().openQuickAddTask()`, `aria-label` theo i18n key
  mới `tasks.quickAdd.button`.
- Không cần thêm ở desktop topbar — desktop dùng phím tắt, nhưng vẫn hiện gợi ý phím tắt
  dạng badge (giống ô search có badge `⌘K`) ở đâu đó hợp lý là **optional**, không bắt
  buộc cho bản đầu.

## Edge cases

| Case                                          | Xử lý                                                            |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Đang gõ trong 1 input/textarea bất kỳ         | Bỏ qua phím tắt, không mở modal                                  |
| Modal Quick Add hoặc Global Search đang mở    | Bỏ qua, không mở chồng modal thứ hai                             |
| User đang ở `/tasks` và bấm phím tắt          | Vẫn mở `AddTaskModal` bình thường (không có gì đặc biệt)         |
| Tạo task xong                                 | Đóng modal, giữ nguyên route hiện tại, task xuất hiện ở `/tasks` |
| Task có `duration` — trigger `SessionPlanner` | Giữ nguyên hành vi có sẵn của `AddTaskModal` (không tắt)         |

## Reuse / Types

| File                                                           | Thay đổi                             |
| -------------------------------------------------------------- | ------------------------------------ |
| `src/stores/ui.store.ts`                                       | thêm `quickAddTaskOpen` + 3 actions  |
| `src/features/tasks/components/shared/QuickAddTask.tsx` (mới)  | modal + phím tắt                     |
| `src/features/tasks/components/shared/AddTaskModal.tsx`        | tái sử dụng nguyên trạng, không sửa  |
| `src/app/[locale]/(protected)/layout.tsx`                      | mount `<QuickAddTask />`             |
| `src/features/dashboard/components/layout/DashboardTopbar.tsx` | nút `＋` mobile cạnh nút search      |
| i18n `common.json` (en/vi/th)                                  | `tasks.quickAdd.button` (aria-label) |

</requirement>

<tone>Concise, technical. Tái sử dụng tối đa `AddTaskModal`/`TaskForm` sẵn có, không tạo form mới, không thêm logic đóng/mở phức tạp.</tone>
