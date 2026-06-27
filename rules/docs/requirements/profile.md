# Profile & Hero Identity

Route: `/profile`

Trang profile cho phép user tùy chỉnh toàn bộ hero identity, stats, class, companion và preferences.

---

## Sections

### 1. Identity

Thông tin cơ bản của hero:

| Field     | Max       | Default       |
| --------- | --------- | ------------- |
| Hero Name | 40 ký tự  | "Hero"        |
| Title     | 60 ký tự  | ""            |
| Handle    | 24 ký tự  | ""            |
| Pronouns  | 24 ký tự  | "they / them" |
| Region    | 40 ký tự  | ""            |
| Sigil     | 2 ký tự   | "✦"           |
| Motto     | 120 ký tự | ""            |

### 2. Class Selection

6 classes, mỗi class có stat focus khác nhau:

| Class     | Icon | Stat        |
| --------- | ---- | ----------- |
| Scribe    | ✍    | Wisdom      |
| Ranger    | 🏹   | Endurance   |
| Artificer | ⚙    | Composition |
| Warden    | ☯    | Serenity    |
| Sage      | 🔮   | Wisdom      |
| Forgeborn | ⚔    | Discipline  |

### 3. Companion Selection

5 companions với passive bonuses:

| Companion  | Bonus                     |
| ---------- | ------------------------- |
| Fox 🦊     | +15% XP (adaptability)    |
| Crane 🦢   | +20% streak protection    |
| Wolf 🐺    | +10% XP (endurance tasks) |
| Owl 🦉     | +12% XP (reflect quests)  |
| Phoenix 🔥 | +50% streak recovery      |

### 4. Stats Allocation

Phân bổ `statPool` (default 30) vào 5 stats:

- Discipline, Wisdom, Endurance, Composition, Serenity
- Mỗi stat: min 1, max 10
- Tổng không vượt quá `statPool`

### 5. Primary Focus

Chọn tối đa **4 focus areas** trong 9 lĩnh vực:

`Mind` | `Body` | `Craft` | `Spirit` | `Bond` | `Purpose` | `Wealth` | `Flow` | `System`

Dùng để categorize quests/habits theo lĩnh vực phát triển.

### 6. Accent / Theme

Màu sắc chủ đạo của UI:

`Amber` | `Aurora` | `Teal` | `Rose` | `Jade` | `Crimson`

### 7. Badges Display

Hiển thị badges đã kiếm được. User có thể:

- Xem tất cả badges (earned + unearned)
- Chọn tối đa 4 badges làm "featured" hiển thị trên hero card

### 8. Settings / Preferences

#### Ritual Settings

| Setting        | Default | Mô tả              |
| -------------- | ------- | ------------------ |
| Morning Ritual | true    | Nhắc nhở buổi sáng |
| Nightly Review | true    | Nhắc nhở buổi tối  |

#### Gameplay Settings

| Setting           | Default | Mô tả                                           |
| ----------------- | ------- | ----------------------------------------------- |
| Streak Protection | 1       | Số ngày bỏ qua không mất streak (0-3)           |
| Quest Difficulty  | rising  | Ảnh hưởng quest generation: gentle/rising/harsh |
| Seasonal Rites    | true    | Bật sự kiện theo mùa                            |
| Auto Reclaim      | false   | Tự động phục hồi streak khi quay lại            |

#### Display Settings

| Setting      | Default | Mô tả                 |
| ------------ | ------- | --------------------- |
| Language     | en      | en / vi / th          |
| Timezone     | UTC     | Timezone của user     |
| Theme        | dark    | dark / light / system |
| Compact Mode | false   | Giao diện thu gọn     |

---

## API

| Method | Endpoint          | Mô tả                             |
| ------ | ----------------- | --------------------------------- |
| `GET`  | `/api/v1/profile` | Lấy profile + settings (combined) |
| `PUT`  | `/api/v1/profile` | Cập nhật profile + settings       |

Response của `GET /api/v1/profile`:

```typescript
{
  profile: UserProfileData,
  settings: UserSettingData
}
```

---

## HeroCard Preview (Live Preview)

Trong profile page, có live preview của HeroCard và RevealModal:

- Cập nhật real-time khi user thay đổi fields
- Hiển thị hero name, title, class, companion, rank, level, stats, badges
- RevealModal (cinematic animation) khi lần đầu setup profile

---

## Auto-init

Khi user register, `UserProfile` và `UserSetting` được tạo tự động với default values. User không cần phải setup trước khi dùng app.
