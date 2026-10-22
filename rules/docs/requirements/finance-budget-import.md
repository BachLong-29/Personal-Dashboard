# Budget Import — dựng ngân sách cả tháng từ một bảng

<role>Fullstack engineer thêm lối nhập hàng loạt cho ngân sách</role>

<context>
Đặt ngân sách phải bấm **từng khoản một** qua `BudgetFormModal`. Một tháng 16 khoản là 16 lần
mở modal, chọn category, gõ số, lưu.

Trong khi đó bảng ngân sách thường đã tồn tại sẵn ở dạng khác — ghi tay, note, ChatGPT, Excel:

```
#   Khoản chi     Số tiền
1   🏠 Home       5.000k
```

Một dòng ở đó = đúng một `Budget { categoryId, month, limit, recurring }`. Model không thiếu
field nào, chỉ thiếu đường đưa dữ liệu vào.
</context>

<task>
Tải template CSV về, điền số, dán hoặc tải lên, xem trước rồi ghi cả tháng một lần.
</task>

<requirement>

## Template là cơ chế chính xác, không phải tiện ích

Rủi ro lớn nhất của tính năng này **không phải parse, mà là ghép tên**. `Nhà thờ` và `Church`
là cùng một khoản; `Coffee` và `Cafe` cũng vậy. Ghép sai thì tạo category trùng, tiền chia đôi,
và **không có gì báo lỗi**.

Template sinh từ **chính category của người dùng**, nên tên khớp **theo cấu trúc** chứ không nhờ
thuật toán đoán. Rủi ro chỉ quay lại với dòng gõ tay — và dòng đó hiện `+ new` ở xem trước.

Template (`buildBudgetTemplate`, `src/features/finance/budget-csv.ts`) có header `Month,YYYY-MM` +
`Recurring,yes|no`, cột `#,Khoản chi,Số tiền,Lặp`, rồi **mọi** category expense dạng
`{icon} {name}` — **trừ category `excludeFromTotals`** (không bao giờ tích chi tiêu, hạn mức trên nó
sẽ 0% mãi) — và một dòng `Tổng` cuối. **Số tiền để trống**. Vì vậy "bỏ qua dòng trống" là hành
vi cốt lõi chứ không phải ngoại lệ: tải về 21 dòng, điền 16.

CSV **phải có BOM UTF-8**. Thiếu nó Excel trên Windows đọc `Ăn trưa` thành `Ä‚n trÆ°a`.

## Đọc số tiền

`k` = ×1000. Dấu `.` và `,` **chỉ là phân cách nghìn** (cách viết Việt Nam), bị bỏ đi trước khi
nhân. Nên bốn cách viết này ra cùng một số **5.000.000₫**:

```
5000k   5.000k   5,000k   5000000
```

Ô không đọc được thì **ném lỗi**, không đoán. Một con số đoán sai còn tệ hơn một dòng bắt người
dùng sửa — sai 1000 lần vẫn là số hợp lệ, không ai phát hiện.

Đây cũng là lý do **bước xem trước là bắt buộc**, không phải tuỳ chọn: nó hiện số đã diễn giải
dưới dạng `5.000.000₫`, đọc là thấy ngay.

## Tháng và lặp — ba tầng ưu tiên

```
cột Lặp từng dòng  →  header Recurring  →  mặc định: có lặp
header Month       →  lựa chọn trên màn  →  tháng trang đang xem
```

File thắng UI. Có vậy template mới thực sự "mang theo cấu hình", mà parser vẫn chịu được bảng
dán tay không có header. Header nhận cả `Month/Tháng`, `Recurring/Lặp`. Lặp **không có** lựa chọn
trên màn: thiếu cả cột lẫn header thì mặc định **có** — một bảng ngân sách thường là kế hoạch cho
các tháng sau, không phải một lần.

Tháng quá khứ bị chặn ở **cả hai chỗ**: nút Import trên trang, và trong modal — vì file có thể
mang tháng riêng, khác tháng trang đang xem.

## Các luật còn lại

- Dòng `Tổng` / `Tong` / `Total` / `Sum` → **ngân sách tổng tháng** (`categoryId` bỏ trống, model đỡ sẵn)
- Cùng một category xuất hiện hai lần → **lấy dòng cuối**
- Category chưa có → tạo mới, **icon lấy từ emoji đầu tên**, màu random trong 7 màu hợp lệ
- Trùng ngân sách đã có → hiện ở xem trước, **tick từng dòng** mới ghi đè; mặc định không ghi

## Tháng đã có giao dịch — hỏi lần hai

Import **không** đụng transaction nào (`spent` là suy ra), nhưng nó dời thước đo dưới những con
số đã ghi: phần trăm và Monthly Report của tháng tính lại, mà cảnh báo vượt ngân sách chỉ bắn
**một lần mỗi tháng** — siết limit giữa tháng có thể trôi qua im lặng. Nên tháng đã có transaction
thì mở modal xác nhận với checkbox "I understand — import anyway".

Đồng ý được lưu **dưới dạng tháng** (`ackedMonth`), không phải boolean: đổi tháng là tự rút lại.

## Parse ở client, không ở server

Xem trước phải **tức thì** — nó là thứ duy nhất chặn giữa dấu chấm gõ nhầm và một ngân sách nhỏ
hơn nghìn lần. Xem trước tốn một vòng mạng mỗi lần sửa là xem trước không ai đọc.

Dán text và chọn file đều cho ra **một chuỗi**, nên một parser lo cả hai lối vào của Q1.

Server vẫn validate lại toàn bộ: tháng, `limit ≥ 1`, tối đa 200 dòng, quyền sở hữu category.
Dòng có `categoryId` của user thì dùng thẳng; không thì ghép theo tên **chuẩn hoá** (trim +
lowercase, `  ăn trưa` = `Ăn Trưa`) trên category expense hiện có; vẫn không khớp mới tạo mới.
Response `{ budgets, importedCount, createdCategories }`.

## Vì sao có endpoint riêng

`POST /finance/budgets` trả **409** khi category+tháng đã có ngân sách. Đúng cho một lần tạo lẻ —
chưa ai nhìn thấy va chạm. Nhưng mọi dòng tới `/budgets/import` đều đã qua mắt người dùng ở bước
xem trước, nên nó **upsert** thay vì từ chối.

## Ngoài phạm vi

Import giao dịch · xuất ngân sách hiện có · XLSX · lịch sử import / hoàn tác · ngân sách cho
category `income` · sửa tên category lúc import.

## Nợ đã biết

Chuỗi để tiếng Anh như các màn finance khác.

`5.5k` sẽ ra `55.000₫` chứ không phải `5.500₫`, vì dấu `.` luôn được coi là phân cách nghìn.
Bước xem trước là chỗ bắt được, và cách viết đó hiếm trong bối cảnh này.

</requirement>

<tone>Ngắn, nói lý do thay vì mô tả lại code.</tone>
