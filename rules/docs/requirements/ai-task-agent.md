# AI Task Agent — trợ lý đọc lịch, đề xuất thay đổi, chỉ ghi khi user xác nhận

<role>Fullstack engineer xây trợ lý chat (LLM + tool-use) cho dashboard</role>

<context>
User muốn nói một câu ("dời buổi học sang thứ Sáu 10h", "lên lịch tuần này") thay vì mở
từng form. Model ngôn ngữ thì có thể hiểu sai, bịa id hoặc bị nội dung task "ra lệnh". Vì vậy
trợ lý được **đọc tự do nhưng không bao giờ tự ghi**: mọi thay đổi thành một đề xuất
(proposal) mà user bấm Confirm thì server mới thực hiện.

Backend ở `src/server/agent/`, route ở `src/app/api/v1/agent/`, model ở
`src/server/models/agent-chat.model.ts`, type dùng chung ở `src/types/agent.ts`.
Danh mục tool: [ai-task-agent-tools.md](ai-task-agent-tools.md). Giao diện web:
[ai-task-agent-ui.md](ai-task-agent-ui.md).
</context>

<task>
Một hội thoại lưu trên server, dùng chung web + app; trợ lý tra cứu task / session / habit /
event / note / giờ trống, đề xuất tạo-sửa-xoá, lên kế hoạch ngày/tuần, hỏi lại bằng nút chọn
nhanh, và sau khi xác nhận thì chỉ đường tới thứ vừa thay đổi.
</task>

<requirement>

## Luồng một lượt (`run-agent.ts`)

1. Client gửi **chỉ tin nhắn mới** tới `POST /api/v1/agent` kèm `today` (`YYYY-MM-DD` local)
   và `timezone`. Lượt cũ đọc từ hội thoại đã lưu — client không gửi lại history, nên web và
   app không thể lệch nhau.
2. Server dựng system prompt (ngày hôm nay, timezone, luật dùng tool) + tối đa
   `MAX_HISTORY = 20` lượt text gần nhất (cũ hơn bị bỏ, không tóm tắt).
3. Vòng tool-use tối đa `MAX_STEPS = 8`:
   - **Read tool** chạy ngay, luôn lọc theo `userId`; kết quả trả lại model.
   - **Write tool** không ghi gì: `proposeActions` validate (zod), tra entity để viết `summary`
     một dòng, rồi gom vào `pendingActions`. Id sai → lỗi về model, không tới user.
   - `ask_user` → kết thúc lượt ngay (xem dưới).
4. **Hết bước**: thay vì báo lỗi, gọi model thêm một lần **không có tool** kèm lệnh "trả lời
   từ kết quả tool đã có". Chỉ khi lần đó cũng rỗng/lỗi mới trả câu mặc định
   "I could not finish that request…". Lý do: 8 bước thường đã đọc đủ dữ liệu, vứt đi là phí.
5. Lưu lượt: `user` + `assistant` (+ `proposal` nếu có action) **trong một lần ghi, sau khi
   model đã trả lời**. Request lỗi giữa chừng không để lại gì → client gửi lại y nguyên là an
   toàn (cơ sở cho auto-retry phía client).
6. Client đã huỷ (`req.signal.aborted`) → trả 499 và **không lưu** lượt đó.

## Hội thoại lưu trữ (`AgentChat`, `chat-store.ts`)

- Một document mỗi user (`userId` unique), mảng `items` cuộn, giữ `MAX_CHAT_ITEMS = 100`
  item cuối (`$push` + `$slice: -100`). Web và app đọc/ghi cùng một hội thoại.
- Item: `user` (`text`) · `assistant` (`text`, `choices?`) · `proposal` (`actions[]`,
  `state: open | done | dismissed`, `targets?`). `text` ≤ 4000.
- Chỉ item `user`/`assistant` có text mới được đưa vào ngữ cảnh model (`toTurns`). Vì thế
  confirm thành công **append một item `assistant`** ghi kết quả ("Created "X".") — để lượt
  sau model biết thay đổi đã thật sự xảy ra.
- `DELETE /history` xoá cả document ("New chat" xoá trên mọi thiết bị).

## Proposal — xác nhận trước khi ghi

- Mỗi action: `{ tool, args, summary }`. `plan_schedule` là ngoại lệ duy nhất: một lời gọi
  sinh **nhiều** action (`update_task` / `create_session`) để user xác nhận cả kế hoạch một lần.
- `POST /agent/execute { proposalId, decision }`: action đọc **từ proposal đã lưu**, không
  từ request → client không thể chạy thứ trợ lý không đề xuất.
- **Claim nguyên tử** (`claimProposal`): một `findOneAndUpdate` lọc `state: 'open'` và set
  `done`/`dismissed` cùng lúc. Bấm đúp hay hai thiết bị cùng bấm → chỉ một bên thắng, bên kia
  nhận **409**.
- Lúc thực hiện, `executeAction` **validate lại** từ đầu (gọi lại `proposeAction`) và scope
  theo user — dữ liệu có thể đã đổi giữa lúc đề xuất và lúc bấm.
- Action chạy tuần tự. **Tất cả fail** → `reopenProposal` đưa về `open`, trả `state: 'open'`,
  không append message — user thử lại được. Fail một phần → vẫn `done`; client hiện
  "Some changes could not be saved".
- `dismiss` không chạy gì, trả `{ state: 'dismissed', results: [], items: [] }`.

## Targets — chỉ đường tới thứ vừa đổi

Mỗi action thành công có thể trả `target: { kind, id, label, date? }`
(`kind: task | habit | event | note`). Là kind + id chứ **không phải URL**: web và app tự biết
màn của mình ở đâu.

- Route gộp target trùng theo `kind:id` (sửa rồi book cùng task = một chỗ), lưu vào proposal
  bằng `setProposalTargets` (để reload vẫn còn link) và trả trong response.
- Action xoá (`delete_task`, `delete_session`, `delete_habit`, `delete_event`) **không** có
  target — không còn gì để mở. `date` có khi thay đổi gắn một ngày (session, occurrence…).
- Web map target → link ở [ai-task-agent-ui.md](ai-task-agent-ui.md); app mobile map sang
  màn riêng của nó.

## Hỏi lại (`ask_user`)

Thiếu chi tiết hoặc user phân vân ("mai hay thứ Sáu?") → model gọi
`ask_user { question, options[2..5] }` thay vì đoán. Lượt dừng ngay; câu hỏi lưu thành item
`assistant` với `choices`; **mọi action đã gom trong lượt bị bỏ**, để câu hỏi và proposal không
bao giờ cùng xuất hiện.

- Options được làm sạch chứ không bị từ chối: bỏ rỗng/trùng, cắt 60 ký tự, giữ tối đa 5;
  còn < 2 option khác nhau → lỗi về model. `question` cắt 240 ký tự.
- Không có endpoint riêng: bấm một choice = gửi text đó như tin nhắn thường.
- Câu hỏi mở (vd. tên task) vẫn là text thường.

## API

| Route                          | Body                                  | Trả về                                                     |
| ------------------------------ | ------------------------------------- | ---------------------------------------------------------- |
| `POST /api/v1/agent`           | `{ message≤2000, today?, timezone? }` | `{ items }` các item lượt này thêm                         |
| `GET /api/v1/agent/history`    | —                                     | `{ items }` cũ → mới                                       |
| `DELETE /api/v1/agent/history` | —                                     | xoá hội thoại                                              |
| `POST /api/v1/agent/execute`   | `{ proposalId, decision }`            | `{ state, results[], targets?, items }` · 409 nếu đã quyết |

Tất cả cần Bearer token như mọi route `/api/v1`. Thiếu `today` → ngày UTC server; thiếu
`timezone` → `UTC`.

## LLM (`llm.ts`)

Client tối giản cho mọi endpoint OpenAI-compatible — đổi provider là đổi env, không đổi code.

| Biến                 | Mặc định                                                  | Ý nghĩa                         |
| -------------------- | --------------------------------------------------------- | ------------------------------- |
| `LLM_API_KEY`        | — (hoặc `GEMINI_API_KEY`)                                 | Thiếu → 503                     |
| `LLM_BASE_URL`       | `https://generativelanguage.googleapis.com/v1beta/openai` | Server OpenAI-compatible bất kỳ |
| `LLM_MODEL`          | `gemini-3.8-flash`                                        | Model chính                     |
| `LLM_FALLBACK_MODEL` | chuỗi có sẵn `gemini-3.6-flash`, `gemini-3.5-flash-lite`  | Dùng khi model chính quá tải    |

- Chuỗi fallback có sẵn chỉ áp dụng với cấu hình Gemini mặc định; tự đặt `LLM_MODEL` mà không
  có `LLM_FALLBACK_MODEL` thì không fallback (id model khác nhau theo provider).
- Mỗi model: thử lại 1 lần sau 800 ms khi gặp 429/5xx, rồi sang model kế. Timeout 30 s/lần gọi.
  Huỷ từ client (`signal`) cắt ngay lần gọi đang chạy và không thử tiếp.
- Map lỗi: 429 bận (**503 của provider cũng báo 429**, để 503 chỉ còn nghĩa "chưa cấu hình" —
  client retry cái này, không retry cái kia), 504 timeout/mạng, 502 lỗi khác.
- Tool call được echo nguyên trạng (Gemini 3 cần `thought_signature`); thiếu `id` thì tự sinh.

## Ràng buộc an toàn

- Key chỉ ở server, không bao giờ vào client bundle.
- Tên task, note… là **dữ liệu, không phải lệnh** (nói rõ trong system prompt).
- Free tier của provider có thể dùng nội dung để train: tên task, ngày, category được gửi đi.

</requirement>

<tone>Ngắn, nói lý do; con số lấy đúng từ code.</tone>
