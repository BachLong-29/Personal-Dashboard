# AI Task Agent — giao diện web `/assistant`

<role>Frontend engineer làm màn chat của trợ lý</role>

<context>
Backend và luật proposal ở [ai-task-agent.md](ai-task-agent.md). Màn web sống tại
`src/app/[locale]/(protected)/assistant/page.tsx`, vào từ menu sheet của `DashboardTopbar`
(✨ Assistant) hoặc từ `Ctrl/⌘ + K` ([global-search.md](global-search.md)). App mobile dùng chung
API và hội thoại, có màn riêng.
</context>

<task>
Chat một cột, mobile-first; hiện hội thoại đã lưu, card proposal với Cancel / Confirm, nút
trả lời nhanh, tự thử lại khi trợ lý bận, nút Stop, và link tới thứ vừa được thay đổi.
</task>

<requirement>

## File

| File                                              | Vai trò                                                                     |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| `features/assistant/components/AssistantPage.tsx` | Khung chat, input, gợi ý, retry, Stop, nhận hand-off Ctrl+K                 |
| `features/assistant/components/ChatBubble.tsx`    | Một tin (`user` / `assistant` / `error`)                                    |
| `features/assistant/components/ProposalCard.tsx`  | Thay đổi chờ xác nhận + link "View …" sau khi lưu                           |
| `features/assistant/components/QuickReplies.tsx`  | Nút chọn nhanh dưới câu hỏi                                                 |
| `features/assistant/hooks/useAssistant.ts`        | `useAgentHistory`, `useAgentChat`, `useDecideProposal`, `useClearAgentChat` |
| `features/assistant/utils/chat-retry.ts`          | `sendWithRetry`, `isTransient`, `isChatCancelled`                           |
| `features/assistant/utils/target-links.ts`        | `toTargetLinks` — target → link web                                         |
| `services/endpoints/agent.ts`                     | `/agent` (timeout 60 s), `/agent/execute`, `/agent/history`                 |

## Bố cục & nhập liệu

- Một cột giữa (`max-w-2xl`), input ghim đáy, nút bằng nhau; textarea tự cao tới 140 px rồi
  mới cuộn (cộng lại border để không hiện scrollbar khi rỗng).
- Enter gửi, Shift+Enter xuống dòng; bỏ qua khi đang gõ IME (`isComposing`). Tối đa 2000 ký tự.
- Hội thoại đã lưu tải một lần mỗi lần mở (`staleTime: Infinity`), sau đó trang tự giữ đồng bộ.
  Rỗng → 3 gợi ý (today / create / week) bấm là gửi.
- "New chat" có modal xác nhận — nó xoá hội thoại **trên mọi thiết bị**, task đã lưu giữ nguyên.

## Gửi, tự thử lại, Stop

- Tin vừa gửi hiện ngay như item local; thành công thì thay bằng các item server trả về.
- `sendWithRetry`: lỗi tạm thời → thử lại tối đa **3 lần nữa**, chờ 2 s / 4 s / 8 s, status
  ghi "Assistant is busy — trying again (n/3)…".
  - Tạm thời = 429, 502, 504, hoặc không có response.
  - **Không** retry: 503 (chưa cấu hình), 4xx khác, và timeout phía client
    (`ECONNABORTED`/`ETIMEDOUT`) — server có thể vẫn đang chạy và sẽ lưu lượt đó, gửi lại sẽ
    thành hai lượt.
  - An toàn vì server chỉ lưu lượt sau khi model trả lời.
- Hết lượt thử → dòng lỗi + nút **Try again** (chỉ ở dòng cuối), gửi lại tin user cuối cùng.
- **Stop** (■ cạnh status) huỷ request hoặc khoảng chờ giữa hai lần thử. Abort đi tới tận lời
  gọi model (`req.signal` → `LlmCall`), server trả 499 và không lưu gì. Tin nhắn quay về ô
  nhập — trừ khi user đã gõ cái mới.

## Trả lời nhanh

Nút `choices` chỉ hiện khi câu hỏi là **tin cuối cùng** và không đang chờ trả lời — trả lời xong
(bấm hay gõ) thì chúng đã cũ. Bấm = `send(choice)` như tin thường.

## ProposalCard & link "View …"

- Trạng thái local: `open` → `confirming` (nút loading, Cancel khoá) → `done` | `dismissed`.
- Confirm thành công: append message kết quả; `state: 'open'` trả về (mọi action fail) → card
  mở lại + "Could not save. Try again."; fail một phần → "Some changes could not be saved".
- Lỗi request (409 đã quyết ở chỗ khác, mất mạng) → refetch history để lấy sự thật từ server.
- Dismiss lạc quan; lỗi thì card mở lại.
- Khi `done`, `toTargetLinks(targets)` tạo **một link mỗi kind**, theo thứ tự kind xuất hiện:

| Kind  | Một mục                                     | Nhiều mục | Nhãn                   |
| ----- | ------------------------------------------- | --------- | ---------------------- |
| task  | `/tasks?q=<tên đã lưu>`                     | `/tasks`  | View task / View tasks |
| habit | `/dashboard?tab=habits`                     | như nhau  | View habit / habits    |
| event | `/manage/events`                            | như nhau  | View event / events    |
| note  | mở panel Quick Notes (`ui.store.openNotes`) | như nhau  | View notes             |

Task không có trang riêng, nhưng `tasks/page.tsx` nhận `?q=` và truyền `initialSearch` cho
`TaskManagement`, nên danh sách mở sẵn đã lọc. Note không có trang → nút thay vì `Link`.
Target lưu trên proposal, nên link vẫn còn sau reload.

- Sau confirm `done`, invalidate: `tasks`, schedule blocks, `habits`, `habit-logs`, `notes`,
  events, quests, `calendar-day`, calendar, profile.

## Hand-off từ Ctrl+K

Palette ghi câu đã gõ vào `ui.store.pendingAssistantPrompt` rồi điều hướng tới `/assistant`.
Trang gửi nó **đúng một lần**, sau khi history đã lên màn (để tin nằm sau hội thoại cũ):

- Đọc thẳng từ store và chỉ xoá **sau khi** gửi đi được — check có thể chạy nhiều lần
  (StrictMode, re-render trước khi `thinking` bật), chỉ lần đầu tìm thấy prompt.
- Đang chờ trả lời thì prompt đợi; `thinking` về false thì gửi.
- Để trong store chứ không trong URL: reload không gửi lần hai.

## Ngôn ngữ

Chuỗi trong namespace `assistant` (`src/i18n/locales/{en,vi,th}/common.json`). Trợ lý trả lời
theo ngôn ngữ user gõ.

</requirement>
