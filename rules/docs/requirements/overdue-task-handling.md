<role>
Product owner định nghĩa tính năng "Overdue Task Handling" cho hệ thống gamified dashboard.
</role>

<context>
Tasks có thể bị bỏ qua qua nhiều ngày. Hiện tại không có cơ chế nào xử lý chúng ngoài badge "overdue" và đếm trong stats. Tính năng này thêm 2 lớp: visual escalation theo số ngày trễ và một review modal để user giải quyết hàng loạt.
</context>

<task>
Triển khai 2 hướng kết hợp:
- **Hướng 3 (Escalation Badge)**: Badge trên TaskCard leo thang theo số ngày trễ; auto-archive sau 7 ngày.
- **Hướng 1 (Review Modal)**: Modal xuất hiện khi dashboard load nếu có tasks overdue, cho phép Reschedule / Mark Done / Abandon từng task.
</task>

<requirement>

## 1. Định nghĩa "Overdue"

- Task bị coi là overdue khi: `active: true`, `status !== 'done'`, và due date < today
- **Due date** = `endDate` nếu có, ngược lại dùng `startDate`
- Tasks không có `startDate` (backlog) → **không bao giờ overdue**
- Số ngày trễ: `Math.floor((today - dueDate) / 86_400_000)` (>= 1)

---

## 2. Escalation Levels

| Ngày trễ | Level      | Badge                | Hành động                                           |
| -------- | ---------- | -------------------- | --------------------------------------------------- |
| 1–2 ngày | `late`     | `⚠ Late` (amber)     | Chỉ hiển thị badge                                  |
| 3–6 ngày | `critical` | `🔴 Critical` (rose) | Badge + tạo notification 1 lần                      |
| ≥ 7 ngày | `failed`   | —                    | Auto-archive + notification "Quest Failed" + trừ XP |

### Badge trên TaskCard

- Thêm badge escalation vào TaskCard, hiện sau badge `deferReason` (nếu có)
- Style `late`: nền amber/gold mờ, text amber
- Style `critical`: nền rose mờ, text rose, nhấp nháy nhẹ (CSS pulse)
- Chỉ render khi `overdueLevel !== null`

### Auto-archive (7 ngày)

- **Lazy-on-load**: khi hook `useOverdueReview` chạy lần đầu trong session, tách tasks overdue ≥ 7 ngày, gọi `PATCH /api/v1/tasks/:id { active: false }` cho từng task
- Sau khi archive, tạo notification: `type: 'system'`, title `"☠ Quest Failed"`, message ghi tên task
- Không block render — chạy async, invalidate query sau khi xong

### Critical Notification (3–6 ngày)

- Dùng existing `useCreateNotification`
- `dedupeKey`: `overdue:critical:${taskId}` (idempotent — chỉ tạo 1 lần)
- Tạo khi hook detect task lên level `critical` lần đầu trong session

---

## 3. Overdue Review Modal

### Trigger

- Hiện **một lần mỗi session** (dùng `sessionStorage` key `overdue_reviewed`)
- Chỉ hiện nếu có ít nhất 1 task overdue với 1–6 ngày trễ (tasks 7+ ngày đã bị auto-archive trước)
- Hiện sau khi auto-archive xong (await)

### Modal Layout

- Title: `"⚠ Overdue Quests"`, subtitle: `"N quest(s) missed their deadline"`
- Danh sách tasks, mỗi item hiện: icon + tên + due date + số ngày trễ
- Mỗi task có 3 nút action: **Reschedule** / **Done** / **Abandon**
- Footer: nút `"Dismiss"` (đóng modal, đánh dấu session đã review)

### Reschedule Action

- Hiển thị inline DatePicker ngay dưới task item khi user click Reschedule
- Submit: `PATCH /api/v1/tasks/:id { startDate: newDate, endDate: null }` (reset endDate)
- Sau khi save: item biến mất khỏi danh sách

### Mark Done Action

- `PATCH /api/v1/tasks/:id { status: 'done' }`
- Sau khi save: item biến mất khỏi danh sách
- Không có XP reward (task đã trễ)

### Abandon Action

- `PATCH /api/v1/tasks/:id { active: false }`
- Xác nhận inline (confirm chip hiện ra thay 3 nút, click lần 2 mới execute)
- Sau khi save: item biến mất khỏi danh sách

### Khi list rỗng

- Thay nội dung bằng: `"All caught up! ✓"` + auto-close sau 1.5s

---

## 4. Hook — `useOverdueReview`

```typescript
// src/features/tasks/hooks/useOverdueReview.ts
function useOverdueReview(tasks: Task[]): {
  overdueItems: OverdueItem[]; // tasks 1-6 ngày trễ (sau khi auto-archive xong)
  isReady: boolean; // false khi đang auto-archive
  markSessionReviewed: () => void;
};
```

- `OverdueItem`: Task + `daysOverdue: number` + `overdueLevel: 'late' | 'critical'`
- Chạy 1 lần khi mount (effect với empty-deps sau tasks loaded)
- Bước 1: tìm tasks >= 7 ngày → batch PATCH `active: false` → invalidate
- Bước 2: `isReady = true`, set `overdueItems` = tasks 1–6 ngày
- Check `sessionStorage` trước khi show modal

---

## 5. Utility — `computeOverdueLevel`

```typescript
// Thêm vào src/features/tasks/data/adapters.ts
function computeOverdueLevel(task: Task, today: string): 'late' | 'critical' | 'failed' | null;
```

- null nếu không overdue, không có due date, hoặc done
- Dựa trên `daysOverdue`: 1–2 → `late`, 3–6 → `critical`, >= 7 → `failed`

---

## 6. Files cần tạo / sửa

| File                                                            | Thay đổi                     |
| --------------------------------------------------------------- | ---------------------------- |
| `src/features/tasks/hooks/useOverdueReview.ts`                  | Hook mới                     |
| `src/features/tasks/data/adapters.ts`                           | Thêm `computeOverdueLevel()` |
| `src/features/tasks/components/shared/OverdueReviewModal.tsx`   | Component mới                |
| `src/features/dashboard/components/MainDashboard.tsx`           | Mount hook + render Modal    |
| `src/features/tasks/components/TaskCard.tsx` (hoặc tương đương) | Thêm escalation badge        |

</requirement>

<tone>
Ngắn gọn, đủ để implement. Không giải thích lý do business ngoài những gì đã ghi.
</tone>
