# Task Dependencies

Task có thể phụ thuộc vào một hoặc nhiều task khác. Task phụ thuộc không nên được bắt đầu cho đến khi tất cả dependencies đã hoàn thành.

---

## Mục tiêu

Cho phép user mô hình hóa thứ tự thực hiện công việc: task B không thể làm trước khi task A xong.

---

## Data Model

Trường `dependencies` trên Task model:

```typescript
{
  dependencies: ObjectId[]   // danh sách task IDs phải done trước
}
```

- Array rỗng = không có dependency.
- Chỉ tham chiếu task của cùng user (không cross-user).
- Không validate circular dependency ở server (client nên ngăn).

---

## Trạng thái `waiting`

Khi một task có dependency chưa hoàn thành, status của nó nên là `waiting`:

```
todo ──► in_progress ──► done
 │
 └──► waiting   ← bị block bởi dependency chưa done
       │
       └──► todo  (khi tất cả dependencies đã done)
```

Chuyển từ `waiting` → `todo` xảy ra khi tất cả tasks trong `dependencies[]` đạt `status: 'done'`. Hiện tại logic này chưa được tự động hóa — user tự đổi status thủ công.

---

## UI — Dependency Picker

Trong **AddTaskModal** và **EditTaskModal**, có phần chọn dependencies:

- Hiển thị danh sách tasks của user (active, chưa done).
- User chọn một hoặc nhiều task làm prerequisite.
- Các task đã được chọn hiển thị dưới dạng chips có thể remove.

**Validation client-side:**

- Không cho phép chọn chính task đang edit làm dependency của chính nó.
- Không cho phép chọn task đã phụ thuộc ngược lại (tránh circular — best-effort, không enforce sâu).

---

## Hiển thị trong Task Views

Khi một task đang ở trạng thái `waiting`:

- Task card hiển thị indicator "Blocked" hoặc lock icon.
- Tooltip hoặc expanded view liệt kê tên các tasks đang block nó.

Hiện tại dependency chain visualization (graph/tree) là **planned feature**, chưa implement.

---

## API

Không có endpoint riêng cho dependencies — chúng được update cùng task qua:

```
PATCH /api/v1/tasks/:id
Body: { dependencies: string[] }
```

---

## Trạng thái hiện tại

✅ Đã implement: field `dependencies: ObjectId[]` trong model, dependency picker UI trong TaskForm.

🟡 Chưa làm:

- Tự động chuyển status `waiting` → `todo` khi dependencies cleared.
- Dependency chain visualization (graph/tree view).
- Server-side validation circular dependency.
- Hiển thị "blocked by" trên task card trong WeekView / DayView.
