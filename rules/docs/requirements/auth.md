# Auth Flow

Hệ thống xác thực dùng JWT hai tầng (access token + refresh token). Đây là single-user web app nên không có email verification hay password recovery phức tạp.

---

## User Model

```typescript
{
  email:    string    // lowercase, unique, required
  name:     string    // tối thiểu 2 ký tự
  password: string    // bcrypt hash (cost 12)
  role:     'user' | 'admin' | 'moderator'  // default: 'user'
  avatar?:  string    // URL ảnh đại diện (optional, chưa dùng)
}
```

---

## JWT Token Design

### Access Token

- **Payload:** `{ sub: userId, email, role }`
- **Expiry:** `ACCESS_TOKEN_EXPIRY` env var (default `15m`)
- **Dùng để:** Xác thực mọi API request (đọc từ cookie)

### Refresh Token

- **Payload:** `{ sub: userId }`
- **Expiry:** `REFRESH_TOKEN_EXPIRY` env var (default `7d`)
- **Dùng để:** Lấy access token mới khi hết hạn

Cả hai token dùng chung `AUTH_SECRET` (HMAC-SHA256 via `jsonwebtoken`).

**Lưu ý quan trọng:** Hiện tại refresh token **không được lưu vào DB** — không thể revoke token trước khi hết hạn. Đây là trade-off đơn giản chấp nhận được cho single-user app.

---

## API Routes

### `POST /api/v1/auth/register`

```typescript
// Request
{
  name: string; // min 2 ký tự
  email: string; // valid email
  password: string; // theo passwordSchema (xem validation)
  confirmPassword: string; // phải khớp password
}

// Response 201
{
  (id, email, name, role, createdAt, updatedAt);
}
```

- Trả `409` nếu email đã tồn tại.
- Password được hash bcrypt cost 12 trước khi lưu.
- Không tự động login sau register — user phải login riêng.

### `POST /api/v1/auth/login`

```typescript
// Request
{ email: string, password: string }

// Response 200
{
  user:   { id, email, name, role, avatar, createdAt, updatedAt },
  tokens: { accessToken, refreshToken }
}
```

- Email không phân biệt hoa thường (lowercase trước khi tìm).
- Sai email hoặc password → `401 Invalid credentials` (không phân biệt để tránh user enumeration).

### `POST /api/v1/auth/refresh`

```typescript
// Request
{ refreshToken: string }

// Response 200
{ accessToken: string, refreshToken: string }
```

- Verify refresh token bằng `AUTH_SECRET`.
- Tìm user theo `sub` — nếu user bị xóa → `401`.
- Trả về **cặp token mới** (rotation): access token mới + refresh token mới.

---

## Middleware (proxy.ts)

Next.js middleware chạy trước mọi request, xử lý 2 việc:

1. **i18n routing** — delegate sang `next-intl` middleware.
2. **Auth guard:**

```
Request vào protected route
  │
  ├─ Có cookie accessToken?
  │    └─ Cho qua → next-intl xử lý
  │
  └─ Không có token → redirect /login?callbackUrl=<current_path>

Request vào /login
  │
  ├─ Đã có token → redirect /dashboard
  └─ Chưa có    → cho qua
```

**Protected routes:** tất cả routes trong `src/app/[locale]/(protected)/` — `/dashboard`, `/tasks`, `/habits`, `/profile`, `/marketplace`, `/rewards`.

**Public routes:** `/login`, `/register`.

**Matcher:** Middleware chỉ chạy trên UI routes, bỏ qua `/api/**`, `/_next/**`, files tĩnh.

---

## Token Storage

Tokens được lưu trong **HTTP cookies** (set từ client sau khi login thành công):

| Cookie         | Nội dung          |
| -------------- | ----------------- |
| `accessToken`  | JWT access token  |
| `refreshToken` | JWT refresh token |

Middleware đọc `accessToken` từ cookie để kiểm tra auth. Client cũng lưu user info vào Zustand `authStore` (persist localStorage) để hiển thị UI mà không cần re-fetch.

---

## Validation Rules

| Field      | Rule                                                         |
| ---------- | ------------------------------------------------------------ |
| `email`    | valid email format                                           |
| `password` | theo `passwordSchema` trong `src/libs/validations/common.ts` |
| `name`     | min 2 ký tự                                                  |

---

## Trạng thái hiện tại

✅ Đã implement: register, login, refresh, middleware auth guard.

🟡 Chưa làm:

- Logout API (chỉ clear cookie client-side).
- Refresh token revocation / blacklist.
- Password reset / forgot password.
- Email verification khi register.
- Token tự động refresh khi access token hết hạn (client-side interceptor).
