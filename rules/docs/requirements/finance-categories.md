# Finance — Categories — nhãn thu/chi, tự phân loại giao dịch đồng bộ

<role>Fullstack engineer cho module Finance</role>

<context>
`FinanceCategory` tách hẳn khỏi `Category` (tag của Task/Habit) — hai thứ khác nghĩa, không dùng
chung. Lúc đầu chỉ có bộ seed mặc định, hook create/delete viết sẵn mà không chỗ nào dùng.

Giao dịch SePay trước đây luôn rơi vào "Khác" — đúng cái category user cũng tự chọn bằng tay, nên
budget gắn với "Khác" bị đếm lẫn tiền chưa ai phân loại.
</context>

<task>
Tab Categories riêng, tạo nhanh category ngay trong form transaction/budget, và luật keyword để
giao dịch đồng bộ tự vào đúng category.
</task>

<requirement>

## Dữ liệu — `src/server/models/finance-category.model.ts`

| Field               | Kiểu                     | Ghi chú                                                  |
| ------------------- | ------------------------ | -------------------------------------------------------- |
| `name`              | string ≤50, trim         | `(userId, name, type)` unique                            |
| `type`              | `'income' \| 'expense'`  | **Bất biến** sau khi tạo                                 |
| `icon`              | string (emoji)           | Chỉ emoji — xem dưới                                     |
| `color`             | 7 màu `TaskColor`        |                                                          |
| `keywords`          | string[], default `[]`   | Khớp nội dung giao dịch ngân hàng                        |
| `excludeFromTotals` | boolean, default `false` | Tiền không phải thu/chi — xem [finance.md](./finance.md) |

`type` không sửa được (`PATCH` không nhận): lật income ↔ expense sẽ để mọi transaction cũ nằm
dưới một category trái `type` của chính nó.

## Seed

`GET /categories` lần đầu (user chưa có category nào) insert sẵn
(`src/app/api/v1/finance/categories/route.ts`):

- **expense**: Ăn uống, Di chuyển, Mua sắm, Hoá đơn, Giải trí, Sức khoẻ, Khác, **Chưa phân loại**
- **income**: Lương, Thưởng, Khác, **Chưa phân loại**

## API

| Method   | Endpoint                         | Ghi chú                                                                      |
| -------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `GET`    | `/api/v1/finance/categories`     | `?type=`; auto-seed; sort `createdAt↑`                                       |
| `POST`   | `/api/v1/finance/categories`     | `name type icon color keywords?`                                             |
| `PATCH`  | `/api/v1/finance/categories/:id` | `name icon color keywords excludeFromTotals`                                 |
| `DELETE` | `/api/v1/finance/categories/:id` | 409 nếu còn transaction tham chiếu, hoặc còn budget tháng hiện tại/tương lai |

Lỗi 409 trả `message` cụ thể; `FinanceCategoriesPage` hiện nguyên câu đó qua toast thay vì
"xoá thất bại" chung chung.

## Tự phân loại giao dịch đồng bộ (keyword rules)

Trong webhook SePay (`src/app/api/v1/webhooks/sepay/route.ts`):

1. `haystack` = `content + ' ' + description`, chữ thường
2. Xét các category **cùng `type`** với giao dịch và có `keywords` không rỗng
3. Keyword (trim, lowercase) là **chuỗi con** của haystack → khớp
4. Nhiều keyword khớp → **keyword dài nhất thắng** (cụ thể hơn thì đúng hơn: `grab food` thắng `grab`)
5. Không khớp gì → category **Chưa phân loại** cùng type (upsert nếu user đã xoá)

Rơi vào "Chưa phân loại" chứ không phải "Khác": "Khác" là category user chủ động chọn, trộn tiền
chưa phân loại vào đó làm sai budget gắn với nó. Chỉ áp cho giao dịch **mới** — không chạy lại trên
row cũ khi keyword thay đổi.

## UI

**Tab Categories** (`/finance/categories`, `FinanceCategoriesPage.tsx`): hai nhóm expense / income
tách riêng, mỗi nhóm có nút thêm và empty state; thêm, đổi tên, đổi icon, đổi màu, xoá (qua confirm
modal của app).

**Form** (`FinanceCategoryFormModal.tsx`):

- Icon chọn qua `IconPickerSheet` — **chỉ emoji**, vì icon category được in dạng text trong
  select, label và file CSV budget
- Keywords: ô nhập + chip, Enter để thêm, bỏ trùng
- Switch `excludeFromTotals` kèm hint
- Prop `lockType` + `defaultType`: dùng khi mở từ chỗ chỉ nhận một type

**Tạo nhanh** — nút `＋ New category` cạnh ô category ở:

- `TransactionFormModal`: khoá theo type đang chọn, tạo xong **tự chọn** category mới
- `BudgetFormModal`: khoá `expense`

**Chọn category trong form transaction**: `Select searchable selectedFirst` (giống form task),
chấm màu cạnh mỗi option, `searchText` = tên thuần để filter khớp. Đổi type thì xoá lựa chọn, nên
list và lựa chọn không lệch nhau.

## Nơi `excludeFromTotals` ảnh hưởng UI

- Ẩn khỏi picker của `BudgetFormModal` và khỏi template CSV budget — đặt hạn mức cho nó sẽ hiện
  0% mãi mãi
- Vẫn chọn được trong form transaction (đó là cách ghi một lần chỉnh số dư)

## Edge cases

| Case                             | Xử lý                                               |
| -------------------------------- | --------------------------------------------------- |
| Tạo trùng `(name, type)`         | Unique index → lỗi                                  |
| Xoá "Chưa phân loại"             | Được (nếu không còn tham chiếu); webhook tự tạo lại |
| Keyword rỗng / toàn khoảng trắng | Zod `min(1)` sau trim → bị từ chối                  |

## Nợ đã biết

`POST /categories` nhận `excludeFromTotals` trong schema nhưng **không lưu** — category tạo mới
với switch bật vẫn ra `false`; phải sửa lại lần nữa mới có hiệu lực.

</requirement>

<tone>Ngắn, nói lý do thay vì mô tả lại code.</tone>
