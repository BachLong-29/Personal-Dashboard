# Quest System

Quests là đơn vị công việc cơ bản hàng ngày. Mỗi quest thuộc một ngày cụ thể (`dueDate`) và đem lại XP + coins khi hoàn thành.

---

## Quest Types

| Type      | Icon | Ý nghĩa                        |
| --------- | ---- | ------------------------------ |
| `focus`   | 🎯   | Deep work, học tập, dự án      |
| `habit`   | ⚡   | Liên kết với Habit system      |
| `reflect` | 📖   | Viết nhật ký, review           |
| `admin`   | 📬   | Công việc hành chính, việc vặt |
| `create`  | ✨   | Nghệ thuật, âm nhạc, viết lách |
| `health`  | 🌿   | Tập thể dục, ngủ, ăn uống      |
| `break`   | ☕   | Nghỉ ngơi, phục hồi            |

---

## Difficulty & Rewards

| Difficulty | XP  | Coins | Ý nghĩa                            |
| ---------- | --- | ----- | ---------------------------------- |
| S          | 150 | 40    | Cực kỳ khó, đòi hỏi nhiều công sức |
| A          | 120 | 30    | Khó, cần tập trung cao             |
| B          | 90  | 25    | Trung bình khó                     |
| C          | 60  | 15    | Bình thường                        |
| D          | 50  | 12    | Dễ, task nhanh                     |

XP và coins được tính từ difficulty map và lưu trực tiếp vào DB khi tạo quest.

**Bonus:** Quest difficulty S thêm 5 gems khi hoàn thành.

---

## Quest Data Model

```typescript
{
  title:      string      // tối đa 100 ký tự
  desc:       string      // mô tả, tối đa 300 ký tự
  type:       QuestType
  difficulty: Difficulty
  xp:         number      // precomputed từ difficulty
  coins:      number      // precomputed từ difficulty
  done:       boolean     // false by default
  tags:       string[]    // categories/labels
  dueDate:    Date        // ngày của quest
  completedAt?: Date      // set khi mark done
}
```

---

## CRUD Operations

| Action        | API                                  | Notes                   |
| ------------- | ------------------------------------ | ----------------------- |
| Xem danh sách | `GET /api/v1/quests?date=YYYY-MM-DD` | Filter theo dueDate     |
| Tạo mới       | `POST /api/v1/quests`                |                         |
| Cập nhật      | `PATCH /api/v1/quests/:id`           | Cập nhật bất kỳ field   |
| Xoá           | `DELETE /api/v1/quests/:id`          | Hard delete             |
| Rollover      | `POST /api/v1/quests/rollover`       | Move unfinished → today |

---

## Completion Flow

```
User toggle quest "done"
  │
  ├─ Lần đầu (chưa skip confirm):
  │    └─ ConfirmQuestModal → user confirm
  │
  └─ Sau khi confirm (hoặc skipConfirm = true):
       ├─ setQuests: đánh dấu quest done trong local state
       ├─ awardProgress(xp, coins, gems)
       │    ├─ Tăng XP: nếu xp >= xpNext → level up
       │    └─ PUT /api/v1/profile { xp, coins, level, gems, ... }
       ├─ setBurst: particle animation tại vị trí click
       └─ setToast: XP popup notification
```

**Undo:** User có thể click lại để un-complete. XP không bị thu hồi (intentional design).

**Skip Confirm:** Sau khi confirm lần đầu, user có thể chọn "Don't ask again today". Preference lưu vào localStorage (`aetheria_skip_quest_confirm`) với date, reset mỗi ngày.

---

## Daily Rollover

Cơ chế đảm bảo quests chưa xong không bị mất:

- **Trigger:** App load, nếu `localStorage['aetheria_quest_rollover_date'] !== today`
- **Action:** `POST /api/v1/quests/rollover` → move tất cả quests `done: false, dueDate < today` sang `dueDate = today`
- **Side effect:** Nếu có quests bị rollover → auto-create PenaltyLog (xem [penalty.md](./penalty.md))
- **Idempotent:** API safe để gọi nhiều lần (không tạo duplicate penalty nếu đã có pending)

---

## Quest vs Habit Quest vs Task Quest

Dashboard hiển thị 3 loại items trong QuestPanel, tất cả được coi là "quests":

| Loại        | Source           | ID prefix    | Done condition                                                        |
| ----------- | ---------------- | ------------ | --------------------------------------------------------------------- |
| Quest       | Quest collection | `<mongo_id>` | `quest.done === true`                                                 |
| Habit Quest | Habit + HabitLog | `habit-<id>` | HabitLog cho hôm nay `done: true`                                     |
| Task Quest  | Task collection  | `task-<id>`  | TaskLog cho hôm nay (multi-day) hoặc `status === 'done'` (single-day) |

Khi toggle một item trong QuestPanel, hệ thống check prefix để route đến đúng handler.
