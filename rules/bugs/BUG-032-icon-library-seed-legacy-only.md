# BUG-032 — Thư viện icon có thể không nạp sẵn ảnh đã dùng cho một số tài khoản

|            |                                                       |
| ---------- | ----------------------------------------------------- |
| Mức độ     | Thấp                                                  |
| Loại       | Cần xác minh                                          |
| Trạng thái | Mở                                                    |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code               |
| Spec       | [icon-picker.md](../docs/requirements/icon-picker.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

`readLibrary` chỉ nạp sẵn (seed) khi field `iconLibrary` chưa có. Field này mặc định là `[]`, nên nếu UserSetting của user bị lưu lại bằng document Mongoose (khiến default được ghi) trước lần đầu mở sheet, bước seed sẽ bị bỏ qua.

## Vị trí trong code

- `src/app/api/v1/icon-library/route.ts` — `readLibrary`
- `src/server/models/user-setting.model.ts` — `iconLibrary` default

## Hướng sửa đề xuất

Bỏ `default: []` hoặc dùng cờ riêng `iconLibrarySeeded`.
