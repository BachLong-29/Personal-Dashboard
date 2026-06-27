# Schedule Engine Requirement

## 1. Tổng quan

### Mục tiêu

Schedule Engine là module trung tâm chịu trách nhiệm:

- Lập lịch cho Habit, Quest, Task.
- Sinh dữ liệu hiển thị cho Dashboard.
- Hỗ trợ Day View, Week View, Month View.
- Phát hiện xung đột lịch.
- Tính toán khối lượng công việc.
- Hỗ trợ reschedule.
- Cung cấp dữ liệu cho Statistics.
- Cung cấp dữ liệu cho Notification.
- Là nền tảng cho AI Planner trong tương lai.

Schedule Engine không phải là UI mà là một domain/service độc lập.

---

# 2. Các thực thể liên quan

## Habit

Là các thói quen lặp lại cần duy trì.

Ví dụ:

- Gym
- Đọc sách
- Thiền
- Học tiếng Anh

Đặc điểm:

- Có lịch lặp lại.
- Có thể thay đổi giờ thực hiện theo từng ngày cụ thể.
- Có thưởng EXP, Coin, Gems.

---

## Quest

Là các nhiệm vụ phát sinh ngắn hạn.

Ví dụ:

- OT hôm nay
- Họp khách hàng
- Đi khám bệnh

Đặc điểm:

- Có hạn chót.
- Có thưởng EXP, Coin, Gems.

---

## Task

Là các công việc được lên kế hoạch trước hoặc thuộc Project.

Ví dụ:

- Xây dựng Dashboard
- Thiết kế UI
- Viết tài liệu

Đặc điểm:

- Có thời lượng ước tính.
- Có ngày bắt đầu.
- Có ngày kết thúc.
- Có thể chia thành nhiều phiên làm việc.

---

# 3. Kiến trúc dữ liệu

## Nguyên tắc

Dashboard không làm việc trực tiếp với Habit, Quest hoặc Task.

Mọi dữ liệu đều được quy đổi về một chuẩn chung:

```txt
Calendar Item
```

---

## Luồng xử lý

```txt
Habit
       \
Quest ----> Schedule Engine
       /
Task

        ↓

Schedule Block

        ↓

Calendar Item

        ↓

Dashboard
```

---

# 4. Habit

## Mục tiêu

Quản lý các thói quen lặp lại.

---

## Ví dụ

Gym:

- Thứ 2: 19h
- Thứ 3: 19h
- Thứ 4: 19h
- Thứ 7: 10h
- Chủ nhật: 14h

---

## Habit Schedule Rule

Cho phép cấu hình:

- Ngày trong tuần
- Giờ bắt đầu
- Thời lượng

Ví dụ:

| Thứ | Giờ   |
| --- | ----- |
| 2   | 19:00 |
| 3   | 19:00 |
| 4   | 19:00 |
| 7   | 10:00 |
| CN  | 14:00 |

---

## Override Habit

Cho phép thay đổi duy nhất một lần thực hiện.

Ví dụ:

Bình thường:

- Thứ 2: 19h

Tuần sau:

- Thứ 2: 09h

Chỉ áp dụng cho ngày đó.

Không ảnh hưởng lịch Habit gốc.

---

## Quy tắc ưu tiên

| Mức ưu tiên | Loại             |
| ----------- | ---------------- |
| 1           | Override         |
| 2           | Special Schedule |
| 3           | Weekly Schedule  |
| 4           | Default Schedule |

---

# 5. Quest

## Mục tiêu

Quản lý các nhiệm vụ phát sinh.

---

## Ví dụ

OT

- Hạn chót: 12/01

=> Quest có deadline trong ngày.

---

## Quy tắc

Quest chỉ có **hạn chót** (`dueDate`), không có ngày bắt đầu / thời lượng.

Quest không bắt buộc phải có giờ cụ thể.

Có thể:

- Chỉ có deadline.
- Hoặc được lên lịch cụ thể trong Dashboard (qua Schedule Block).

---

# 6. Task

## Mục tiêu

Quản lý các công việc dài hạn.

---

## Ví dụ

Task:

```txt
Build Dashboard
```

Thông tin:

- Start Date: 01/06
- Due Date: 10/06
- Estimate: 16 giờ

---

## Nguyên tắc

Task không nên chứa:

- giờ bắt đầu
- giờ kết thúc

Task chỉ là mục tiêu.

---

## Schedule Block

Lịch thực thi của Task.

Ví dụ:

| Ngày  | Giờ   | Thời lượng |
| ----- | ----- | ---------- |
| 03/06 | 08:00 | 2h         |
| 04/06 | 08:00 | 2h         |
| 05/06 | 08:00 | 4h         |

---

## Task Progress

Progress được tính dựa trên:

```txt
Tổng thời gian hoàn thành
/
Tổng thời gian ước tính
```

---

# 7. Schedule Block

## Mục tiêu

Đại diện cho một phiên làm việc cụ thể.

---

## Nguồn sinh

Schedule Block có thể được tạo từ:

- Task
- Quest

Habit sẽ sinh trực tiếp Calendar Item.

---

## Thuộc tính

- Date
- Start Time
- Duration
- Source Type
- Source Id

---

# 8. Calendar Item

## Mục tiêu

Đối tượng duy nhất được hiển thị trên Dashboard.

---

## Thuộc tính

- Title
- Date
- Start Time
- End Time
- Status
- Source Type
- Source Id

---

## Source Type

- habit
- quest
- task

---

# 9. Day View

## Mục tiêu

Tập trung vào thực thi.

---

## Hiển thị

- Habit hôm nay
- Quest hôm nay
- Task Block hôm nay

---

## Timeline

Ví dụ:

| Thời gian | Nội dung        |
| --------- | --------------- |
| 08:00     | Build Dashboard |
| 10:00     | Meeting         |
| 19:00     | Gym             |

---

## Chức năng

- Mark Complete
- Xem chi tiết
- Reminder
- Countdown

---

# 10. Week View

## Mục tiêu

Tập trung vào lập kế hoạch.

---

## Chức năng

### Drag & Drop

Cho phép:

- Quest
- Task Block

Không cho phép:

- Habit

---

## Khi chỉnh Habit

Hiển thị lựa chọn:

```txt
Chỉnh lần thực hiện này

hoặc

Chỉnh toàn bộ Habit
```

---

## Xử lý Task ngoài phạm vi

Ví dụ:

Task:

- Start Date: 01/06
- Due Date: 05/06

Người dùng kéo Task sang 07/06.

---

### Chế độ Strict

Không cho phép.

---

### Chế độ Flexible

Hiển thị:

```txt
Lịch mới nằm ngoài phạm vi Task.

Bạn muốn:

- Gia hạn Task
- Di chuyển lịch
- Huỷ
```

---

# 11. Month View

## Mục tiêu

Theo dõi tổng quan.

---

## Hiển thị

- Khối lượng công việc
- Achievement
- Milestone
- Deadline
- Project Progress

---

## Không hiển thị

- Timeline chi tiết theo giờ

---

# 12. Conflict Detection

## Hard Conflict

Hai lịch trùng giờ.

Ví dụ:

```txt
Gym
19:00 - 20:00

Meeting
19:30 - 20:30
```

---

## Soft Conflict

Khoảng nghỉ quá ngắn.

Ví dụ:

```txt
Task A
10:00 - 12:00

Task B
12:05 - 14:00
```

---

# 13. Capacity Planning

## Mục tiêu

Phát hiện quá tải.

---

Ví dụ:

Người dùng có:

- 10 giờ khả dụng

Đã lên lịch:

- Habit: 3h
- Task: 5h
- Quest: 4h

Tổng:

12h

---

Kết quả:

```txt
Overloaded Day
```

---

# 14. Statistics Integration

Schedule Engine phải cung cấp:

- Planned Hours
- Completed Hours
- Missed Hours
- Completion Rate
- Workload Trend

---

# 15. Notification Integration

Schedule Engine phát sinh:

- Habit Reminder
- Quest Reminder
- Deadline Warning
- Overload Warning
- Conflict Warning

---

# 16. Database Design

## schedule_blocks

| Field       |
| ----------- |
| id          |
| source_type |
| source_id   |
| date        |
| start_time  |
| duration    |
| status      |

---

## calendar_items

| Field       |
| ----------- |
| id          |
| title       |
| source_type |
| source_id   |
| date        |
| start_time  |
| end_time    |
| status      |

---

## habit_schedule_overrides

| Field          |
| -------------- |
| id             |
| habit_id       |
| target_date    |
| new_start_time |
| new_duration   |

---

# 17. MVP Scope

Bao gồm:

- Habit Scheduling
- Habit Override
- Task Scheduling
- Schedule Block
- Calendar Item
- Day View
- Week View
- Month View
- Conflict Detection
- Workload Calculation
- Notification Integration
- Statistics Integration

---

# 18. Ngoài phạm vi MVP

Để Phase sau:

- AI Planner
- Auto Scheduling
- Smart Reschedule
- Burnout Prediction
- Capacity Optimization
- Focus Recommendation
- Intelligent Time Blocking

---

# 19. Kết luận

Schedule Engine là module trung tâm của toàn bộ hệ thống.

Tất cả các module:

- Dashboard
- Statistics
- Notification
- Achievement
- Penalty
- AI Planner

đều sử dụng dữ liệu được sinh ra từ Schedule Engine.

Do đó Schedule Engine phải được thiết kế như một Domain Core thay vì chỉ là một tính năng phụ.

---

# 20. Tài liệu requirements chi tiết

Spec tổng quan này được tách thành các requirement doc theo từng tính năng còn thiếu:

| #   | Doc                                                      | Phạm vi                                          |
| --- | -------------------------------------------------------- | ------------------------------------------------ |
| 1   | [schedule-block.md](./schedule-block.md)                 | Model phiên làm việc + Task Progress             |
| 2   | [calendar-item.md](./calendar-item.md)                   | Lớp chuẩn hóa chung cho Dashboard/Views          |
| 3   | [conflict-capacity.md](./conflict-capacity.md)           | Hard/Soft conflict + overload                    |
| 4   | [schedule-statistics.md](./schedule-statistics.md)       | Số liệu theo giờ + workload trend                |
| 5   | [schedule-notifications.md](./schedule-notifications.md) | Reminder/deadline/overload/conflict warning      |
| 6   | [week-view-rescheduling.md](./week-view-rescheduling.md) | Strict/Flexible + sửa habit "lần này vs toàn bộ" |

**Thứ tự triển khai đề xuất:** Schedule Block + Calendar Item (nền tảng) →
Conflict/Capacity → Statistics/Notifications → Week View rescheduling.
