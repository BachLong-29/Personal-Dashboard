---
description: Sửa bug theo quy trình chuẩn — nạp context → cổng Expected → reproduce → vòng giả thuyết/bằng chứng → root cause → fix tối thiểu → verify → self-review → ghi hồ sơ .md
argument-hint: <mô tả bug> [route/file nghi ngờ]
---

# /fix-bug — Vòng lặp sửa một bug (personal-dashboard)

Bug: **$ARGUMENTS** — nếu trống, HỎI tôi mô tả bug (hiện tượng, cách reproduce, kỳ vọng) trước khi làm gì.

Nguyên tắc:

- Sửa **root cause chứ không che triệu chứng**; **diff tối thiểu** (không nhân tiện refactor ngoài phạm vi — YAGNI/SoC).
- **Mọi kết luận phải dựa trên quan sát được, không phải suy luận từ việc đọc code.** Đọc code chỉ sinh ra _giả thuyết_.
- **Không có Expected thì không fix.** Không biết đích đúng là gì thì mọi thay đổi chỉ là đoán (cổng ở **1.2**).
- **Chứng minh** đã hết bug + không tạo regression trước khi báo xong.

Thực hiện **tuần tự**, DỪNG chờ tôi duyệt ở mốc **⏸**. KHÔNG nhảy sang fix khi chưa chỉ ra được nguyên nhân.

---

## 0. BRANCH — theo `CLAUDE.md`

Repo cấm commit thẳng trên `main`/`master`. Kiểm branch hiện tại:

- Đang ở `main`/`master` → tạo và checkout branch mới `bug/<slug-ngắn>`.
- Đang ở branch `bug/...`/`feature/...` sẵn có, cùng phạm vi bug này → dùng luôn, không tạo thêm.
- Đang ở branch khác phạm vi → HỎI tôi trước khi tạo branch mới.

**Output bắt buộc:** `Branch: <tên branch> · (đã có sẵn | vừa tạo mới)`.

---

## 1. NẠP CONTEXT & TÁI HIỆN (reproduce)

### 1.0 Nạp context có sẵn

- Đọc mô tả trong `$ARGUMENTS`/chat. Có link GitHub issue → đọc issue đó (`gh issue view <số>`).
- Từng có hồ sơ debug vùng này chưa: `grep -rln '<route | tên component>' docs/bugs/` (nếu thư mục tồn tại). Có thì đọc trước — loại sẵn được vài nhánh giả thuyết.
- **In ra chat context đã nạp** trước khi sang 1.1.

### 1.1 Viết STEP TÁI HIỆN — bắt buộc, in ra chat trước khi sang bước 2

- Xác định rõ 3 điều: **(a)** hành vi hiện tại (sai) = **Actual**, **(b)** hành vi kỳ vọng (đúng) = **Expected**, **(c)** các bước tái hiện.
- Chưa đủ để chắc chắn tái hiện được → HỎI tôi bổ sung (input, route, locale, user/role, state DB). ĐỪNG đoán mò.

```
## Bug: <tên ngắn 1 dòng>
Route:      /[locale]/(protected)/...            Locale: en | vi | th
Tài khoản:  <email/role cần dùng>          Điều kiện: <state cần có: đã có task/habit/quest, dữ liệu ví/budget…>
Môi trường: local (npm run dev, :3000)      Browser/viewport: <desktop | mobile ≤390px, theo rule responsive>

1. Đăng nhập bằng <tài khoản>
2. Vào <route>, thao tác <hành động cụ thể>
3. …

→ Actual (sai):    <mô tả chính xác cái nhìn thấy>   | ⚠️ THIẾU nếu chưa rõ
→ Expected (đúng): <mô tả chính xác cái đáng lẽ phải thấy>   | ⛔ THIẾU nếu chưa rõ
Tần suất: luôn luôn | ngẫu nhiên (x/10 lần)
```

Quy tắc viết step:

- Mỗi step là **một hành động đơn** kèm **input cụ thể**. Cấm viết chung chung kiểu "thao tác ở trang finance".
- Step cuối cùng phải là **đúng lúc bug lộ ra**.
- Ghi rõ điều kiện tiên quyết (role, dữ liệu có sẵn trong MongoDB, locale) — thiếu là không tái hiện nổi.
- **Thiếu Actual hoặc Expected thì ghi đúng cờ THIẾU, KHÔNG tự chế nội dung cho đủ khuôn.**
- **Giữ nguyên văn block này** — bước 4 verify phải chạy lại đúng nó, bước 6 phải chép nó vào hồ sơ.

### 1.2 ⛔ CỔNG EXPECTED — không có Expected thì KHÔNG FIX

| Tình trạng                    | Xử lý                                                           |
| ----------------------------- | --------------------------------------------------------------- |
| Có Actual + Expected          | ✅ đi tiếp bước 2                                               |
| Có Expected, **thiếu Actual** | ⚠️ đi tiếp có điều kiện — tự tái hiện, ghi Actual quan sát thật |
| **Thiếu Expected**            | ⛔ **DỪNG. TUYỆT ĐỐI KHÔNG SỬA CODE.**                          |
| Thiếu cả hai                  | ⛔ **DỪNG**                                                     |

Thiếu Expected → nói thẳng _"tôi không fix vì chưa biết hành vi đúng là gì"_, đặt câu hỏi cụ thể (không hỏi chung chung), rồi **kết thúc lệnh**. Không "sửa theo cách hợp lý nhất", không tự suy Expected từ Actual/code hiện tại — đó là tự bịa spec.

Ngoại lệ: chính tôi (không phải bạn suy ra) nói rõ hành vi đúng ngay trong chat → ghi Expected kèm `(bạn chốt trong chat, <ngày>)` và đi tiếp.

---

## 2. KHOANH VÙNG → VÒNG GIẢ THUYẾT (bắt buộc — chưa sửa)

### 2.1 Thu hẹp vùng nghi ngờ

Bám luồng chuẩn của repo (App Router + feature layout):

```
src/app/[locale]/(protected)/<route>/page.tsx      # entry route
  → src/features/<feature>/components/...          # UI feature module
    → hooks (local hoặc src/hooks/)                # state/orchestration
      → src/services/endpoints/<domain>.ts          # axios client
        → src/app/api/v1/<domain>/route.ts          # API handler (async-handler + validate.ts)
          → src/server/models/<Model>.ts             # Mongoose schema
```

```bash
# chuỗi UI xuất hiện ở đâu (kể cả key i18n)
grep -rn 'Recipient mobile' src/i18n/locales/en/common.json
grep -rn 'accounts.sepay' src

# route/feature liên quan
grep -rn '<tên hàm | route>' src/app src/features src/services
```

Phân loại bug để sửa đúng tầng (SoC):

- **Render/UI** (sai state suy ra, thiếu `loading/empty/error`, effect sai deps) → component/hook trong `src/features/*`.
- **Data client** (queryKey thiếu tham số, thiếu `invalidateQueries`, cache cũ, sai type response) → `src/hooks/*` + `src/services/endpoints/*` (TanStack Query).
- **Client state** (Zustand) → `src/stores/*` — kiểm selector, có bị stale/không đồng bộ không.
- **Logic thuần** (off-by-one, format ngày/giờ/tiền, edge case) → helper trong `src/libs/*`.
- **i18n / responsive** (hardcode text, layout vỡ ở mobile) → theo section 3 dưới + rule responsive trong `CLAUDE.md`.
- **API/DB** (Zod schema sai, thiếu validate, response format sai, query Mongoose sai) → `src/app/api/v1/**/route.ts`, `src/server/validate.ts`, `src/server/models/*` — xác minh ở **2.3** trước khi động vào FE.
- **Auth** (redirect sai, token hết hạn không refresh) → `src/proxy.ts` + `/api/v1/auth/refresh`.

### 2.2 Truy nguồn regression — bug "trước chạy được, giờ hỏng"

```bash
git log --oneline -20 -- src/features/<feature>/<file>.tsx
git log -p -S'<tên hàm | chuỗi | key i18n>' -- src/
git blame -L <từ>,<đến> src/<file>.tsx
```

- Không khoanh được commit → `git bisect start <bad> <good>`, dùng đúng step 1.1 làm tiêu chí good/bad.
- Tìm ra commit → đọc commit message + diff. Không revert mù: hoàn tác một fix cố ý = tái sinh bug cũ.
- **Output bắt buộc**: `<hash> <subject>` + vì sao nó tạo ra bug — hoặc nói thẳng **"không phải regression, bug có từ đầu"**.

### 2.3 Đối chiếu API ↔ DB (fullstack cùng repo, không đoán)

Đây là monorepo FE+API, contract nằm ngay trong repo — đọc trực tiếp, không đoán:

1. FE gọi gì: `src/services/endpoints/<domain>.ts` (method, path, payload type).
2. Handler tương ứng: `src/app/api/v1/<domain>/route.ts` — request được `validate.ts` (Zod schema) kiểm gì, response qua `response.ts` format thế nào.
3. Schema/model: `src/server/models/<Model>.ts` — field name, type, required, default.
4. Auth cần thiết: token đọc ở đâu (cookie), `src/proxy.ts` có chặn route này không.

Checklist:

| Kiểm              | Cụ thể                                                                              |
| ----------------- | ----------------------------------------------------------------------------------- |
| Tên field         | camelCase FE vs field Mongoose — có mismatch không                                  |
| Zod schema        | field FE gửi có khớp schema `validate.ts` dùng không (required/optional/type)       |
| Response envelope | `response.ts` format response ra sao, FE (`services/endpoints`) bóc đúng field chưa |
| Query Mongoose    | filter/sort/populate đúng chưa, index có thiếu gây kết quả sai không                |
| Auth              | route có bị `proxy.ts` chặn/redirect sai không, token hết hạn có refresh đúng không |

- Lỗi thật nằm ở API/DB → sửa ngay trong cùng vòng fix (đây không phải BE của team khác), nhưng vẫn nêu rõ ở cổng ⏸ trước khi đổi.

### 2.4 Vòng giả thuyết — hypothesis → quan sát → xác nhận/bác bỏ → lặp

**CẤM đọc code rồi tuyên bố root cause.** Mỗi vòng phải đi đủ 4 nhịp và ghi lại:

| H#  | Giả thuyết (phải bác bỏ được)                | Quan sát bằng gì     | Thấy gì (dữ liệu thật)                             | Kết luận    |
| --- | -------------------------------------------- | -------------------- | -------------------------------------------------- | ----------- |
| H1  | `queryKey` thiếu `walletId` nên trả cache cũ | React Query Devtools | key `['transactions']` không đổi khi switch wallet | ✅ xác nhận |

Luật:

- **Một giả thuyết một vòng.** Trước khi quan sát phải nói trước: _"nếu đúng sẽ thấy X, nếu sai sẽ thấy Y"_.
- Giả thuyết bị **bác bỏ cũng phải ghi lại**.
- Công cụ quan sát, ưu tiên rẻ → đắt:
  1. **Network tab** — status, payload gửi đi, response body thật.
  2. **React Query Devtools** (`@tanstack/react-query-devtools` đã cài) — queryKey thật, cache, `isStale`, refetch sau mutation.
  3. **Log tạm** `console.log`/`console.table` ngay nhánh nghi ngờ, đánh dấu `// DEBUG` để gỡ ở bước 3.
  4. **React DevTools** — props/state thật tại lần render sai.
  5. Log tạm ở API route / Mongoose query khi nghi ngờ tầng DB — HỎI tôi trước nếu cần thêm log tốn công.
- **Timebox: 5 vòng.** Chưa ra thì DỪNG, báo tôi đã loại trừ gì, còn nghi gì.
- Chỉ tuyên bố root cause khi có **quan sát trực tiếp** cho thấy giá trị/luồng sai **đúng tại `file:line`**.

### Output bắt buộc ở cổng ⏸ — trình đúng 6 mục, theo thứ tự

0. **Branch & context** — branch đang dùng · nguồn context (chat/issue) · đã đọc hồ sơ `docs/bugs/` cũ chưa.
1. **Nguyên nhân + bằng chứng** — lỗi ở đâu (`file:line`), vì sao nó tạo ra hiện tượng. **BẮT BUỘC kèm bằng chứng quan sát được** (log, response, state thật) + cách lấy. Suy luận thuần từ đọc code KHÔNG tính là bằng chứng.
2. **Sổ giả thuyết** — bảng H1…Hn: cái nào bác bỏ, bằng chứng gì.
3. **Impact** — còn chỗ nào khác dính **cùng** nguyên nhân? `grep -rn` liệt kê call-site/màn hình bị ảnh hưởng. Không có → nói thẳng "không có".
4. **Hướng fix** — sửa gì, ở tầng nào, tại sao chọn cách đó, đã cân nhắc cách khác chưa.
5. **Tóm tắt** — 2–3 dòng: nguyên nhân → cách sửa → phạm vi ảnh hưởng (kèm commit gây ra ở 2.2 nếu có).

**⏸ DỪNG tại đây.** Chỉ sang bước 3 sau khi tôi OK hướng.

---

## 3. FIX TỐI THIỂU

- Sửa đúng root cause, thay đổi nhỏ nhất đủ để đúng. Không đổi public API/props component trừ khi bắt buộc (báo tôi nếu có).
- Không nhân tiện refactor/đổi style vùng xung quanh.
- Theo `rules/docs/react-component-standards.md`: memoization đúng chỗ, tách hook khi component quá tải, không `any`, không cast `as` không lý do.
- Text hiển thị mới → qua `useTranslations()` (next-intl) + thêm key vào `src/i18n/locales/en/common.json` (nguồn), không hardcode chuỗi.
- **Responsive**: mọi thay đổi UI phải test lại ở mobile (`sm:`/`md:`/`lg:`) theo rule trong `CLAUDE.md` — không ship layout chỉ chạy đúng ở desktop.
- Data qua `src/services/endpoints/*` + TanStack Query, xử lý đủ **loading/empty/error**.
- **Fix phải khớp Expected ở 1.1, không hơn.** Thấy chỗ khác cũng sai nhưng ngoài Expected → ghi vào "Còn nợ" ở bước 6, đừng nhân tiện sửa.
- **Gỡ sạch instrument đã chèn ở 2.4**: `grep -rn "DEBUG" src` phải sạch trước khi sang bước 4.

---

## 4. VERIFY — chứng minh hết bug + không regression

- **Bug cũ**: chạy lại **đúng nguyên văn** step ở 1.1 → xác nhận hiện tượng biến mất. Dùng `npm run dev` để mắt thấy thật.
- **Regression**: bảng case cụ thể, không nói chung chung.

  | Case                              | Bước       | Kỳ vọng        | Kết quả |
  | --------------------------------- | ---------- | -------------- | ------- |
  | Bug cũ                            | (step 1.1) | hết hiện tượng |         |
  | Luồng dùng chung <X>              | …          | …              |         |
  | loading / empty / error           | …          | …              |         |
  | Mobile (≤390px) + desktop         | …          | …              |         |
  | 3 locale (en/vi/th) nếu đụng text | …          | …              |         |

- 2.2 chỉ ra commit gây ra → kiểm luôn use-case commit đó cố ý bảo vệ vẫn đúng.
- `npm run format` các file đã đụng.
- `npm run type-check` + `npm run lint` — sửa tới khi **sạch**.

---

## 5. SELF-REVIEW

Chạy `/self-review` (hoặc skill `/code-review`) trên diff. Phân loại **blocker / nên sửa / nit**; tự sửa blocker, nit thì báo tôi.

---

## 6. GHI HỒ SƠ — tạo file `.md` (bắt buộc, làm cuối cùng)

Ghi lại những gì đã kiểm tra và phân tích để người sau không phải debug lại từ đầu.

- Đường dẫn: `docs/bugs/<slug-ngắn>.md` ở gốc repo. Tạo thư mục nếu chưa có.
- Nội dung lấy từ dữ liệu **đã thu trong lúc chạy**, không tái dựng từ trí nhớ.

```markdown
# <slug> — <tên bug 1 dòng>

**Ngày:** YYYY-MM-DD · **Branch:** bug/<slug>
**Phạm vi:** <route/feature> · **File đã sửa:** `src/…:LL`

## 1. Hiện tượng & cách tái hiện

<chép nguyên block step ở 1.1>

## 2. Root cause

`src/…:LL` — <giải thích cơ chế: từ nguyên nhân tới hiện tượng>

**Bằng chứng quan sát được:**

- <quan sát 1 + lấy bằng cách nào>

## 3. Sổ giả thuyết

| H#  | Giả thuyết | Quan sát bằng | Thấy gì | Kết luận  |
| --- | ---------- | ------------- | ------- | --------- |
| H1  | …          | …             | …       | ❌ bác bỏ |

## 4. Truy nguồn regression

- Commit gây ra: `<hash>` `<subject>` — hoặc **không phải regression**.

## 5. Fix

- <đổi gì · tại sao cách này đúng>
- Phương án đã loại: <…> vì <…>

## 6. Verify

<bảng case ở bước 4, kèm kết quả>
type-check ✅ · lint ✅

## 7. Còn nợ / rủi ro

- <giả định chưa xác minh · điểm cần để mắt>
```

---

## Kết thúc — báo cáo ngắn

1. **Branch**: đã dùng/tạo.
2. **Root cause**: nguyên nhân gốc (`file:line`) + bằng chứng chốt.
3. **Fix**: đã đổi gì và tại sao cách này đúng.
4. **Verify**: step 1.1 đã hết bug + phạm vi regression đã kiểm; kết quả type-check/lint.
5. File đã sửa · key i18n mới (nếu có) · điểm cần tôi để mắt.
6. **Hồ sơ**: đường dẫn `docs/bugs/<slug>.md`.

> **KHÔNG commit / push / tạo PR sau khi fix.** Dừng lại ở báo cáo trên, để nguyên diff (kể cả file hồ sơ `.md`) trong working tree cho tôi tự review. Chỉ commit khi tôi bảo.
