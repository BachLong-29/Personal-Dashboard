# Schedule Management System Requirement

---

# 1. Mục tiêu tính năng

Xây dựng hệ thống quản lý lịch trình cho:

- Habit
- Quest
- Task

Cho phép:

- lập kế hoạch ngày / tuần / tháng,
- kéo thả,
- reschedule linh hoạt,
- quản lý deadline,
- generate lịch trình thực thi,
- hỗ trợ gameplay system (EXP / Coin / Gems).

---

# 2. Core Philosophy

## Không được xem:

- habit,
- task,
- quest

là cùng một loại entity.

Mặc dù đều hiển thị trên lịch.

Vì:

| Type  | Bản chất                         |
| ----- | -------------------------------- |
| Habit | hành vi lặp lại                  |
| Quest | nhiệm vụ ngắn hạn phát sinh      |
| Task  | công việc dài hạn / planned work |

---

# 3. Core Architecture

## 3.1 Tách 3 layer

| Layer                   | Purpose      |
| ----------------------- | ------------ |
| Template Layer          | định nghĩa   |
| Schedule Layer          | thời gian    |
| Calendar Instance Layer | lịch thực tế |

---

# 4. Entity Requirement

# 4.1 Habit

## Mục tiêu

Duy trì hành vi lặp lại.

---

## Habit Properties

| Field              | Type          |
| ------------------ | ------------- |
| id                 | uuid          |
| title              | string        |
| category           | enum          |
| repeat_type        | weekly/custom |
| estimated_duration | minutes       |
| reward_exp         | number        |
| reward_coin        | number        |
| reward_gems        | number        |
| preferred_schedule | json          |
| valid_window       | time range    |
| allow_override     | boolean       |

---

# Habit Schedule Rule

Ví dụ:

```json
[
  {
    "days": [1, 2, 3],
    "start_time": "19:00"
  },
  {
    "days": [6],
    "start_time": "10:00"
  },
  {
    "days": [0],
    "start_time": "14:00"
  }
]
```

---

# Habit Override Requirement

## Use Case

Bình thường:

```txt
Monday 19:00
```

Tuần sau:

```txt
Monday 09:00
```

---

# Solution

## Override Schedule

Tạo:

```txt
habit_schedule_override
```

---

## Override Structure

| Field               | Type     |
| ------------------- | -------- |
| habit_id            | relation |
| target_date         | date     |
| override_start_time | time     |
| override_duration   | number   |

---

# Priority Rule

| Priority | Source           |
| -------- | ---------------- |
| 1        | Manual Override  |
| 2        | Special Event    |
| 3        | Weekly Schedule  |
| 4        | Default Schedule |

---

# 4.2 Quest

## Mục tiêu

Nhiệm vụ phát sinh nhanh.

---

## Quest Properties

| Field              | Type     |
| ------------------ | -------- |
| id                 | uuid     |
| title              | string   |
| start_date         | datetime |
| due_date           | datetime |
| estimated_duration | number   |
| priority           | enum     |
| reward_exp         | number   |
| reward_coin        | number   |
| reward_gems        | number   |
| status             | enum     |

---

# Quest Rule

## Nếu:

```txt
start_date = due_date
```

=> quest trong ngày.

---

## Nếu:

```txt
start_date < due_date
```

=> multi-day quest.

---

# Quest Scheduling

Quest:

```txt
12/01 → 14/01
duration: 1h
```

KHÔNG có nghĩa:

- làm liên tục 1h mỗi ngày.

Mà nghĩa là:

- cần tổng 1h effort trước deadline.

---

# Requirement

Quest cần có:

| Field              | Meaning           |
| ------------------ | ----------------- |
| estimated_duration | tổng effort       |
| scheduled_duration | thời gian đã plan |
| remaining_duration | còn lại           |

---

# 4.3 Task

## Mục tiêu

Quản lý công việc planned dài hạn.

---

# Task Properties

| Field                    | Type           |
| ------------------------ | -------------- |
| id                       | uuid           |
| title                    | string         |
| start_date               | date           |
| due_date                 | date           |
| estimated_total_duration | number         |
| progress                 | number         |
| schedule_mode            | flexible/fixed |
| priority                 | enum           |

---

# Task Planning Concept

Task KHÔNG bắt buộc:

- phải có giờ cụ thể ngay từ đầu.

Mà:

- có thể chỉ là backlog planned work.

---

# IMPORTANT

# Task khác Calendar Item

Task:

```txt
Build dashboard system
```

Calendar Item:

```txt
Tuesday 8AM → work on dashboard
```

---

# Requirement Architecture

## 1. Task

Là objective.

---

## 2. Task Schedule Block

Là execution block.

Ví dụ:

```json
{
  "task_id": "dashboard",
  "date": "2026-05-26",
  "start_time": "08:00",
  "duration": 120
}
```

---

# 5. Scheduling Flow

# 5.1 Daily Planning Flow

## Mục tiêu

Xem:

- hôm nay làm gì,
- giờ nào,
- còn bao lâu.

---

## Daily View

Hiển thị:

- timeline 24h
- quest
- habit
- task blocks

---

# Daily Timeline UI

| Time  | Item           |
| ----- | -------------- |
| 08:00 | Dashboard Task |
| 10:00 | Meeting Quest  |
| 19:00 | Gym Habit      |

---

# Daily Features

| Feature         |
| --------------- |
| drag block      |
| resize duration |
| quick complete  |
| countdown       |
| overlap warning |
| focus mode      |

---

# 5.2 Weekly Planning Flow

## Mục tiêu

Dùng để:

- plan tuần,
- allocate work,
- kéo thả task.

---

# Weekly View

Hiển thị:

- columns = days
- rows = timeline

---

# Drag & Drop Rules

| Entity     | Drag allowed |
| ---------- | ------------ |
| Habit      | ❌           |
| Quest      | ✅           |
| Task Block | ✅           |

---

# IMPORTANT

# Habit không kéo trực tiếp

Vì:

- habit là recurring rule.

Nếu kéo:

- sẽ phá schedule system.

---

# Habit Edit Flow

Khi click habit:

```txt
Edit only this occurrence?
OR
Edit entire habit?
```

---

# Weekly Task Planning

Ví dụ:

Task:

```txt
Start: 1/1
Due: 10/1
```

User kéo vào:

```txt
Tuesday 8AM
```

---

# Rule

Nếu:

```txt
Tuesday ∉ [start_date, due_date]
```

=> system phải xử lý.

---

# Recommendation

# Có 2 mode

| Mode     | Behavior          |
| -------- | ----------------- |
| strict   | không cho add     |
| flexible | auto adjust range |

---

# Best UX Recommendation

## Flexible Mode

Nếu user kéo:

```txt
outside range
```

Popup:

```txt
This schedule is outside task range.

[Extend due date]
[Move schedule]
[Cancel]
```

---

# Auto Extension Logic

Ví dụ:

Task:

```txt
1/1 → 5/1
```

User add:

```txt
7/1
```

=> system:

```txt
due_date = 7/1
```

---

# 5.3 Monthly View

## Mục tiêu

High-level planning.

---

# Monthly View Features

| Feature              |
| -------------------- |
| heatmap              |
| workload density     |
| streak visualization |
| overdue count        |
| boss schedule        |
| milestone            |

---

# Monthly UX

Không nên hiển thị:

- quá chi tiết timeline.

Nên:

- summary,
- indicators,
- workload.

---

# 6. Scheduling Engine

# 6.1 Unified Calendar Instance

Cuối cùng:

- habit,
- quest,
- task block

đều generate thành:

```txt
calendar_instance
```

---

# Calendar Instance Structure

| Field       | Type             |
| ----------- | ---------------- |
| source_type | habit/task/quest |
| source_id   | relation         |
| date        | date             |
| start_time  | time             |
| end_time    | time             |
| status      | enum             |

---

# Vì sao architecture này mạnh?

Vì UI:

- chỉ render 1 loại object.

---

# 7. Validation Rules

# Overlap Detection

Nếu:

```txt
08:00-10:00
```

đã occupied.

Thêm:

```txt
09:00-11:00
```

=> warning overlap.

---

# Fatigue Detection

Nếu:

- workload > threshold.

=> warning:

```txt
Potential burnout detected.
```

---

# 8. UX Recommendation

# Daily

Execution-focused.

---

# Weekly

Planning-focused.

---

# Monthly

Strategy-focused.

---

# 9. Final Architecture Recommendation

# Không dùng:

```txt
task = calendar item
```

---

# Phải dùng:

| Layer                | Description       |
| -------------------- | ----------------- |
| Habit / Quest / Task | source            |
| Schedule Block       | planned execution |
| Calendar Instance    | rendered item     |

---

# 10. Recommended Final Flow

# Habit

```txt
Habit
 → Schedule Rule
 → Override
 → Calendar Instance
```

---

# Quest

```txt
Quest
 → Optional Schedule
 → Calendar Instance
```

---

# Task

```txt
Task
 → Task Blocks
 → Calendar Instance
```

---

# Kết luận

Thiết kế đúng nhất cho system này là:

## Habit

= recurring identity.

## Quest

= quick temporary mission.

## Task

= long-term objective.

## Calendar Instance

= thứ thực sự hiển thị lên lịch.
