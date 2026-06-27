# Character Progression

Hệ thống RPG tích hợp vào productivity. Mỗi hành động (hoàn thành quest, habit, task) đều đóng góp vào sự phát triển của nhân vật.

---

## Currencies

| Currency  | Kiếm từ                           | Dùng để                       |
| --------- | --------------------------------- | ----------------------------- |
| **XP**    | Hoàn thành quests/habits/tasks    | Level up                      |
| **Coins** | Hoàn thành quests/habits/tasks    | Mua rewards trong marketplace |
| **Gems**  | Quest difficulty S (5 gems/quest) | Mua rewards premium           |

---

## XP & Level Up

```
XP hiện tại + XP kiếm được ≥ xpNext → Level Up
```

**Level Up logic:**

```typescript
const leveled = newXp >= xpNext;
return {
  xp: leveled ? newXp - xpNext : newXp, // reset về 0 sau khi level up
  level: leveled ? level + 1 : level,
  xpNext: leveled ? Math.round(xpNext * 1.3) : xpNext, // tăng 30% mỗi level
};
```

Mỗi lần level up, threshold tăng 30%:

- Level 1→2: 1000 XP
- Level 2→3: 1300 XP
- Level 3→4: 1690 XP
- ...

---

## Rank System

Rank là milestones lớn hơn level. Rank được set thủ công hoặc tự động khi đạt đủ level.

| Rank | Symbol     | Ý nghĩa     |
| ---- | ---------- | ----------- |
| F    | Beginner   | Mới bắt đầu |
| E    | Novice     | Đang học    |
| D    | Apprentice | Có tiến bộ  |
| C    | Journeyman | Ổn định     |
| B    | Expert     | Thành thạo  |
| A    | Master     | Xuất sắc    |
| S    | Legend     | Đỉnh cao    |

**Rank Demotion:** Penalty tier 3+ có thể demote rank xuống 1 bậc (không thể xuống dưới F).

---

## Hero Stats

5 chỉ số, mỗi chỉ số từ 1-10:

| Stat        | Key | Ý nghĩa                              |
| ----------- | --- | ------------------------------------ |
| Discipline  | DIS | Sức đề kháng với cám dỗ, consistency |
| Wisdom      | WIS | Khả năng học hỏi, phân tích          |
| Endurance   | END | Sức bền cho công việc dài hơi        |
| Composition | COM | Tổ chức, cân bằng                    |
| Serenity    | SER | Sự tĩnh tâm, quản lý stress          |

**Stat Pool:** Mỗi user có `statPool` (default 30) — tổng điểm phân bổ cho stats.

**Hiển thị:** Stats được scale ra 0-100 để hiển thị trong CharacterPanel:

```typescript
display_value = Math.round((raw_value / statPool) * 100);
```

**Stat Loss (Penalty):** Penalty tier 3-4 có thể trừ điểm stats (raw value, min 1).

---

## Streak

Streak = số ngày liên tiếp user hoàn thành ít nhất một quest/habit/task.

- **Tăng:** Hoàn thành bất kỳ item nào trong ngày
- **Reset:** Penalty tier 2+ (streakBreak: true)
- **Bảo vệ:** `streakProtection` setting (0-3 lần bỏ qua không mất streak)
- **Hiển thị:** Streak badge trong Topbar

---

## Rewards kiếm được

| Action  | XP  | Coins | Gems |
| ------- | --- | ----- | ---- |
| Quest S | 150 | 40    | 5    |
| Quest A | 120 | 30    | 0    |
| Quest B | 90  | 25    | 0    |
| Quest C | 60  | 15    | 0    |
| Quest D | 50  | 12    | 0    |
| Habit   | 30  | 10    | 0    |
| Task    | 60  | 15    | 0    |

---

## Classes

Class ảnh hưởng đến narrative và có thể bias stat bonuses:

| Class     | Icon | Stat Focus  |
| --------- | ---- | ----------- |
| Scribe    | ✍    | Wisdom      |
| Ranger    | 🏹   | Endurance   |
| Artificer | ⚙    | Composition |
| Warden    | ☯    | Serenity    |
| Sage      | 🔮   | Wisdom      |
| Forgeborn | ⚔    | Discipline  |

---

## Companions

Companion cung cấp passive bonuses (lore-driven, implementation varies):

| Companion  | Bonus                               |
| ---------- | ----------------------------------- |
| Fox 🦊     | Adaptability +15% XP                |
| Crane 🦢   | Rest quality +20% streak protection |
| Wolf 🐺    | Endurance +10% XP for long tasks    |
| Owl 🦉     | Learning +12% XP for reflect quests |
| Phoenix 🔥 | Comeback +50% streak recovery       |

---

## Achievements / Badges

Badges được earn khi đạt milestones. Categorized theo era và rarity.

**Rarity:** common → uncommon → rare → epic → legendary

**Examples:**

- First Light: Complete first quest
- Week Strider: 7-day streak
- Month Guardian: 30-day streak
- Century Keeper: Complete 100 quests
- Legendary S: Complete 10 S-rank quests

**Display:** User chọn tối đa 4 badges để hiển thị trên hero profile.
