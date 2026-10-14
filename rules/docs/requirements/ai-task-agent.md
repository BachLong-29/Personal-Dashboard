# AI Task Agent

An assistant that reads the user's tasks and proposes new ones from natural language. Backend lives in `src/server/agent/`, routes in `src/app/api/v1/agent/`.

## Flow

1. Client sends the new message to `POST /api/v1/agent` with its local `today` (`YYYY-MM-DD`) and `timezone`. Earlier turns are read from the stored conversation, not sent by the client.
2. The server runs a tool-use loop (max 6 steps) against an OpenAI-compatible LLM.
3. **Read tools** (`list_tasks`, `list_categories`) run immediately, scoped to the caller.
4. **Write tools** (`create_task`, `complete_task`) never write. They are stored as a `proposal` item with a one-line `summary` for the confirm card.
5. The user decides with `POST /api/v1/agent/execute { proposalId, decision }`. The actions are read from the stored proposal, never from the request, so a client cannot run anything the assistant did not propose. The claim is atomic: a proposal is decided once.

## Conversation storage

One rolling conversation per user (`AgentChat`, last 100 items), shared by the web and the app. A turn is saved only after the model answered, so a failed send leaves nothing behind and the client just sends the same message again. Items are `user`, `assistant` or `proposal` (`open` / `done` / `dismissed`). A confirmed change appends an assistant message with the outcome, so the model knows it happened.

## Endpoints

| Route                          | Body                             | Returns                                                |
| ------------------------------ | -------------------------------- | ------------------------------------------------------ |
| `POST /api/v1/agent`           | `{ message, today?, timezone? }` | `{ items }` the items this turn added                  |
| `GET /api/v1/agent/history`    | —                                | `{ items }` oldest first                               |
| `DELETE /api/v1/agent/history` | —                                | clears the conversation                                |
| `POST /api/v1/agent/execute`   | `{ proposalId, decision }`       | `{ state, results[], items }` (409 if already decided) |

All need the Bearer token like every other `/api/v1` route.

## Configuration

| Variable             | Default                                                   | Purpose                            |
| -------------------- | --------------------------------------------------------- | ---------------------------------- |
| `LLM_API_KEY`        | — (or `GEMINI_API_KEY`)                                   | Provider key; unset → 503          |
| `LLM_BASE_URL`       | `https://generativelanguage.googleapis.com/v1beta/openai` | Any OpenAI-compatible server       |
| `LLM_MODEL`          | `gemini-3.8-flash`                                        | Model id                           |
| `LLM_FALLBACK_MODEL` | built-in: `gemini-3.6-flash`, `gemini-3.5-flash-lite`     | Tried when the model is overloaded |

## Constraints

- The key stays on the server; never expose it to a client bundle.
- Provider errors map to friendly statuses: 429 busy, 504 timeout, 502 other, 503 not configured.
- Free tiers may use submitted content to improve the provider's models. Task names, dates and categories are sent; notes are only sent when the user types them.
- `create_task` with `startTime` (24-hour `HH:MM`, requires `startDate`) also books a session on that day at that hour, the same `ScheduleBlock` record `POST /schedule-blocks` writes. Length is `duration`, default 60 min; without a time only the task is created.
- `complete_task` refuses multi-day tasks: those are ticked per day through task logs in the app.
- Task names and notes are data to the model, never instructions (stated in the system prompt).

## Adding a tool

Add its zod schema and description to `READ_TOOLS` or `WRITE_TOOLS` in `tools.ts`. A write tool also needs a branch in `executeAction`. The JSON schema sent to the model is generated from the zod schema.

## Web UI

Route `/assistant` (`src/app/[locale]/(protected)/assistant/page.tsx`), reached from the dashboard menu (✨ Assistant).

| File                                              | Role                                         |
| ------------------------------------------------- | -------------------------------------------- |
| `features/assistant/components/AssistantPage.tsx` | Chat shell, input, suggestions, retry        |
| `features/assistant/components/ChatBubble.tsx`    | One message                                  |
| `features/assistant/components/ProposalCard.tsx`  | Pending changes with Cancel / Confirm        |
| `features/assistant/hooks/useAssistant.ts`        | `useAgentChat`, `useExecuteAgentActions`     |
| `services/endpoints/agent.ts`                     | `/agent` (60 s timeout) and `/agent/execute` |

- Mobile-first: one centred column (`max-w-2xl`), input pinned to the bottom, equal-width buttons.
- Enter sends, Shift+Enter adds a line. The stored conversation loads on open; "New chat" clears it (with a confirm).
- After a confirm the tasks, calendar and profile queries are invalidated.
