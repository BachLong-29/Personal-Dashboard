# User Setting — tuỳ chọn theo tài khoản, đi theo user qua mọi thiết bị

<role>Fullstack engineer giữ một document setting duy nhất cho mỗi user, đọc bởi UI lẫn job nền</role>

<context>
Mọi tuỳ chọn không thuộc "nhân vật" (hồ sơ hero, chỉ số, XP/coins — xem `profile.md`,
`character.md`) nằm trong `UserSetting`: giao diện, giờ làm việc, nhắc nhở, múi giờ, thư viện icon.
Lưu ở server chứ không ở localStorage vì cùng một tài khoản dùng trên web và app Expo, và các job
nền (nhắc chi tiêu tiền mặt, nhắc lịch) cần đọc chúng khi không có client nào mở.
</context>

<task>
Mô tả model `UserSetting`, ai đọc/ghi từng field, và các mặc định.
</task>

<requirement>

## Model — `src/server/models/user-setting.model.ts`

Một document mỗi user (`userId` unique). Không có route tạo riêng: được **upsert lười** lần đầu
có route chạm tới (`GET /api/v1/profile`, `/api/v1/icon-library`), mặc định do schema điền.

| Field                                             | Kiểu / mặc định                               | Dùng ở đâu                                                         |
| ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| `theme`                                           | `'dark' \| 'light' \| 'system'`, `'dark'`     | `ThemeSync`, topbar toggle, Appearance — xem `theme.md`            |
| `timezone`                                        | string, `'UTC'`                               | Giờ nhắc cash log (`cash-log-notifications.ts`)                    |
| `schedule.dailyCapacityMinutes`                   | 60–1440, `600`                                | "Daily working hours" — WeekView, SessionPlanner                   |
| `schedule.minBreakMinutes`                        | 0–240, `15`                                   | Soft conflict (`detectConflicts`) ở calendar insights và nhắc lịch |
| `schedule.habitReminderLead`                      | 0–240, `15`                                   | Nhắc trước habit (`schedule-notifications.ts`)                     |
| `schedule.questReminderLead`                      | 0–240, `30`                                   | Nhắc trước quest block                                             |
| `schedule.deadlineWarningDays`                    | 0–14, `1`                                     | Cảnh báo deadline; điểm deadline ở `task-suggestion.ts`            |
| `schedule.scheduleMode`                           | `'strict' \| 'flexible'`, `'flexible'`        | Chưa nơi nào đọc                                                   |
| `cashLog.enabled`                                 | bool, `true`                                  | Bật nhắc ghi chi tiêu tiền mặt cuối ngày                           |
| `cashLog.time`                                    | `HH:MM`, `'22:00'`                            | Giờ nhắc, đọc theo `timezone` của user                             |
| `cashLog.categoryIds`                             | ObjectId[], **không có default**              | Danh mục chi tiêu cần nhắc — xem `cash-log-reminder.md`            |
| `iconLibrary`                                     | string[], `[]`                                | Ảnh icon đã upload, mới nhất trước — xem `icon-picker.md`          |
| `morningRitual`, `nightlyReview`, `seasonalRites` | bool, `true`                                  | Switch trong Preferences; chưa có logic đọc                        |
| `autoReclaim`                                     | bool, `false`                                 | Switch "Auto-reclaim stalled quests"; chưa có logic đọc            |
| `streakProtection`                                | 0–3, `1`                                      | Stepper "free skips/tuần"; chưa có logic đọc                       |
| `questDifficulty`                                 | `'gentle' \| 'rising' \| 'harsh'`, `'rising'` | SegRadio; chưa có logic đọc                                        |
| `language`                                        | string, `'en'`                                | Lưu được qua API, không có UI, không ảnh hưởng locale              |
| `compactMode`                                     | bool, `false`                                 | Lưu được qua API, không có UI, không nơi nào đọc                   |

**Vì sao `cashLog.categoryIds` không có `default: []`:** mảng rỗng phải nghĩa là "user cố ý bỏ
tick hết", khác với "chưa cấu hình". Khi chưa có, `resolveCashLogCategoryIds` suy mặc định từ
**tên** danh mục finance của chính user thay vì hardcode id.

Các field `schedule.*` có `DEFAULT_SCHEDULE_SETTINGS` export kèm; service đọc setting bằng
`.lean()` và fallback về hằng này, vì document cũ có thể thiếu field con.

## API — `GET` / `PUT /api/v1/profile` (`src/app/api/v1/profile/route.ts`)

Setting không có route riêng; nó đi chung với profile trong `CombinedProfileResponse`
`{ profile, settings }`.

- `GET` upsert cả `UserProfile` lẫn `UserSetting` rồi trả về. `settings` **được làm phẳng**:
  `dailyCapacityMinutes`, `cashLogEnabled`, `cashLogTime`, `cashLogCategoryIds` thay cho object
  lồng. Không trả `iconLibrary` và các `schedule.*` còn lại.
- `PUT` nhận body **partial** (Zod, mọi field optional), tách key profile và key setting, `$set`
  từng path (`schedule.dailyCapacityMinutes`, `cashLog.time`…) nên không ghi đè field con khác.
  Nhờ partial, `useUpdateTheme` chỉ gửi `{ theme }` mà không cần cả form.
- Chỉ ghi được qua PUT: các bool/enum ở bảng trên, `language`, `timezone`, `theme`,
  `compactMode`, `dailyCapacityMinutes`, `cashLogEnabled`, `cashLogTime`, `cashLogCategoryIds`.
  `minBreakMinutes`, các reminder lead, `deadlineWarningDays`, `scheduleMode` **không có đường
  ghi** — luôn là mặc định.
- `iconLibrary` chỉ ghi qua `/api/v1/icon-library`.

## UI — `/profile` (`src/features/profile/components/ProfilePage.tsx`)

- **Preferences** (`PrefsSection.tsx`): các switch nghi thức, streak protection, quest difficulty,
  "Daily working hours" (nhập giờ, lưu `giờ × 60`, kẹp 60–1440).
- **Cash Reminder** (`CashLogSection.tsx`): bật/tắt, giờ, danh mục, `timezone` (gợi ý nút dùng múi
  giờ thiết bị khi khác giá trị đang lưu).
- **Appearance** (`AppearanceSection.tsx`): light / dark / system, xem trước ngay, lưu khi bấm Save.
- Form lưu bằng thanh action cố định cuối trang; Revert trả cả form lẫn theme về bản đã lưu.

## Câu hỏi mở

- `morningRitual`, `nightlyReview`, `seasonalRites`, `autoReclaim`, `streakProtection`,
  `questDifficulty` có UI nhưng chưa có hành vi nào đọc chúng — giữ như cài đặt "đặt trước", hay
  ẩn đi cho tới khi có logic?
- `language` không nối với locale của next-intl; `compactMode` và `scheduleMode` không có tác dụng.
- Thiếu đường chỉnh `minBreakMinutes` và các reminder lead — có cần đưa vào Preferences?
- Nội dung cũ của file này (XP, gold, gems, công thức level `300 × L^1.5`, rank) thuộc
  `UserProfile`; công thức đó không tìm thấy trong code.

</requirement>

<tone>Bảng là nguồn tra cứu; thêm field mới thì ghi rõ "ai đọc nó", không chỉ "nó là gì".</tone>
