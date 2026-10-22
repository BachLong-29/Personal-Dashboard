# BUG-001 — Google login không kiểm tra token được cấp cho app nào

|            |                                                         |
| ---------- | ------------------------------------------------------- |
| Mức độ     | Cao                                                     |
| Loại       | Bảo mật                                                 |
| Trạng thái | Mở                                                      |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                 |
| Spec       | [google-login.md](../docs/requirements/google-login.md) |

## Hiện tượng

`verifyIdToken` được gọi với `audience: process.env.GOOGLE_CLIENT_ID`, nhưng `.env` chỉ có `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. `audience` vì vậy là `undefined`, và có thể thư viện bỏ qua bước kiểm tra audience. Khi đó server chấp nhận cả ID token Google cấp cho một app khác, rồi tìm hoặc tạo tài khoản theo email trong token. Dòng 15 lại kiểm tra `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, nên lỗi không lộ ra lúc chạy.

## Vị trí trong code

- `src/app/api/v1/auth/google/route.ts:15` — kiểm tra biến `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `src/app/api/v1/auth/google/route.ts:26` — `verifyIdToken({ audience: process.env.GOOGLE_CLIENT_ID })`

## Hướng sửa đề xuất

Dùng cùng một biến `clientId` (đã kiểm tra ở dòng 15) cho `audience`. Thêm test: token có `aud` khác phải bị từ chối.
