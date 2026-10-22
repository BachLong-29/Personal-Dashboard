# BUG-002 — Nhiều trang cần đăng nhập không được proxy làm mới phiên

|            |                                         |
| ---------- | --------------------------------------- |
| Mức độ     | Cao                                     |
| Loại       | Bug                                     |
| Trạng thái | Mở                                      |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code |
| Spec       | [auth.md](../docs/requirements/auth.md) |

## Hiện tượng

`PROTECTED_ROUTES` chỉ có `/dashboard`, `/marketplace`, `/projects`. Proxy chỉ refresh token và chuyển hướng cho các route này. Các trang `/tasks`, `/finance/**`, `/assistant`, `/profile`, `/achievements`, `/manage/**` thì không: hết access token (15 phút) mà mở thẳng URL hoặc F5 là bị đăng xuất. Ngoài ra `callbackUrl` không được dùng ở đâu.

## Vị trí trong code

- `src/constants/auth.ts:19` — `PROTECTED_ROUTES`
- `src/proxy.ts:35` — `isProtected`

## Hướng sửa đề xuất

Đổi sang danh sách các route public (login, register, landing) và coi mọi route khác dưới `(protected)` là cần đăng nhập, hoặc liệt kê đủ các route. Sau khi đăng nhập, chuyển về `callbackUrl`.
