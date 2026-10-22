# Icon & Icon Picker — một field string, ba loại icon, một sheet để chọn

<role>Frontend + API engineer giữ cho icon của task/habit/event/project vẽ giống nhau ở web và app</role>

<context>
Field `icon` của task, habit, event, project, finance category… chỉ là **một string**, nhưng string
đó có thể là: tên artwork đi kèm app (`fire`, `GiSmallFire`), một emoji (`🔥`), hoặc URL ảnh đã
upload. Trước đây mỗi form có popover emoji-mart riêng, và chỗ nào in icon ra dạng text thì in luôn
chữ `fire` hoặc nguyên URL. `0375a0c` gom về một `<Icon>` và một `IconPickerSheet` giống sheet của
app mobile, kèm thư viện ảnh đã upload theo user.
</context>

<task>
Mô tả cách một string icon được phân giải và vẽ, sheet chọn icon, upload ảnh, và icon library.
</task>

<requirement>

## Registry — `src/components/common/icon-registry.ts`

- `ICON_FILES`: tên file trong `public/icons/` (`GiSmallFire`, `GiTwoCoins`…). Mặc định `.svg`;
  `ICON_EXTENSIONS` ghi ngoại lệ `.png` (`GiNotebook`).
- `ICON_ALIASES`: tên thân thiện, không phân biệt hoa thường → file (`fire`, `coins`, `globe`…).
- `ICON_EMOJI_ALIASES`: emoji → file (`🔥` → `GiSmallFire`, `📅` → `GiCalendar`…), bỏ `U+FE0F`
  trước khi so. Dữ liệu cũ lưu emoji vì vậy tự hiện thành artwork.
- `ICON_COLORS`: màu token mặc định cho vài artwork (`--gold`, `--cyan`…).
- `QUEST_ICONS`: 16 alias mà picker đưa ra — **cùng tập và thứ tự với picker của app mobile**, để
  icon chọn ở đâu cũng vẽ như nhau ở cả hai.

**Thứ tự phân giải** (`resolveIconSrc`): tra chuỗi đã trim trước (để chuỗi emoji ghép giữ nguyên
khi tra) → không khớp thì tra lại bản `cleanIconText()` → không khớp nữa mà là `https?://` thì
chính URL là src → còn lại `null`.

**`cleanIconText`**: chuẩn hoá NFKC (chữ full-width/compat về chữ thường) và xoá ký tự định dạng
và điều khiển vô hình (`\p{Cf}`, `\p{Cc}` — zero-width space, joiner, dấu hướng). Tên copy từ chỗ
khác thường mang theo các ký tự này: trông như `globe` nhưng không khớp gì (`2bbdd8c`).

**`isNameLike`**: chuỗi đã làm sạch trông như một từ (`^\p{L}[\p{L}\p{N}_-]{2,}$`). Một từ không
khớp artwork nào mà in ra thì đọc như bug, nên không bao giờ in nó. Emoji và ký hiệu không phải
name-like.

**`iconAsText`**: cho chỗ chỉ nhận string (`title`, nhãn select). Chỉ emoji/ký hiệu sống sót;
artwork, URL và từ lạ trả `''`.

## `<Icon>` — `src/components/common/Icon.tsx`

Kích thước `1em`, canh như emoji inline.

| Giá trị          | Vẽ thành                                                        |
| ---------------- | --------------------------------------------------------------- |
| artwork `.svg`   | `<span>` mask + `bg-current` → nhuộm theo `color`/`ICON_COLORS` |
| artwork `.png`   | `<img>` (mask sẽ làm mất màu)                                   |
| URL upload       | `<img>`, bo góc nhẹ, **không bao giờ mask** — ảnh có màu riêng  |
| emoji / ký hiệu  | in nguyên văn                                                   |
| từ không khớp gì | `◆`; dev mode `console.warn` kèm code point để dò ký tự ẩn      |
| rỗng             | `fallback` nếu có, không thì không vẽ gì                        |

Props: `fallback`, `useMappedColor` (default `true`), `renderMode: 'auto' | 'image' | 'mask'`.
Dùng `<img>` thường vì `next/image` không co theo em-box của font.

## `IconPickerSheet` — `src/components/common/IconPickerSheet.tsx`

Bottom sheet trên điện thoại (`h-[85dvh]`), panel giữa màn từ `sm` (`520px`, cao `620px`).
**Luôn mở**: caller chỉ mount khi cần hiện, nên mỗi lần mở là ô tìm kiếm trống và tab đúng icon
hiện tại. Chọn một icon là gọi `onChange` rồi đóng.

Props: `title`, `value`, `onChange`, `onClose`, `allowQuest = true`, `allowUpload = true`.

- **Tab Quest / Emoji** (chỉ hiện khi `allowQuest`). Mở ở Quest nếu `value` rỗng, là alias trong
  `QUEST_ICONS`, hoặc là URL; còn lại mở ở Emoji.
- **Quest grid**: ảnh trong icon library đứng trước, rồi 16 artwork. Ảnh `value` hiện tại chưa có
  trong library vẫn được hiện đầu tiên. Ô ảnh của library có nút ✕ "forget" — luôn hiện trên màn
  chạm, chỉ hiện khi hover/focus trên chuột.
- **Emoji**: theo category của emoji-mart, hàng tab category cuộn ngang (mặc định `people`), đổi
  category thì cuộn body về đầu.
- **Tìm kiếm**: một ô cho cả hai — lọc alias quest theo substring, rồi emoji theo id + tên +
  keywords; tối đa 120 emoji (quá thế thì nên gõ thêm). Đang tìm thì ẩn tab.
- **Upload** (khi `allowUpload`): nút ghost full-width; lỗi hiện inline `uploadError.{type|size|failed}`.
- Chuỗi trong `common.iconPicker.*` (cả tên category), đủ `en`/`vi`/`th`.

**Dữ liệu emoji** (`src/hooks/useEmojiData.ts`): `import('@emoji-mart/data')` lười, lần đầu một
picker mở, cache ở module (vài trăm KB — không cho vào bundle chính). Load lỗi thì xoá cache để lần
mở sau thử lại, và hiện như không có category. `@emoji-mart/react` và `emoji-mart` đã bị gỡ.

**Modal**: `src/components/ui/Modal.tsx` portal vào `body` và Escape chỉ đóng modal trên cùng — để
sheet mở trên một form không bị form cắt và không đóng luôn form.

### Form nào dùng

| Form                                                              | `allowQuest` | `allowUpload` |
| ----------------------------------------------------------------- | ------------ | ------------- |
| `TaskForm`, `AddHabitModal`, `EventFormModal`, `ProjectFormModal` | ✓            | ✓             |
| `FinanceCategoryFormModal`                                        | ✗            | ✗             |

Finance category chỉ emoji vì icon của nó được in **dạng text** trong select, nhãn và CSV.

## Upload ảnh icon

- `src/constants/upload.ts`: `ICON_UPLOAD_TYPES` (jpeg, png, webp, gif), `ICON_UPLOAD_MAX_BYTES`
  5 MB — phải khớp giới hạn của route.
- `src/hooks/useIconUpload.ts`: kiểm type/size **trước khi gửi** (khỏi đẩy file 20 MB lên rồi mới
  bị từ chối), POST multipart field `file` tới `/api/v1/upload/attachment`, trả `{ url }` hoặc
  `{ error: 'type' | 'size' | 'failed' }`. Hook không tự viết thông báo — mỗi form tự dịch.
- `POST /api/v1/upload/attachment`: kiểm lại type/size (`400`), upload Cloudinary folder
  `attachments/`, `public_id = <userId>_<timestamp>`, không overwrite; trả `{ url }` (`secure_url`).
  Dùng chung với file đính kèm task (xem `task-attachments.md`).
- Server không kiểm tra hình dạng `icon`: các route chỉ yêu cầu `z.string().min(1)`.

## Icon library — `/api/v1/icon-library` (`UserSetting.iconLibrary`)

Danh sách URL đã upload, mới nhất trước, để chọn lại mà không upload lần nữa. Mọi method trả về
danh sách mới. Client: `src/hooks/useIconLibrary.ts`, `src/services/endpoints/icon-library.ts`.

- `GET`: đọc `iconLibrary`. Nếu field **vắng mặt**, seed từ các icon `https?://` đang dùng trong
  Task, Habit, Event, Project của user (mới cập nhật trước, bỏ trùng, ≤30) rồi lưu. Chỉ seed khi
  vắng mặt — library user tự xoá rỗng không bị đổ lại.
- `POST { url }`: URL phải `https://`, ≤500 ký tự. `$pull` rồi `$push` ở vị trí 0 với `$slice: 30`
  — có rồi thì đưa lên đầu, quá 30 thì cái cũ nhất rơi ra. Hai bước vì một update không thể vừa
  `$pull` vừa `$push` cùng mảng.
- `DELETE ?url=`: chỉ bỏ khỏi library; **file trên Cloudinary giữ nguyên** vì task có thể còn dùng.
- Sau upload thành công, picker gọi add rồi chọn luôn URL; add lỗi thì icon vẫn được chọn, chỉ không
  được đưa ra lần sau. Xoá là optimistic, server từ chối thì trả lại.

## Câu hỏi mở

- Schema đặt `iconLibrary` default `[]`, nên document setting tạo sau khi có field (ví dụ qua
  `GET /profile`) đã có `[]` → **không bao giờ được seed**. Seed chỉ chạy cho document cũ.
- `allowQuest={false}` + `allowUpload` bật thì library và ảnh hiện tại không hiện ở đâu (chúng nằm
  trong Quest grid). Hiện chưa form nào dùng tổ hợp này.
- `value` lưu dạng tên file (`GiSmallFire`) chứ không phải alias thì picker mở ở tab Emoji và không
  đánh dấu ô nào.

</requirement>

<tone>Thêm artwork: file vào `public/icons/`, entry vào registry, và nếu muốn hiện trong picker thì
thêm vào `QUEST_ICONS` **cùng lúc với app mobile**.</tone>
