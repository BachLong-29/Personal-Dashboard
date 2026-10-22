# Not Found — trang 404 thuộc về app

<role>Frontend engineer làm cho một URL sai vẫn trông như ở trong app</role>

<context>
Repo từng không có file not-found nào, nên mọi URL sai rơi vào trang trắng-đen mặc định của Next.
Không theme, không font, không bản dịch, không đường quay về.

Một file là không đủ do cách routing + middleware chia đường: path dưới `[locale]` mà không route
nào nhận sẽ **rơi qua** segment `[locale]` và không bao giờ chạm layout locale; còn path có dấu
chấm thì middleware không đụng tới nên không có locale nào cả.
</context>

<task>
Ba file not-found phủ ba loại URL sai, trang chính dùng ngôn ngữ thị giác của dashboard.
</task>

<requirement>

## Ba file

| File                                  | Phủ                                           | Vì sao cần                                                                          |
| ------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/app/[locale]/not-found.tsx`      | Mọi `notFound()` gọi bên trong locale         | Nằm trong layout locale → có font, theme, providers, next-intl                      |
| `src/app/[locale]/[...rest]/page.tsx` | Mọi path dưới locale mà không route nào nhận  | Chỉ gọi `notFound()`. Thiếu nó thì trang có thiết kế ở trên không bao giờ được dùng |
| `src/app/not-found.tsx`               | Path không bao giờ tới locale (vd `/foo.txt`) | Matcher của `src/proxy.ts` loại path có dấu chấm                                    |

`app/not-found.tsx`: root layout chỉ pass-through nên file này tự mang `<html>`, `<body>`,
stylesheet, ép `dark`. **Không dịch được** — intl provider sống trong layout locale, và path tới
đây vốn không có locale. Chữ cố định tiếng Anh: "This path leads nowhere." + link về `/`.

## Trang locale

- Nội dung qua `useTranslations('notFound')`: `eyebrow` · `title` · `message` · `home` · `back`
  (en / vi / th). Vd vi: "VÙNG CHƯA VẼ" / "Lối này không dẫn tới đâu".
- Hình thức mượn từ vốn sẵn có: starfield của landing, góc ngoặc + lưới giấy kẻ của panel
  dashboard, vạch `◆ ◆ ◆` — lạc đường vẫn ở trong thế giới của app.
- **Hai lối ra:** `Về trang chủ` (`Link` locale tới `/`, primary) · `Quay lại`
  (`src/components/common/BackButton.tsx`, `router.back()`).
- `BackButton` dùng router **thường** chứ không phải router locale: nó đi theo history của
  trình duyệt, vốn đã chứa locale user đến từ đó.
- Không export `metadata`: theo docs Next 16 chỉ `global-not-found` nhận metadata, ở `not-found`
  nó là code chết. Title lấy từ layout.

## Edge cases

- Path sai không nằm trong `PROTECTED_ROUTES` → không bị đẩy về login; user chưa đăng nhập vẫn
  thấy 404. Path sai **dưới** một prefix protected (vd `/dashboard/xyz`) thì middleware xử lý auth
  trước.
- Responsive: một khối giữa màn; hai nút full-width trên điện thoại, co lại từ `sm`.

## Ngoài phạm vi

Không gợi ý trang gần đúng, không search trong trang 404, không log URL sai.

</requirement>

<tone>Concise. Một URL sai là một lối rẽ trong app, không phải lỗi trình duyệt.</tone>
