# Avatar Upload — ảnh đại diện trên Cloudinary

<role>Engineer giữ avatar của user: một ảnh, một URL, hiện ở profile và topbar</role>

<context>
`User.avatar` là một URL string (xem `auth.md`). Nó có thể đến từ hai nguồn: user tự upload ở
`/profile`, hoặc ảnh Google khi đăng nhập Google lần đầu mà chưa có avatar (xem `google-login.md`).
Chưa có avatar thì UI dùng glyph của companion hoặc chữ viết tắt tên.
</context>

<task>
Cho phép user upload ảnh để thay avatar, lưu trên Cloudinary, hiển thị ở Profile và DashboardTopbar.
</task>

<requirement>

## API — `POST /api/v1/upload/avatar` (`src/app/api/v1/upload/avatar/route.ts`)

- Auth: Bearer (`getAuthUser`), thiếu → `401`.
- `multipart/form-data`, field `file`.
- Chỉ `image/jpeg`, `image/png`, `image/webp`, `image/gif`; tối đa 5 MB. Thiếu file / sai type /
  quá size → `400`.
- Upload qua `uploadAvatarToCloudinary` (`src/libs/cloudinary.ts`): folder `avatars/`,
  `public_id = userId`, `overwrite: true` — mỗi user đúng một file, ảnh mới đè ảnh cũ, không phải
  dọn rác. Transformation `400×400`, `crop: 'fill'`, `gravity: 'face'`, nên không cần UI crop.
- Sau upload: `User.avatar = secure_url`. Response `{ avatar }`.

Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Package `cloudinary`
chỉ import phía server. `next.config.ts` cho phép `res.cloudinary.com` và `*.googleusercontent.com`
trong `images.remotePatterns`.

Khác với upload icon (`/upload/attachment`, xem `icon-picker.md`): avatar ghi đè theo `userId` và
tự cập nhật `User`; attachment tạo file mới mỗi lần và chỉ trả URL.

## Frontend — `src/features/profile/components/AvatarUpload.tsx`

Đặt đầu `IdentitySection.tsx` trên `/profile`.

- Nút tròn 96px. Có `user.avatar` → `next/image`; không có → chữ viết tắt (tối đa 2 chữ cái đầu của
  `user.name`, mặc định `?`) trên nền gradient vàng–tím.
- Hover hiện lớp phủ "CHANGE". Click mở file picker (`accept` 4 loại ảnh trên).
- Kiểm type và size **ở client trước khi gửi**, rồi POST `FormData`.
- Đang upload: overlay tối + spinner trên avatar.
- Thành công: `setUser({ ...user, avatar })` trong `useAuthStore` — mọi chỗ đọc store đổi ngay,
  không refetch.
- Lỗi: dòng chữ đỏ inline ngay dưới avatar (không phải toast). Chuỗi đang hardcode tiếng Anh.
- Reset `input.value` sau mỗi lần chọn để chọn lại cùng file vẫn kích hoạt.

## DashboardTopbar — `src/features/dashboard/components/layout/DashboardTopbar.tsx`

Đọc `useAuthStore((s) => s.user?.avatar)`.

- Desktop (≥1025px): badge 28px trong nút user — ảnh nếu có, không thì `companion.glyph`
  (mặc định `🧝‍♀️`).
- Mobile: `CharacterCard` (`src/components/common/CharacterCard.tsx`) nhận `avatarUrl` và
  `fallbackGlyph`; ảnh căn `top center`. Light theme có khung parchment riêng (`dbca4a1`).

## Ngoài phạm vi

Crop/resize UI · nhiều ảnh / gallery · xoá avatar về mặc định.

## Câu hỏi mở

- Chuỗi lỗi trong `AvatarUpload` chưa qua next-intl (vi phạm luật i18n của repo).
- Avatar chỉ được cập nhật trong store của tab đang mở; tab/thiết bị khác chỉ thấy ảnh mới sau khi
  login lại, vì store persist và không có chỗ nào refetch `/users/me`.
- Giới hạn type/size đang copy ở ba nơi (route, component, `src/constants/upload.ts`) — có nên
  dùng chung hằng `ICON_UPLOAD_*`?

</requirement>

<tone>Đơn giản, không over-engineer. Cloudinary lo transformation.</tone>
