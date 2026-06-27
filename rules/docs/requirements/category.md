# Category System

Category (tag) là nhãn phân loại dùng chung cho Habits và Tasks. Mỗi user có một danh sách categories riêng, tự quản lý.

---

## Mục tiêu

Cho phép user gắn nhãn (tag) vào habits và tasks để nhóm và lọc theo chủ đề (ví dụ: "Work", "Health", "Learning").

---

## Data Model

```typescript
{
  userId: ObjectId; // chủ sở hữu
  name: string; // tối đa 50 ký tự, trim, unique per user
  createdAt: Date;
  updatedAt: Date;
}
```

**Ràng buộc:**

- `(userId, name)` là unique — không thể có 2 categories trùng tên trong cùng một user.
- Không có soft delete — xóa là xóa hẳn.
- Category không có màu sắc hay icon riêng (màu/icon thuộc về Habit/Task).

---

## Default Categories

Khi user lần đầu gọi `GET /api/v1/categories` mà chưa có category nào, hệ thống tự seed 3 categories mặc định:

```
Morning Routine
Healthy Lifestyle
Work
```

Seed chỉ xảy ra một lần duy nhất (khi danh sách rỗng).

---

## Quan hệ với các entities khác

| Entity | Field             | Kiểu quan hệ                |
| ------ | ----------------- | --------------------------- |
| Habit  | `tagId: ObjectId` | nhiều habits → một category |
| Task   | `tagId: ObjectId` | nhiều tasks → một category  |

**Delete constraint:** Không thể xóa category nếu còn ít nhất một **Habit active** (`active: true`) đang dùng nó.  
Hiện tại Task không được kiểm tra khi xóa (behavior này có thể được bổ sung sau).

---

## CRUD Operations

| Action    | API                             | Notes                                                                  |
| --------- | ------------------------------- | ---------------------------------------------------------------------- |
| Danh sách | `GET /api/v1/categories`        | Chỉ categories của user, sort theo `createdAt` asc. Auto-seed nếu rỗng |
| Tạo mới   | `POST /api/v1/categories`       | `{ name }` — trả 409 nếu tên đã tồn tại                                |
| Đổi tên   | `PATCH /api/v1/categories/:id`  | `{ name }` — chỉ owner mới update được                                 |
| Xóa       | `DELETE /api/v1/categories/:id` | Hard delete. Trả 409 nếu đang được dùng bởi habit active               |

---

## UI — CategoryModal

Mở từ HabitPanel (và TaskForm). Là một modal đơn giản cho phép user quản lý toàn bộ danh sách categories.

**Layout:**

```
┌─────────────────────────────┐
│  ◈ Manage Categories        │
├─────────────────────────────┤
│  Add Category               │
│  [input................] [+ Add] │
├─────────────────────────────┤
│  Morning Routine   [✎] [✕]  │
│  Healthy Lifestyle [✎] [✕]  │
│  Work              [✎] [✕]  │
├─────────────────────────────┤
│                    [Close]  │
└─────────────────────────────┘
```

**Behaviors:**

- Nhấn `Enter` trong input → tạo category.
- Click `✎` → inline edit (input thay thế text, `Enter` = save, `Escape` = cancel).
- Click `✕` → xóa ngay (không confirm). Nếu API trả 409 → hiển thị error message ngay dưới row đó.
- List scroll độc lập nếu có nhiều items (max-height 300px).
- Backdrop click → đóng modal.

---

## Validation

| Field  | Rule                                  |
| ------ | ------------------------------------- |
| `name` | required, 1–50 ký tự, trim whitespace |

Server trả `400` nếu thiếu hoặc quá dài.  
Server trả `409` nếu tên đã tồn tại (unique constraint) hoặc xóa category đang được dùng.

---

## Trạng thái hiện tại

✅ Đã implement đầy đủ: model, 4 API routes, CategoryModal UI, 4 React Query hooks (`useCategories`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`).

🟡 Chưa làm: delete constraint cho Task (chỉ kiểm tra Habit hiện tại).
