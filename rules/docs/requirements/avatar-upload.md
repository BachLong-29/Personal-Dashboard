<role>Engineer implementing avatar upload for a gamified personal dashboard</role>

<context>
User model đã có field `avatar?: string` (URL string). DashboardTopbar hiện dùng companion glyph emoji làm avatar. Profile page chưa có chỗ upload ảnh. Upload.tsx component đã tồn tại nhưng chưa kết nối backend.
</context>

<task>
Cho phép user upload ảnh để thay thế avatar. Ảnh được lưu trên Cloudinary. Avatar hiển thị ở DashboardTopbar và Profile page.
</task>

<requirement>

## API

| Method | Endpoint                | Mô tả                                                 |
| ------ | ----------------------- | ----------------------------------------------------- |
| `POST` | `/api/v1/upload/avatar` | Upload avatar lên Cloudinary, lưu URL vào User.avatar |

### POST /api/v1/upload/avatar

- Accept: `multipart/form-data`, field tên `file`
- Chỉ accept image types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max size: 5 MB
- Upload lên Cloudinary folder `avatars/`, public_id = `userId`
- Xóa ảnh cũ trên Cloudinary (overwrite: true) trước khi upload mới
- Sau upload: cập nhật `User.avatar = secure_url`
- Response: `{ avatar: string }` (URL đầy đủ từ Cloudinary)
- Lỗi: 400 nếu không có file / sai type / quá size; 401 nếu không có auth

## Frontend: AvatarUpload Component

- Vị trí: `src/features/profile/components/sections/AvatarUpload.tsx`
- Hiển thị: avatar hình tròn 96px
  - Nếu có `user.avatar`: hiển thị `<Image>` từ URL Cloudinary
  - Nếu chưa có: hiển thị placeholder (initials từ `user.name` hoặc icon)
- Click vào avatar → mở file picker (chỉ image, max 5MB)
- Sau khi chọn file: gọi POST /api/v1/upload/avatar bằng FormData
- Trong khi upload: hiển thị loading spinner overlay trên avatar
- Upload thành công: cập nhật avatar trực tiếp trong UI (optimistic hoặc refetch)
- Upload lỗi: hiển thị toast error
- Tích hợp vào IdentitySection.tsx, đặt trên đầu section

## Frontend: DashboardTopbar

- Nếu `user.avatar` tồn tại: hiển thị `<Image>` tròn thay thế emoji glyph
- Nếu không có avatar: giữ nguyên logic companion glyph hiện tại (fallback)

## Cloudinary Config

- Env vars cần thêm vào `.env.local`:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Package: `cloudinary` (server-side only, không import ở client)

</requirement>

<tone>
Implement đơn giản, không over-engineer. Không cần crop/resize UI — để Cloudinary tự handle với transformation. Không cần gallery / multiple photos.
</tone>
