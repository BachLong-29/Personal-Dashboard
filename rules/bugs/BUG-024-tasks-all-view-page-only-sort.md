# BUG-024 — Sắp xếp và lọc trạng thái ở view All chỉ áp dụng trong trang hiện tại

|            |                                           |
| ---------- | ----------------------------------------- |
| Mức độ     | Trung bình                                |
| Loại       | Bug                                       |
| Trạng thái | Mở                                        |
| Phát hiện  | 2026-10-22, khi đối chiếu spec với code   |
| Spec       | [tasks.md](../docs/requirements/tasks.md) |

## Hiện tượng

View All phân trang ở server (20 dòng/trang), nhưng sắp xếp và lọc trạng thái lại chạy ở client trên 20 dòng đó. Tham số `sort` của API thì không có chỗ nào trong UI gọi tới.

## Vị trí trong code

- `src/features/tasks/components/TaskManagement.tsx`
- `src/app/api/v1/tasks/route.ts` — tham số `sort`

## Hướng sửa đề xuất

Gửi sort và status lên API.
