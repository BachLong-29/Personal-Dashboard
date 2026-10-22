# Auth — JWT hai tầng, dùng chung cho web và app Expo

<role>Fullstack engineer giữ cho một hệ JWT tự viết chạy được trên cả web lẫn mobile client</role>

<context>
Không dùng NextAuth. Đăng nhập (email/password hoặc Google — xem `google-login.md`) trả về cặp
access + refresh token; web giữ chúng trong cookie, app Expo giữ ở phía nó. Mọi API route đọc
token từ header `Authorization: Bearer`, **không** đọc cookie — đó là điều cho phép cùng một API
phục vụ cả hai client.
</context>

<task>
Mô tả auth như đang chạy: model, token, các route, cách guard trang, cách giữ phiên khi access
token hết hạn, và những gì chưa có.
</task>

<requirement>

## User model — `src/server/models/user.model.ts`

| Field      | Ghi chú                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------ |
| `email`    | unique, lowercase, trim                                                                    |
| `name`     | required, trim (register yêu cầu ≥2 ký tự)                                                 |
| `password` | bcrypt cost 12; **chỉ required khi `provider === 'local'`**                                |
| `provider` | `'local' \| 'google'`, default `'local'`                                                   |
| `googleId` | `sub` của Google, unique + sparse                                                          |
| `role`     | `'user' \| 'admin' \| 'moderator'`, default `'user'` — chưa route nào phân quyền theo role |
| `avatar`   | URL — xem `avatar-upload.md`                                                               |

## Token — `src/libs/jwt/index.ts`

- Access: payload `{ sub, email, role }`, hạn `ACCESS_TOKEN_EXPIRY` (default `15m`).
- Refresh: payload `{ sub }`, hạn `REFRESH_TOKEN_EXPIRY` (default `7d`).
- Cả hai ký HS256 bằng `AUTH_SECRET`. Refresh token **không lưu DB** → không revoke được trước
  hạn; chấp nhận được cho app một người dùng.
- `TOKEN_MAX_AGE` trong `src/constants/auth.ts` (15 phút / 7 ngày) phải khớp hai env trên — cookie
  hết trước token hay ngược lại đều gây đăng xuất khó hiểu.

## API — `src/app/api/v1/auth/*`

| Route                 | Body                                     | Kết quả                                                     |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| `POST /auth/register` | `name, email, password, confirmPassword` | `201` user (không kèm token); `409` nếu email đã có         |
| `POST /auth/login`    | `email, password`                        | `{ user, tokens: { accessToken, refreshToken } }`           |
| `POST /auth/refresh`  | `refreshToken`                           | cặp token **mới** (rotation); `401` nếu token hỏng/user mất |
| `POST /auth/google`   | `credential`                             | giống `/auth/login` — xem `google-login.md`                 |
| `GET /users/me`       | header Bearer                            | user hiện tại (không password)                              |

- Login: email lowercase trước khi tìm. Sai email, sai password, hoặc tài khoản Google-only (không
  có `password`) đều trả cùng `401 Invalid credentials` — không lộ email nào tồn tại.
- Register **không** tự đăng nhập: `useRegister` chuyển về `/login`.
- Password theo `passwordSchema` (`src/libs/validations/common.ts`): ≥8 ký tự, có chữ hoa, có số.

## Xác thực API — `src/server/helpers/get-auth-user.ts`

`getAuthUser(req)` chỉ đọc `Authorization: Bearer <token>` và verify access token; trả payload
hoặc `null` (route tự trả `401`). Cookie không bao giờ được đọc ở API.

**Vì sao Bearer chứ không phải cookie:** app Expo không có cookie của domain web. Web client
(`src/libs/axios/instance.ts`) tự đọc cookie bằng `document.cookie` rồi gắn header — nên cookie
token **cố ý không `httpOnly`**; bật `httpOnly` là web tự đăng xuất khỏi chính API của nó.

**CORS** (`next.config.ts`, `headers()` trên `/api/:path*`): cho phép đúng một origin
`http://localhost:8081` (dev server Expo), methods `GET,POST,PUT,PATCH,DELETE,OPTIONS`, headers
`Content-Type, Authorization`. Không dùng `*` và không `Allow-Credentials`: client gửi token qua
header nên không cần cookie, và wildcard sẽ bị trình duyệt từ chối nếu có credentials.

## Lưu token phía web

| Cookie          | Max-Age | Thuộc tính                                   |
| --------------- | ------- | -------------------------------------------- |
| `access_token`  | 15 phút | `path=/`, `SameSite=Strict`, `Secure` ở prod |
| `refresh_token` | 7 ngày  | như trên                                     |

Ghi bởi `setTokens()` (client) và `writeTokenCookies()` trong `src/proxy.ts` (server) — **hai nơi
phải cùng thuộc tính**, lệch `path` hay `sameSite` là trình duyệt giữ hai cookie trùng tên.
User info lưu thêm ở Zustand `useAuthStore` (persist key `auth-storage`) để vẽ UI không cần fetch.

## Giữ phiên — hai lớp refresh

1. **Trong SPA** — interceptor axios: gặp `401` thì gọi `/auth/refresh` một lần, xếp hàng các
   request đang chờ, retry. Refresh fail hoặc không có refresh token → `clearTokens()` và
   `window.location.href = '/login'`.
2. **Khi điều hướng full-page** — `src/proxy.ts`. Cookie access chết sau 15 phút trong khi cookie
   refresh còn nhiều ngày; proxy chạy trước mọi JS client nên interceptor không kịp ra tay. Trước
   đây mỗi phiên kết thúc đúng phút 15 ở cú click link đầu tiên (fix `c6bb64c`). Nay:
   - Không có access cookie + vào protected route + có refresh cookie → proxy `fetch`
     `POST /api/v1/auth/refresh` (matcher bỏ qua `/api` nên không đệ quy).
   - Thành công: ghi token mới vào **cả request** (để layout protected đọc `cookies()` ngay trong
     render này) **và response** (để không phải refresh lại ở mọi điều hướng tiếp theo).
   - Thất bại hoặc lỗi mạng: không crash, rơi xuống nhánh redirect login.

## Guard trang — `src/proxy.ts` + `(protected)/layout.tsx`

- Proxy bỏ prefix locale (`localePrefix: 'as-needed'`) rồi so với `PROTECTED_ROUTES`
  (`/dashboard`, `/marketplace`, `/projects` — so theo `startsWith`).
- Protected mà không có token → redirect `/{locale}/login?callbackUrl=<pathname>`.
- Vào `/login` khi đã có token → redirect `/dashboard`. (`/register` không bị chặn.)
- Còn lại giao cho middleware `next-intl`. Matcher: `/((?!api|_next|_vercel|.*\\..*).*)`.
- Lớp thứ hai: `src/app/[locale]/(protected)/layout.tsx` verify access cookie phía server; không
  hợp lệ → `redirect('/login')` (không kèm `callbackUrl`).

## Logout — `src/features/auth/hooks/useLogout.ts`

Chỉ phía client: `clearTokens()` → `clearAuth()` → `queryClient.clear()` → push `/login`.
Không có API logout; refresh token cũ vẫn hợp lệ tới hết hạn.

## Trang login

`AuthScene.tsx` làm tròn toạ độ tính từ `Math.cos/sin` về độ chính xác cố định: Node và trình
duyệt có thể lệch bit cuối, sinh chuỗi SVG khác nhau → hydration mismatch (fix `0a8bd8e`).
`AuthPanel` có `ThemeChip` (xem `theme.md`) và chuỗi đã i18n.

## Chưa có

API logout / revoke refresh token · quên mật khẩu (`AUTH_ROUTES.FORGOT_PASSWORD` có hằng nhưng
không có trang) · xác minh email · phân quyền theo `role` · origin CORS lấy từ env.

## Câu hỏi mở

- `/tasks`, `/profile`, `/finance`, `/manage`, `/achievements`, `/assistant` nằm trong
  `(protected)` nhưng **không** có trong `PROTECTED_ROUTES` → proxy không refresh cho chúng; hết
  access token mà điều hướng full-page vào đó thì layout redirect thẳng về login. Có nên thêm vào
  danh sách?
- `(protected)/layout.tsx` redirect mà không giữ `callbackUrl`; login cũng luôn push `/dashboard`
  chứ không đọc `callbackUrl` — tham số này hiện không được dùng.

</requirement>

<tone>Ngắn, nêu lý do. Đổi bất cứ thuộc tính cookie nào thì đổi ở cả `proxy.ts` lẫn `libs/cookies`.</tone>
