# Google Login (OAuth Third-Party)

<role>Fullstack engineer cho gamified personal dashboard, giữ tương thích với hệ JWT tự viết hiện tại</role>

<context>
App hiện dùng JWT tự viết (access + refresh token qua cookie — xem `auth.md`). Login/Register
hiện chỉ hỗ trợ email + password. UI đã có sẵn nút "Continue with Google" trang trí
(`AuthPanel.tsx`) nhưng chưa hoạt động (không có onClick). Cần thêm đăng nhập qua Google, tái
sử dụng tối đa flow JWT hiện có — **không** dùng NextAuth/next-auth, **không** đổi kiến trúc
cookie/middleware hiện tại.
</context>

<task>
Tích hợp Google Identity Services (GIS): client nhận `id_token` từ nút Google, gửi lên backend
endpoint mới để verify, tìm-hoặc-tạo user, rồi issue access/refresh token giống hệt flow
`/auth/login` hiện tại.
</task>

<requirement>

## Thư viện mới

- `google-auth-library` — verify `id_token` phía server (`OAuth2Client.verifyIdToken`).
- Script `https://accounts.google.com/gsi/client` load ở client (GIS button) — không cần thêm
  npm package cho phần UI.

## Env vars (thêm vào `.env.example`)

```
GOOGLE_CLIENT_ID=              # OAuth 2.0 Client ID từ Google Cloud Console
NEXT_PUBLIC_GOOGLE_CLIENT_ID=  # giống GOOGLE_CLIENT_ID, expose cho client render nút
```

Không cần `GOOGLE_CLIENT_SECRET` — flow ID token không exchange code phía server.

## Thay đổi User Model

```
provider:  'local' | 'google'   // default 'local'
googleId?: string               // sub từ Google id_token, unique + sparse index
password:  string                // đổi thành optional — required chỉ khi provider === 'local'
```

- `email` vẫn unique. User đăng ký bằng password trước, login Google **cùng email** sau →
  merge: gắn `googleId` vào user cũ, giữ nguyên password. Email chưa tồn tại → tạo user mới
  `provider: 'google'`, không có password.
- Validate ở schema: password required chỉ khi `provider === 'local'` (custom validator, không
  dùng `required: true` thẳng).

## API — `POST /api/v1/auth/google`

```typescript
// Request
{
  credential: string;
} // id_token từ Google GIS

// Response 200 (giống hệt /auth/login)
{
  user: {
    (id, email, name, role, avatar, createdAt, updatedAt);
  }
  tokens: {
    (accessToken, refreshToken);
  }
}
```

- Verify `credential` bằng `new OAuth2Client(GOOGLE_CLIENT_ID).verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`.
- Lấy `email`, `name`, `picture`, `sub` (googleId) từ payload **đã verify** — không tin dữ liệu
  client gửi kèm ngoài `credential`.
- Reject nếu `email_verified === false` trong payload.
- Tìm user theo `googleId` trước, fallback theo `email` (merge case), rồi mới tạo mới.
- Set `avatar = picture` nếu user mới hoặc user chưa có avatar.
- Issue token qua `signAccessToken`/`signRefreshToken` hiện có — tái sử dụng nguyên hàm.

## UI — `AuthPanel.tsx`

- Nút "Continue with Google" hiện tại (trang trí, không onClick) → thay bằng GIS render thật:
  load script GIS (`next/script` hoặc `useEffect`), `google.accounts.id.initialize({client_id, callback})`
  - `renderButton(...)` vào 1 div thay cho button cũ.
- Callback nhận `{credential}` → POST `/api/v1/auth/google` (thêm `authEndpoints.google` vào
  `src/services/endpoints/auth.ts`) → `setTokens()` + `setUser()` + `router.push('/dashboard')`
  (tái sử dụng logic `useLogin.ts`, tạo `useGoogleLogin.ts` tương tự).
- 3 nút Discord/GitHub/Apple còn lại **giữ nguyên trang trí** — ngoài phạm vi feature này.
- Responsive: nút GIS co giãn theo container, kiểm tra tại mobile 375px / tablet 768px.

## Reuse / Types

| File                                              | Thay đổi                                                  |
| ------------------------------------------------- | --------------------------------------------------------- |
| `src/server/models/user.model.ts`                 | thêm `provider`, `googleId?`; `password` optional         |
| `src/libs/jwt/index.ts`                           | không đổi — tái dùng `signAccessToken`/`signRefreshToken` |
| `src/app/api/v1/auth/google/route.ts` (mới)       | verify id_token, find-or-create, issue token              |
| `src/services/endpoints/auth.ts`                  | thêm `authEndpoints.google(credential)`                   |
| `src/features/auth/hooks/useGoogleLogin.ts` (mới) | mirror `useLogin.ts`                                      |
| `src/features/auth/components/AuthPanel.tsx`      | wire nút Google thật bằng GIS                             |
| `.env.example`                                    | thêm `GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`   |
| `package.json`                                    | thêm `google-auth-library`                                |

## Edge cases

- Email tồn tại (`provider: 'local'`) → login Google cùng email: merge tài khoản, **không**
  báo lỗi trùng email.
- User `provider: 'google'` login bằng password ở form thường → guard `if (!user.password) return 401`
  trước khi gọi `bcrypt.compare` (tránh crash), trả `401 Invalid credentials` như bình thường.
- `credential` hết hạn / verify fail → `401 Invalid Google token`.
- Không hỗ trợ unlink Google / đổi email qua Google trong phạm vi này.

</requirement>

<tone>Concise, technical. Tái sử dụng tối đa JWT/cookie flow hiện có — không kéo next-auth hay
đổi kiến trúc middleware.</tone>
