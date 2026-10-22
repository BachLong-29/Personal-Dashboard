# Quick Add Task — tạo task từ bất kỳ trang nào

<role>Fullstack engineer cho gamified personal dashboard</role>

<context>
Muốn tạo task mà không phải điều hướng tới `/tasks`. App đã có `AddTaskModal` (bọc `TaskForm`) và
pattern "mount một instance ở protected layout + listener phím tắt tự quản" từ Global Search
(`GlobalSearch.tsx`, `ui.store.searchOpen`). Quick Add Task dùng lại đúng pattern đó.
</context>

<task>
**Ctrl/Cmd + Shift + Q** mở `AddTaskModal` với `startDate` = hôm nay, trên mọi trang trong
`(protected)`. Tạo xong đóng modal, user ở nguyên trang. Trên điện thoại (không có phím) mở từ nút
tạo nổi `QuickCreateFab`.
</task>

<requirement>

## State — `src/stores/ui.store.ts`

```ts
quickAddTaskOpen: boolean; // không persist
openQuickAddTask / closeQuickAddTask / toggleQuickAddTask;
```

## Component — `src/features/tasks/components/shared/QuickAddTask.tsx`

- Render `<AddTaskModal open={quickAddTaskOpen} onClose={closeQuickAddTask}
defaultValues={{ startDate: new Date() }} />`, **luôn mounted**, điều khiển bằng `open`.
- Không truyền `icon`: `TaskForm` tự fallback `DEFAULT_ICON` (`📄`), category tự chọn `task`
  nếu có — nên chỉ cần gõ tên là lưu được.
- Không override `onSaved`: mặc định của `AddTaskModal` (đóng, không navigate) đúng ý.
- Listener `keydown` trên `window`, đặt ngay trong component (giống `GlobalSearch`):
  - cần `(metaKey || ctrlKey) && shiftKey && key.toLowerCase() === 'q'`;
  - bỏ qua khi target là `INPUT`/`TEXTAREA`/`contentEditable`;
  - bỏ qua khi `searchOpen` hoặc `quickAddTaskOpen` đang bật;
  - thoả hết → `preventDefault()` + `openQuickAddTask()`.

Mount trong `src/app/[locale]/(protected)/layout.tsx`, cạnh `GlobalSearch`, `QuickAddTransaction`,
`QuickNotes`, `QuickCreateFab`.

## Lối vào không cần bàn phím — `QuickCreateFab`

`src/components/common/QuickCreateFab.tsx` (xem thêm [quick-notes](./quick-notes.md)): một nút
`＋` nổi góc dưới phải, **ở mọi độ rộng**, mở menu ba mục: Note · **Quick add task** · Quick add
transaction. Mục task gọi `openQuickAddTask`, kèm badge `⌘⇧Q` (chỉ hiện từ `sm`, vì chỉ layout
rộng mới có bàn phím — giờ đây là chỗ duy nhất phím tắt được "dạy").

**Thay đổi so với spec cũ:** nút `＋` ở cụm mobile của `DashboardTopbar` **đã bỏ**. Cụm icon góc
trên trái đã lên tới năm nút ở chỗ ngón cái khó với nhất; việc tạo dời xuống góc dưới phải — nơi
ngón cái vốn đặt sẵn — và một nút gom cả ba thứ cần ghi nhanh. Menu desktop cũ thì mở sát mép
phải và bị cắt.

FAB ẩn ở `/profile` (thanh lưu cố định đáy trang sẽ bị đè). Trên màn hẹp đặt ở `bottom-[72px]`
để nằm trên bottom nav 56px của dashboard; từ 1025px trở lên về `bottom-6 right-6`.

## Edge cases

| Case                                                         | Hành vi                                                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Đang gõ trong input/textarea bất kỳ                          | Bỏ qua phím tắt                                                                                                      |
| Global Search hoặc chính Quick Add đang mở                   | Bỏ qua, không mở chồng                                                                                               |
| Modal khác đang mở (Edit task, Quick add transaction, Notes) | **Không chặn** — modal task vẫn mở chồng lên nếu focus không ở ô nhập                                                |
| Đang ở `/tasks`                                              | Mở bình thường                                                                                                       |
| Tạo xong                                                     | Đóng modal, giữ route; task có `duration` + `startDate` → mở Session Planner ([tasks-sessions](./tasks-sessions.md)) |

`QuickAddTransaction` thì ngược lại có kiểm tra `quickAddTaskOpen` trước khi mở, nên hai quick-add
không chồng nhau theo chiều đó.

## Reuse

`AddTaskModal` / `TaskForm` dùng nguyên trạng — không có form riêng cho quick add. i18n:
`dashboard.quickAddMenu.task` (nhãn trong FAB).

## Open questions

- Có nên chặn phím tắt khi bất kỳ modal nào đang mở (đọc từ một cờ chung), thay vì chỉ
  `searchOpen`?

</requirement>

<tone>Concise, technical. Tái sử dụng tối đa `AddTaskModal`/`TaskForm`, không tạo form mới.</tone>
