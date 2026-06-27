# Guild Panel

Panel hiển thị danh sách guild members trên cột phải của dashboard. Là tính năng social/community của app.

---

## Mục tiêu

Tạo cảm giác cộng đồng — user thấy "đồng đội" của mình đang online/offline, khuyến khích duy trì streak và hoàn thành quests.

---

## Vị trí

Cột phải dashboard, bên dưới FocusTimer và QuoteCard. Có thể ẩn/hiện qua setting `showGuildPanel`.

---

## Dữ liệu Guild Member

```typescript
{
  name: string; // tên hiển thị
  level: number; // level hiện tại
  avatar: string; // emoji đại diện
  online: boolean; // trạng thái online
}
```

---

## Trạng thái hiện tại

**Hiện tại hoàn toàn hardcode** với 4 members cố định:

| Name         | Level | Avatar | Online |
| ------------ | ----- | ------ | ------ |
| Zephyr Cole  | 31    | 🧙‍♂️     | ✅     |
| Nova Kim     | 28    | 🧝‍♀️     | ✅     |
| Rein Ashford | 19    | ⚔️     | ❌     |
| Luna Vale    | 22    | 🌙     | ✅     |

---

## UI Layout

```
┌─────────────────────────────┐
│ GUILD                3 online│
├─────────────────────────────┤
│ 🧙‍♂️  Zephyr Cole   Lv.31  ● │
│ 🧝‍♀️  Nova Kim      Lv.28  ● │
│ ⚔️   Rein Ashford  Lv.19  ○ │
│ 🌙  Luna Vale      Lv.22  ● │
└─────────────────────────────┘
```

- Header: title "GUILD" + count online members (màu mint).
- Mỗi row: avatar emoji + name + level + online dot.
- Online dot: màu mint + glow nếu online, màu text-lo nếu offline.

---

## Hướng phát triển (chưa implement)

Guild Panel hiện là **cosmetic/placeholder**. Để trở thành tính năng thực, cần xác định:

| Câu hỏi                   | Quyết định cần làm                          |
| ------------------------- | ------------------------------------------- |
| Guild members là ai?      | Chỉ bạn bè được invite, hay open community? |
| Online status lấy từ đâu? | WebSocket realtime, hay polling?            |
| Có tương tác không?       | Click member → xem profile? Gửi cheer?      |
| Data lưu ở đâu?           | Cần thêm Guild/GuildMember model            |

**Hiện tại:** Giữ nguyên hardcode, không implement backend. Khi có yêu cầu cụ thể sẽ viết reqs riêng.

---

## Trạng thái hiện tại

🟡 Partial — UI hoàn chỉnh nhưng data hardcode. Không có model, không có API.
