# BUG-020 — Preset giao dịch không kiểm tra ví/category thuộc user, có thể vượt giới hạn 4

|            |                                                                                       |
| ---------- | ------------------------------------------------------------------------------------- |
| Mức độ     | Trung bình                                                                            |
| Loại       | Bảo mật                                                                               |
| Trạng thái | Mở                                                                                    |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code                                               |
| Spec       | [finance-transaction-presets.md](../docs/requirements/finance-transaction-presets.md) |

## Hiện tượng

`POST /finance/presets` nhận `walletId`/`categoryId` mà không kiểm tra chúng có thuộc user không, hay có khớp loại thu/chi không. Giới hạn `MAX_TRANSACTION_PRESETS` được kiểm tra bằng cách đếm rồi mới ghi, nên hai thiết bị gửi cùng lúc có thể vượt quá giới hạn.

## Vị trí trong code

- `src/app/api/v1/finance/presets/route.ts:25,54`

## Hướng sửa đề xuất

Kiểm tra quyền sở hữu và loại; dùng một lệnh ghi nguyên tử (ví dụ `$push` kèm điều kiện độ dài) để giữ giới hạn.
