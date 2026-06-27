# WeekStats Panel

Panel tổng kết thống kê tuần hiển thị phía trên WeekView trong trang Tasks.

---

## Mục tiêu

Cung cấp cái nhìn nhanh về hiệu suất trong tuần hiện tại: số quest hoàn thành, XP kiếm được, và các chỉ số phụ.

---

## Vị trí

Nằm ở đầu **TaskWeekView** (`src/features/tasks/components/week/`), hiển thị trước grid 7 cột của tuần.

---

## Thống kê hiển thị

| Stat           | Label        | Màu    | Dữ liệu                                               |
| -------------- | ------------ | ------ | ----------------------------------------------------- |
| Quests Cleared | `done/total` | gold   | Từ tasks/habits/quests của tuần đang xem              |
| XP Earned      | `+{xp}`      | violet | Tổng XP từ các items đã done trong tuần               |
| Combo          | `×N`         | cyan   | Số ngày liên tiếp có ít nhất 1 item done (trong tuần) |
| Streak         | `Nd`         | rose   | Streak hiện tại của user (từ profile)                 |
| Focus Hours    | `{h}h`       | mint   | Tổng thời gian focus timer trong tuần                 |

**Lưu ý:** Combo, Streak, Focus Hours hiện tại là **hardcode mock** (`×3`, `14d`, `16.5h`) — chưa có data thực.

---

## Layout

### Desktop (≥ md breakpoint)

5 StatCard hiển thị ngang hàng, mỗi card có:

- Label nhỏ phía trên (uppercase, tracking)
- Giá trị lớn ở giữa (font-title, màu theo stat)
- Sub-label nhỏ phía dưới (optional)
- Border-top 2px màu của stat

### Mobile (< md)

2 hàng:

- **Hàng 1:** 2 StatCard lớn (Quests Cleared + XP Earned)
- **Hàng 2:** 3 StatPill nhỏ ngang (Combo + Streak + Focus Hours) — layout compact với border-left thay border-top

---

## Data Source

| Stat                      | Nguồn thực tế                                                             |
| ------------------------- | ------------------------------------------------------------------------- |
| Quests Cleared, XP Earned | Tính từ `tasks` prop được truyền vào (`UITask[]`), filter `done === true` |
| Combo                     | Chưa có — cần tính từ task logs của 7 ngày trong tuần                     |
| Streak                    | Chưa có — cần lấy từ `UserProfile.streak`                                 |
| Focus Hours               | Chưa có — cần tích lũy từ FocusTimer sessions                             |

---

## Trạng thái hiện tại

✅ Đã implement: component UI đầy đủ, responsive, 2 layout (desktop card / mobile pill).

🟡 Chưa làm:

- Combo tính từ data thực (ngày liên tiếp có done item trong tuần).
- Streak lấy từ profile API thay vì hardcode.
- Focus Hours tích lũy từ FocusTimer (hiện timer không lưu sessions).
- Dữ liệu phạm vi tuần (tuần đang xem) chứ không phải tuần hiện tại cố định.
