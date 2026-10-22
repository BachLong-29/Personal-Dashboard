# BUG-022 — Đặt số dư âm bằng tay được, nhưng sau đó mọi khoản chi bị từ chối

|            |                                                               |
| ---------- | ------------------------------------------------------------- |
| Mức độ     | Trung bình                                                    |
| Loại       | Cần quyết định                                                |
| Trạng thái | Mở                                                            |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                       |
| Spec       | [finance-wallets.md](../docs/requirements/finance-wallets.md) |

> ⚠️ Vị trí hoặc chi tiết lấy từ báo cáo đối chiếu spec, chưa được xác minh lại trực tiếp trong code. Hãy kiểm tra trước khi sửa.

## Hiện tượng

Luật "wallet không âm" chặn khoản chi nhập tay làm số dư âm, nhưng ô sửa số dư lại cho đặt số âm. Ví đã âm thì không ghi thêm khoản chi nào được nữa.

## Vị trí trong code

- `src/app/api/v1/finance/wallets`
- `src/app/api/v1/finance/transactions`

## Hướng sửa đề xuất

Chặn số âm ở ô sửa số dư, hoặc cho phép khoản chi khi ví đã âm sẵn từ trước.
