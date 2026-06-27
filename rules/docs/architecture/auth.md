# Authentication & Authorization

---

## Overview

App sử dụng **JWT stateless authentication** với hai loại token:

| Token         | Nơi lưu                            | TTL     | Dùng để              |
| ------------- | ---------------------------------- | ------- | -------------------- |
| Access Token  | HTTP-only cookie (`access_token`)  | 15 phút | Xác thực mọi request |
| Refresh Token | HTTP-only cookie (`refresh_token`) | 7 ngày  | Lấy access token mới |

Không dùng `localStorage` để tránh XSS. Cả hai token đều là HTTP-only cookies nên JavaScript phía client không đọc được.

---

## Login / Register Flow

```
Client                              Server
  │                                   │
  ├─ POST /api/v1/auth/login ────────►│
  │   { email, password }             │
  │                                   ├─ bcrypt.compare(password, hash)
  │                                   ├─ signAccessToken({ sub, email, role })
  │                                   ├─ signRefreshToken({ sub })
  │                                   ├─ Set-Cookie: access_token=<jwt>; HttpOnly
  │                                   └─ Set-Cookie: refresh_token=<jwt>; HttpOnly
  │◄──────────────────────────────────┤
  │   { user, accessToken }           │
  │                                   │
  ├─ Zustand auth.store.setUser()     │
  └─ React Query invalidate           │
```

**Register** tương tự, thêm bước tạo `UserProfile` và `UserSetting` mặc định.

---

## Route Protection

### Server-side (Protected Layout)

```typescript
// src/app/[locale]/(protected)/layout.tsx
async function getSession() {
  const token = cookies().get(TOKEN_KEYS.ACCESS)?.value;
  return token ? verifyAccessToken(token) : null;
}

// Nếu không có session hợp lệ → redirect /login
if (!session) redirect(`/${locale}/login`);
```

### Client-side (Penalty Gate)

Sau khi qua auth guard, `PenaltyGate` client component:

1. Fetch `GET /api/v1/penalty` (pending penalty)
2. Nếu có penalty `status: 'pending'` → render `PenaltyModal` over toàn bộ nội dung
3. Không thể dismiss modal cho đến khi hoàn thành penalty quest

### API-level

Mọi API route trong `/api/v1/*` (trừ auth) gọi `getAuthUser(req)`:

```typescript
// src/server/helpers/get-auth-user.ts
function getAuthUser(req: NextRequest): AccessTokenPayload | null {
  const auth = req.headers.get('Authorization'); // "Bearer <token>"
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyAccessToken(auth.slice(7));
}
```

Payload chứa: `{ sub: userId, email, role }`.

---

## Token Refresh Flow

Khi access token hết hạn (server trả 401), Axios interceptor tự động làm mới:

```
Client (Axios interceptor)          Server
  │                                   │
  ├─ Request thất bại (401) ─────────►│
  │                                   │
  ├─ Thêm vào retry queue             │
  │                                   │
  ├─ POST /api/v1/auth/refresh ──────►│
  │                                   ├─ verify refresh_token cookie
  │                                   ├─ sign new access_token
  │                                   └─ Set-Cookie: access_token=<new>
  │◄──────────────────────────────────┤
  │                                   │
  ├─ Retry tất cả requests trong queue│
  │                                   │
  └─ Nếu refresh thất bại:            │
     ├─ clearTokens()                 │
     └─ redirect /login               │
```

**Race condition safety:** Nếu nhiều request cùng nhận 401 đồng thời, chỉ một lần refresh được gọi. Các request còn lại được queue và retry sau khi refresh xong.

---

## JWT Structure

```typescript
// Access Token Payload
interface AccessTokenPayload {
  sub: string; // userId (ObjectId string)
  email: string;
  role: 'admin' | 'user' | 'moderator';
  iat: number;
  exp: number;
}

// Refresh Token Payload
interface RefreshTokenPayload {
  sub: string; // userId only
  iat: number;
  exp: number;
}
```

Cả hai token dùng chung `AUTH_SECRET` (HMAC SHA-256).

---

## Logout

```typescript
// Clear cả hai cookies + auth store
clearTokens(); // xóa cookie
authStore.clearAuth(); // xóa Zustand state
router.push('/login');
```
