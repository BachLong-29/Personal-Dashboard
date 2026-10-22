# Theme — sáng, tối, theo hệ thống, không nháy màu

<role>Frontend engineer giữ hai bảng màu chạy song song mà không component nào phải biết đang ở theme nào</role>

<context>
App sinh ra với nền đêm. Light theme được thêm sau (`3572043`, `dbca4a1`, `085594c`) bằng cách đưa
**mọi** màu về CSS token, rồi định nghĩa token hai lần. Theme là lựa chọn theo tài khoản (lưu ở
`UserSetting.theme`, xem `user-setting.md`), nhưng trang công khai chưa có tài khoản nên còn phải
có một lựa chọn cục bộ.
</context>

<task>
Mô tả cách theme được chọn, lưu, áp lên trang khi SSR, và luật dùng token màu.
</task>

<requirement>

## Ba giá trị, hai trạng thái

- **Preference**: `'light' | 'dark' | 'system'` — điều user chọn.
- **Resolved**: `'light' | 'dark'` — điều thực sự áp lên `<html>`. `system` đọc
  `prefers-color-scheme` và **theo dõi thay đổi** (`matchMedia` listener) khi đang ở `system`.

## ThemeProvider — `src/components/providers/ThemeProvider.tsx`

Bọc toàn app trong `Providers`. Expose `useTheme()` → `{ theme, resolvedTheme, setTheme }`.

| Nơi lưu                 | Giữ gì     | Để làm gì                                    |
| ----------------------- | ---------- | -------------------------------------------- |
| localStorage `theme`    | preference | nhớ lựa chọn trên trình duyệt này            |
| cookie `theme-resolved` | resolved   | server biết vẽ class nào ngay trong HTML đầu |

- Mặc định khi localStorage trống: `system`.
- `applyTheme()` gỡ `light`/`dark`, thêm class resolved vào `<html>`, set `style.colorScheme`, và
  ghi cookie (`path=/`, `max-age` 1 năm, `samesite=lax`).
- `setTheme()` chỉ ghi localStorage + state; **không** gọi API — việc lưu lên tài khoản là của
  caller.

## Không nháy màu — `src/app/[locale]/layout.tsx`

Server đọc cookie `theme-resolved`: `'light'` → class `light`, còn lại (kể cả chưa có cookie) →
`dark`. Class và `colorScheme` có sẵn trong HTML đầu tiên, nên **không cần inline script** chặn
render. `<html suppressHydrationWarning>` vì client có thể đổi class ngay sau mount.

Hệ quả: lần đầu tiên tới một trình duyệt chưa có cookie mà hệ thống đang light, trang sẽ vẽ tối
rồi chuyển sáng một lần. Từ lần sau thì không.

Tailwind: `@custom-variant dark (&:where(.dark, .dark *))` — variant `dark:` theo class, không
theo media query.

## Theme theo tài khoản

- **`ThemeSync`** (`src/components/providers/ThemeSync.tsx`, mount trong `(protected)/layout.tsx`):
  khi `useProfile()` có dữ liệu, gọi `setTheme(settings.theme)` **một lần mỗi phiên** (ref
  `synced`). Toggle cục bộ sau đó không bị ghi đè. Nhờ vậy lựa chọn đi theo tài khoản giữa các
  thiết bị.
- **`useUpdateTheme`** (`src/features/profile/hooks/useUpdateTheme.ts`): `PUT /api/v1/profile`
  chỉ với `{ theme }`, rồi `setQueryData` cho profile. Phải lưu, nếu không `ThemeSync` sẽ đảo lại
  lựa chọn ở phiên kế tiếp.
- Mặc định schema là `'dark'` (khác mặc định `system` của provider) — user mới đăng nhập sẽ bị
  kéo về tối cho tới khi chọn.

## Các công tắc

| Chỗ                                                 | Component               | Lưu lên tài khoản?                                      |
| --------------------------------------------------- | ----------------------- | ------------------------------------------------------- |
| Landing (`LandingNav.tsx`), login (`AuthPanel.tsx`) | `ThemeChip` ☾/☀         | Không — chưa có tài khoản                               |
| Sheet mobile của `DashboardTopbar` (<1025px)        | nút ☾/☀ + nhãn          | Có, `useUpdateTheme`                                    |
| `/profile` → Appearance (`AppearanceSection.tsx`)   | radio light/dark/system | Có, khi bấm Save; chọn là xem trước ngay, Revert trả về |

- `ThemeChip` và nút topbar chỉ lật giữa light và dark dựa trên **resolved** — không tới được
  `system`; muốn `system` phải vào Appearance.
- Nút topbar cố ý **không đóng sheet**: sheet đổi màu tại chỗ chính là xác nhận.
- Chuỗi `common.toggleTheme`, `common.themeDark`, `common.themeLight` có ở `en`/`vi`/`th`.
- `ThemeToggle.tsx` chỉ được dùng trong `src/components/layouts/RootLayout.tsx`, mà layout này
  không còn ai import — xem câu hỏi mở.

## Token màu — `src/app/globals.css`

- `:root` = **light**, `.dark` = **dark**. Mọi màu UI đi qua token: nền `--bg-0…4`, `--surface*`,
  `--panel*`; viền `--border`, `--border-hi`, `--border-lo`; chữ `--text-hi/md/lo/dim`; brand
  `--gold*`, `--violet*`, `--cyan`, `--rose`, `--mint`, `--crimson`; `--panel-scrim` cho lớp phủ
  ảnh nền; `--on-gold`, `--on-mint` cho chữ trên nền đặc. `@theme inline` map chúng sang class
  Tailwind (`bg-bg-2`, `border-gold`…).
- **Không hardcode màu tối** (`#07070e`, `bg-black/…`) cho surface dùng chung — trên nền sáng nó
  thành một mảng đen. Ngoại lệ có chủ đích: chip sự kiện đang live giữ token tối.

### `--gold` vs `--gold-fill*`

Trên nền trắng, `--gold` phải **tối** (`#8a5a00`) để chữ vàng đọc được. Nhưng dùng chính màu đó
để **tô nền** nút/chip/checkbox thì ra màu bùn. Nên tách hai vai trò:

| Token              | Light                        | Dark                  |
| ------------------ | ---------------------------- | --------------------- |
| `--gold-fill`      | `rgb(234 171 5)` (vàng sáng) | `var(--gold)`         |
| `--gold-fill-2`    | `oklch(0.72 0.14 82)`        | `var(--gold-2)`       |
| `--gold-fill-deep` | `oklch(0.72 0.14 82)`        | `oklch(0.55 0.12 85)` |
| `--gold-fill-hi`   | `oklch(0.86 0.16 82)`        | `var(--gold-hi)`      |
| `--on-gold-fill`   | `#1f1300` (mực tối)          | `var(--on-gold)`      |

Ở dark, các token này trỏ về giá trị cũ → dark theme không đổi một pixel.

Luật dùng:

- **Bề mặt tô đặc màu vàng** (Button primary, Badge, Checkbox/Radio/Switch bật, Tabs active,
  Pagination, Progress, DatePicker chọn ngày, nút confirm) → `bg-[var(--gold-fill)]`,
  `border-[var(--gold-fill)]`, gradient `from-[var(--gold-fill-2)] to-[var(--gold-fill)]` hoặc
  `--gold-fill-deep → --gold-fill`, chữ `var(--on-gold-fill)`.
- **Chữ, icon, viền mảnh màu vàng** → vẫn `--gold`.
- **Gradient thương hiệu vàng → tím** giữ nguyên `--gold`: nó là nhận diện, không phải nút.

## Câu hỏi mở

- `ThemeToggle` + `RootLayout` là code chết — xoá, hay sẽ dùng lại?
- Desktop (≥1025px) không có công tắc nhanh nào ngoài `/profile` — có chủ đích?
- Có nên đặt mặc định schema về `system` cho khớp provider?

</requirement>

<tone>Màu mới thì thêm token ở cả `:root` lẫn `.dark`; đừng thêm nhánh `dark:` cho từng component.</tone>
