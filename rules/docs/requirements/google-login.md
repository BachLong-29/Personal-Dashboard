# Google Login — Google ID token đổi lấy JWT của app

<role>Fullstack engineer gắn Google Identity Services vào hệ JWT tự viết, không kéo next-auth</role>

<context>
Auth của app là JWT tự viết (xem `auth.md`). Google login chỉ là **một cửa vào khác** của cùng
flow đó: client lấy `id_token` từ nút Google, server verify rồi phát đúng cặp access/refresh token
như `/auth/login`. Không NextAuth, không đổi cookie hay proxy.
</context>

<task>
Mô tả Google login như đang chạy: endpoint, gộp tài khoản, nút trên trang login và cách nó báo
lỗi thay vì im lặng.
</task>

<requirement>

## Cấu hình

- Package `google-auth-library` (server). Script GIS `https://accounts.google.com/gsi/client`
  nạp bằng `next/script` (`afterInteractive`), không có npm package cho UI.
- Env (`src/configs/env.ts`, đều optional): `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (client render nút) và
  `GOOGLE_CLIENT_ID` (server). Không cần client secret — flow ID token không đổi code.
- **Thiếu `NEXT_PUBLIC_GOOGLE_CLIENT_ID` thì nút không render** (`return null`), trang login vẫn
  dùng được bằng password.
- Origin của app phải nằm trong "Authorized JavaScript origins" của client ID; nếu không, GIS
  ném lỗi đồng bộ lúc `initialize` (xem phần lỗi bên dưới).

## User model

`provider: 'local' | 'google'` (default `local`), `googleId?` (unique + sparse), `password`
required chỉ khi `provider === 'local'` (validator dạng hàm). Chi tiết ở `auth.md`.

## API — `POST /api/v1/auth/google` (`src/app/api/v1/auth/google/route.ts`)

Body `{ credential }` → response giống hệt `/auth/login`: `{ user, tokens }`.

1. `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`. Verify fail, payload
   thiếu `email`, hoặc `email_verified === false` → `401 Invalid Google token`.
2. Chỉ tin dữ liệu trong payload **đã verify** (`sub`, `email`, `name`, `picture`).
3. Tìm user theo `googleId` trước.
4. Không có → tìm theo `email` (lowercase). Có → **gộp**: gắn `googleId`, giữ nguyên password và
   `provider` cũ, set `avatar = picture` chỉ khi user chưa có avatar.
5. Vẫn không có → tạo user `provider: 'google'`, `name = payload.name ?? email`,
   `avatar = picture`, không password.
6. Ký token bằng `signAccessToken` / `signRefreshToken` như mọi đường login khác.

Vì sao gộp theo email thay vì báo trùng: Google đã xác minh email, nên cùng email chính là cùng
người — bắt họ chọn một cách đăng nhập chỉ tạo thêm tài khoản rác.

Avatar Google là URL `*.googleusercontent.com`, đã có trong `images.remotePatterns` của
`next.config.ts` để `<Image>` vẽ được.

## UI — `src/features/auth/components/GoogleSignInButton.tsx`

Nằm trong hàng "stone" của `AuthPanel.tsx` cạnh Discord/GitHub/Apple (ba nút này vẫn chỉ là
trang trí, không onClick).

**Nút thật nằm vô hình trên nút giả.** Phần nhìn thấy là stone "G" nhiều màu của app; nút GIS thật
(`renderButton`, `type: 'icon'`, `shape: 'circle'`) được render vào một div `opacity-0` phủ kín bên
trên. Iframe của Google mới là thứ nhận click. Lý do: quy định branding của Google cấm đổi màu nút
thật, mà nút gốc lạc tông với panel.

Callback nhận `{ credential }` → `useGoogleLogin` (`src/features/auth/hooks/useGoogleLogin.ts`,
mirror `useLogin`): POST `/auth/google` → `setTokens()` → `setUser()` → push `/dashboard`.

## Không dùng FedCM

Không truyền `use_fedcm_for_button` (bỏ ở `76efd49`). FedCM có cooldown theo origin trong trình
duyệt: một khi bị kích hoạt, `initialize`/`renderButton` bị chặn **im lặng**, code không phát hiện
hay reset được (chỉ xoá site data của accounts.google.com mới gỡ). Flow GIS cũ đáng tin hơn.

## Lỗi phải hiện ra, không được im lặng

Mọi nhánh lỗi gọi `onError` → `AuthPanel` bật `googleError` và hiện `auth-alert kind-error` với
chuỗi i18n `auth.googleLoginError`, đồng thời `console.error` mô tả nguyên nhân:

| Tình huống                                                                | Phát hiện ở đâu                               |
| ------------------------------------------------------------------------- | --------------------------------------------- |
| Script GIS không tải được (mạng, ad-blocker)                              | `<Script onError>`                            |
| GIS báo lỗi                                                               | `error_callback` của `initialize`             |
| Đổi credential thất bại (server `401`, lỗi mạng)                          | `onError` của `googleLogin.mutate`            |
| Nút thật **không bao giờ render** (origin chưa được phép, script bị chặn) | click vào stone khi `buttonReady` còn `false` |

Dòng cuối là fallback: nếu iframe chưa từng được render thì stone chỉ còn là hình vẽ, click vào
không làm gì. `buttonReady` là `useRef` (chỉ đọc trong handler, không cần re-render); click vào
stone khi đó sẽ hiện alert thay vì im lặng. `initialize` lỗi đồng bộ thì bị `try/catch` nuốt và chỉ
log — `buttonReady` vẫn `false`, nên lần click đầu sẽ hiện alert.

`useEffect` khởi tạo chỉ phụ thuộc `[scriptReady, clientId]`: `useMutation` trả object mới mỗi
render, đưa vào deps sẽ init lại GIS liên tục.

## Edge cases

- User Google-only đăng nhập bằng form password → `401 Invalid credentials` (login route chặn
  `!user.password` trước `bcrypt.compare`).
- Không hỗ trợ unlink Google hay đổi email qua Google.

## Câu hỏi mở

- Route dựng `OAuth2Client` từ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (thiếu thì ném lỗi có message
  `GOOGLE_CLIENT_ID is not defined`) nhưng verify với `audience: GOOGLE_CLIENT_ID`. Nếu chỉ đặt một
  trong hai env, login sẽ fail (`500` hoặc `401`). Có nên gom về một biến?
- App Expo có gọi `/auth/google` với credential từ client ID khác (iOS/Android) không? Nếu có thì
  `audience` cần nhận nhiều ID.

</requirement>

<tone>Ngắn, kỹ thuật. Tái dùng tối đa flow JWT/cookie hiện có.</tone>
