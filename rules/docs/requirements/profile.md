# Profile — Hero Identity, chỉnh một bản nháp rồi niêm phong

<role>Fullstack engineer + product designer cho gamified personal dashboard</role>

<context>
`/profile` (`src/features/profile/components/ProfilePage.tsx`) là "Editing Chamber": nơi chỉnh
hero identity **và** các setting của user. Một form duy nhất gom field của hai collection
`UserProfile` và `UserSetting`; lưu bằng một `PUT /api/v1/profile`.

Thay đổi chỉ nằm trong state form cho tới khi user bấm **Reveal hero** → `RevealModal` (animation
niêm phong) → xác nhận mới gọi API. Ngoại lệ duy nhất là theme (xem dưới).
</context>

<task>
Mô tả các section, layout responsive, luật lưu và API của trang profile như đang chạy.
</task>

<requirement>

## Section — `PROFILE_SECTIONS` trong `ProfileSectionNav.tsx`

| #    | id           | Nhãn             | Nội dung                                                                                                                                          |
| ---- | ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| I    | `identity`   | Identity         | Avatar (xem `avatar-upload.md`), Hero name ≤40, Title ≤60, Handle ≤24, Pronouns ≤24, Region ≤40, Sigil (input 1 ký tự, server cho ≤2), Motto ≤120 |
| II   | `class`      | Class & Path     | 6 class `HERO_CLASSES`                                                                                                                            |
| III  | `companion`  | Companion        | 5 companion `HERO_COMPANIONS`                                                                                                                     |
| IV   | `theme`      | Theme & Sigil    | **Accent** `amber · aurora · teal · rose · jade · crimson` (`HERO_ACCENTS`)                                                                       |
| V    | `stats`      | Attributes       | Phân `statPool` vào 5 stat, mỗi stat 1–10; tăng bị chặn nếu vượt pool, "remaining" đỏ khi âm                                                      |
| VI   | `focus`      | Focus Categories | Chọn ≤4 trong 9 `HERO_FOCUSES` (mind, body, craft, spirit, bond, purpose, wealth, flow, system); ô hiện số thứ tự chọn                            |
| VII  | `badges`     | Showcase         | Chọn ≤4 trong `HERO_BADGES` — không có điều kiện earn                                                                                             |
| VIII | `prefs`      | Quest Behaviour  | Bảng dưới                                                                                                                                         |
| IX   | `cash-log`   | Cash Reminder    | Bật/giờ/category + timezone — xem `cash-log-reminder.md`                                                                                          |
| X    | `appearance` | Appearance       | Theme `light · dark · system`                                                                                                                     |

"Theme & Sigil" (IV) là **màu accent** của hero; "Appearance" (X) mới là sáng/tối của app. Hai
khái niệm khác nhau, đừng gộp.

## Quest Behaviour — `PrefsSection.tsx`

| Setting                     | Field                  | Default   | Control                                  |
| --------------------------- | ---------------------- | --------- | ---------------------------------------- |
| Morning ritual prompt       | `morningRitual`        | true      | Switch                                   |
| Nightly review              | `nightlyReview`        | true      | Switch                                   |
| Streak protection           | `streakProtection`     | 1         | Stepper 0–3                              |
| Quest difficulty            | `questDifficulty`      | `rising`  | `gentle · rising · harsh`                |
| Seasonal rites              | `seasonalRites`        | true      | Switch                                   |
| Auto-reclaim stalled quests | `autoReclaim`          | false     | Switch                                   |
| **Daily working hours**     | `dailyCapacityMinutes` | 600 (10h) | Stepper **1–24 giờ**, lưu phút (60–1440) |

Daily working hours ghi vào `UserSetting.schedule.dailyCapacityMinutes` — engine dùng để tính
capacity mỗi ngày (xem `conflict-capacity.md`). UI đếm theo giờ vì không ai nghĩ "540 phút".

## Theme — lưu ngay, khác phần còn lại

- Chọn ở Appearance → `setTheme()` preview tức thì; được lưu khi Reveal. Revert trả cả form lẫn
  theme về giá trị server.
- Nút đổi theme ở `DashboardTopbar` lật sáng↔tối đang hiển thị và **lưu ngay** qua
  `useUpdateTheme` (PUT chỉ `{ theme }`). Đang `system` mà bấm thì thành lựa chọn tường minh.
- `ThemeSync` (layout protected) áp theme đã lưu **một lần mỗi phiên**, để lựa chọn theo tài
  khoản sang máy khác mà không đè các lần toggle sau đó. Chi tiết token màu: `theme.md`.

## Layout

| Bề rộng     | Cột                                  |
| ----------- | ------------------------------------ |
| `<md` (768) | 1 cột; nav thành drawer; HeroCard ẩn |
| `md`        | `220px` nav + form                   |
| `lg`        | `220px` + form + `300px` HeroCard    |
| `xl`        | `260px` + form + `400px` HeroCard    |

- **Mobile top bar** sticky: nút **back** về `/dashboard` (đặt ở đây vì trong drawer nó cách hai
  lần chạm), tiêu đề, nút hamburger mở drawer.
- **Section-nav drawer** rộng 280px, trượt từ trái (`animate-drawer-in-left`), backdrop mờ; Esc
  hoặc chạm backdrop để đóng. Chọn mục → đóng drawer trước, 120ms sau mới scroll — scroll trong
  lúc drawer còn chiếm màn sẽ bị khựng.
- Scroll-spy bằng `IntersectionObserver` tô mục đang xem.
- **Thanh hành động cố định** đáy (Revert · Reveal hero/Save), canh theo cột nav và HeroCard ở
  từng breakpoint. Form có padding đáy đủ để dòng cuối (Daily working hours) không bị thanh che.
  Vì thanh này thường trực, nút Quick Notes nổi **ẩn ở `/profile`** (xem `quick-notes.md`).
- HeroCard (cột phải) là live preview, đổi theo form từng phím gõ.

## API

| Method | Endpoint          | Mô tả                                                               |
| ------ | ----------------- | ------------------------------------------------------------------- |
| `GET`  | `/api/v1/profile` | `{ profile, settings }`; upsert cả hai document nếu chưa có         |
| `PUT`  | `/api/v1/profile` | Body phẳng, mọi field optional; server tách field profile / setting |

PUT nhận partial nên theme, game state (`level, xp, coins…` — xem `character.md`) và form profile
dùng chung một endpoint. Field lồng map vào đường dẫn: `dailyCapacityMinutes` →
`schedule.dailyCapacityMinutes`, `cashLog*` → `cashLog.*`.

## Edge cases

- Nhãn "Autosaving" / "AUTOSAVED" / "VALIDATED" trên nav và thanh hành động là trang trí — **không
  có autosave**. Rời trang trước khi Reveal là mất thay đổi, không có cảnh báo.
- `language`, `timezone` (ngoài Cash Reminder), `compactMode` có trong schema và PUT nhưng
  không có control ở trang này.

## Câu hỏi mở

- Bỏ các nhãn "Autosaving" hay làm autosave thật? Có cần cảnh báo khi rời trang lúc form dirty?
- `morningRitual`, `nightlyReview`, `seasonalRites`, `autoReclaim`, `questDifficulty`,
  `streakProtection` lưu được nhưng chưa thấy code nào đọc — có nên ẩn tới khi có tác dụng?

</requirement>

<tone>Concise, technical. Giữ giọng "Editing Chamber" ở UI, nhưng spec nói thẳng.</tone>
