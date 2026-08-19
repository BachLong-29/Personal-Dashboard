---
description: i18n (next-intl) — trích chuỗi hardcode sang t(), dịch sang locale mới, hoặc audit chuỗi còn sót
argument-hint: <file|thư mục> [locale, vd vi | th | all] [--audit]
---

Xử lý i18n cho: **$ARGUMENTS**

Stack: `next-intl` (`src/i18n/config.ts`, `src/i18n/request.ts`). Locale hợp lệ: `en` (mặc định, nguồn dịch), `vi`, `th` — danh sách thật lấy từ `locales` trong `src/i18n/config.ts`, không hardcode. Mỗi locale chỉ có **một file** `src/i18n/locales/<locale>/common.json`, key lồng nhau theo namespace = feature (`auth`, `nav`, `search`, `finance`, `marketplace`, `dashboard`, …).

Chọn chế độ theo tham số: có locale (`vi`/`th`) hoặc `all` → **B (dịch)**; có `--audit` → **C (audit)**; còn lại → **A (trích hardcode)**.

## A. Trích chuỗi hardcode sang i18n (mặc định)

Trong file/thư mục đã cho, tìm mọi text hiển thị cho user còn hardcode (JSX text, placeholder, `aria-label`, message lỗi, tiêu đề…) và chuyển sang `next-intl`:

1. Component chưa có → thêm `import { useTranslations } from 'next-intl';` rồi `const t = useTranslations('<namespace>');` ở đầu component (client component — đảm bảo file có `'use client'`).
   - `namespace` = key top-level đã có khớp feature (`src/features/<feature>` → tra namespace tương ứng trong `common.json`, ví dụ `finance`, `auth`, `marketplace`). Chưa có namespace phù hợp → tạo namespace mới trùng tên feature.
2. Thay text bằng `t('key.con')` (key mô tả **ý nghĩa**, camelCase, không đặt theo nội dung chữ). Cần chèn biến động → `t('key', { count, name })` và dùng `{count}`/`{name}` trong chuỗi JSON — **không** truyền fallback string làm tham số thứ 2 (next-intl không hỗ trợ kiểu đó như i18next).
3. Thêm key vào `src/i18n/locales/en/common.json` (đây là **nguồn** — locale mặc định) đúng vị trí namespace, giữ format/sort gọn theo cấu trúc hiện có trong file.
4. Key **đã tồn tại** với nghĩa giống → tái dùng, không tạo trùng.
5. KHÔNG đổi logic, chỉ thay text. KHÔNG đụng string kỹ thuật (route, field API, console log).

Xong việc → liệt kê: namespace dùng, key mới đã thêm vào `en/common.json`, file đã sửa.

## B. Dịch sang locale mới

Dịch các key trong `src/i18n/locales/en/common.json` sang locale đã cho, ghi vào `src/i18n/locales/<locale>/common.json`:

- `all` → chạy cho mọi locale trong `locales` (`src/i18n/config.ts`) trừ `en`.
- Trước khi dịch: so cấu trúc key giữa `en/common.json` và `<locale>/common.json` (đọc cả hai file, diff theo path key) để biết đang **thiếu key nào** và có **key thừa (orphan)** nào không còn tồn tại ở `en` cần dọn.
- Giữ NGUYÊN cấu trúc key/nesting và mọi placeholder `{var}` (không dịch tên biến bên trong `{}`).
- Chỉ dịch key còn thiếu/khác; giữ bản dịch đã đúng, không viết lại toàn bộ file.
- Văn phong tự nhiên theo ngữ cảnh app (gamified personal dashboard: quest, habit, task, hero, reward…) — giữ đúng tinh thần "gamification" khi dịch (vd không dịch quá khô cứng/hành chính).
- Repo **không có script check tự động i18n-sync** — sau khi dịch, tự đối chiếu lại thủ công: mọi key path có ở `en/common.json` phải có mặt (đúng path) ở từng `<locale>/common.json`, không thiếu không thừa. Báo lại số key đã dịch/đã dọn theo từng locale.

## C. Audit chuỗi còn sót (`--audit`)

Quét thư mục đã cho tìm text hiển thị còn hardcode (chưa qua `t()`). Báo cáo dạng bảng: **file · dòng · chuỗi · namespace/key đề xuất**. CHƯA sửa, chỉ báo cáo để tôi duyệt.
