# AI Task Agent

An assistant that reads the user's tasks and proposes creating, editing, completing or deleting them from natural language. Backend lives in `src/server/agent/`, routes in `src/app/api/v1/agent/`.

## Flow

1. Client sends the new message to `POST /api/v1/agent` with its local `today` (`YYYY-MM-DD`) and `timezone`. Earlier turns are read from the stored conversation, not sent by the client.
2. The server runs a tool-use loop (max 8 steps; if it runs out, one last call without tools makes the model answer from what the tools already returned, instead of failing) against an OpenAI-compatible LLM.
3. **Read tools** (`list_tasks`, `list_categories`, `list_sessions`, `list_habits`, `list_notes`, `list_events`) run immediately, scoped to the caller.
4. **Write tools** (`create_task`, `update_task`, `complete_task`, `delete_task`, `create_session`, `update_session`, `delete_session`, `create_habit`, `update_habit`, `set_habit_active`, `delete_habit`, `create_note`, `create_event`, `update_event`, `delete_event`, `cancel_occurrence`, `move_occurrence`) never write. They are stored as a `proposal` item with a one-line `summary` for the confirm card.
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
- `update_task` changes only the fields passed; `null` clears `endDate`, `duration` or `note`. It cannot set `done` (that is `complete_task`).
- Sessions after `update_task`: a **single-day** task's `planned` sessions are forced onto its `startDate` (and onto `startTime` / `duration` when given); with none booked, a `startTime` books one. `done` / `missed` sessions stay where they happened. A **multi-day** task's sessions are not moved — the result counts any now outside its days — and are edited one by one with `list_sessions` + `create_session` / `update_session` / `delete_session`, which keep each session inside the task's range.
- `list_tasks` with a range returns every task with a day in it (date overlap), so a multi-day task begun earlier still shows.
- Event tools live in `event-tools.ts` and keep the app's own model ([event.md](event.md)): one rule row plus one override row per cancelled/moved day. `list_events` with `start`+`end` returns expanded occurrences (≤62 days), without a range the rules; a moved occurrence reports its **series** id as `eventId`, which is what later edits address. `update_event` / `delete_event` act on the whole series (`recurrence: null` makes it a one-off and retires its overrides; delete retires them too). `cancel_occurrence` / `move_occurrence` take the series id and the day the occurrence is on **now**, check that an occurrence really exists there, and look up the day the rule originally generated it (a moved occurrence is overridden under its old day) via `applyEventOverride`, shared with `POST /events/:id/override`. No `startTime` = all-day; a time given to an all-day event makes it timed (default 60 min).
- Note tools live in `note-tools.ts`: only `list_notes` (open by default — no `archivedAt`) and `create_note` (the user's words, unedited). Editing, deleting and marking notes done stay out, as decided in [quick-notes.md](quick-notes.md).
- Habit tools live in `habit-tools.ts`. `update_habit` with `schedule` replaces the whole schedule. `set_habit_active` pauses/resumes (history kept; paused habits drop out of quests and stats). `delete_habit` is the same hard delete as `DELETE /habits/:id`, logs included — the prompt steers "stop for a while" to pause instead.
- `delete_task` is the same soft delete as `DELETE /tasks/:id`: `active: false`, and the task's `ScheduleBlock`s are removed.
- Writes on an existing task look it up while proposing, so the confirm card names the task and a bad id goes back to the model as an error instead of reaching the user.
- Task names and notes are data to the model, never instructions (stated in the system prompt).

## Asking back (`ask_user`)

When a detail is ambiguous or the user sounds unsure ("tomorrow or Friday?"), the model calls `ask_user { question, options[2..5] }` instead of guessing. The turn ends there: the question is stored as an `assistant` item with `choices`, and any change lined up in the same turn is dropped so a question and a proposal never appear together.

- Options are cleaned, not rejected: blanks and repeats are removed, entries cut to 60 characters, at most 5 kept; fewer than 2 distinct options goes back to the model as an error.
- Clients show the choices as buttons under the question **only while it is the last message**; tapping one sends its text as an ordinary user message, so there is no extra endpoint. Typing instead works the same.
- Plain-text questions remain for open answers such as a task name.

## Planner (day / week)

`plan_schedule { from, to, taskIds?, dayStart?, dayEnd?, breakMinutes? }` places tasks into the free time of the calendar and proposes every placement at once, as ordinary `update_task` (single-day or undated task: new `startDate` + `startTime`) or `create_session` (multi-day task, inside its range) actions. `get_free_time { from, to }` is the read-only view of the same gaps. `list_unscheduled` returns the open tasks with no planned session in one call (the answer to "which tasks are not planned?").

- **Placement is deterministic** (`plan-core.ts`, pure, no database): most urgent task first (overdue, then earliest end date, then start date, then longest). The same calendar and tasks always give the same plan.
- **Which day:** a task with its own start date, or an overdue one, takes the earliest day it may use. An undated task, or one spanning several days, takes the **least loaded** allowed day (earliest on a tie), so a week is spread rather than filled from Monday.
- **Busy time** comes from `buildCalendar`: sessions, habits, quests and events with a start time. Events marked free are ignored. Every block is widened by `breakMinutes` (default 15).
- **Rules:** quarter-hour starts; working hours 09:00–18:00 by default; nothing before now today; a task never moves earlier than its own start date; a multi-day task stays inside its range.
- **Ceilings:** at most 240 new minutes per day and 480 in total, so a week is spread rather than front-loaded.
- **Which tasks:** `taskIds` when given, otherwise every open task with no planned session (up to 30). Tasks that do not fit are returned as `unplaced` with a reason and are never forced in.
- The result carries `days` (`bookedMinutes`, `addedMinutes` per day) so the assistant can say whether an empty day was already full or simply had no task left.
- Window is capped at 14 days and days before today are skipped. Placements are computed when proposed; the calendar can change before the user confirms.

## Adding a tool

Add its zod schema and description to `READ_TOOLS` or `WRITE_TOOLS` in `tools.ts` (habit tools: `HABIT_READ_TOOLS` / `HABIT_WRITE_TOOLS` in `habit-tools.ts`), and its name to `AgentPendingAction['tool']` in `types/agent.ts`. A write tool also needs a branch in `executeAction`. The JSON schema sent to the model is generated from the zod schema.

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
- After a confirm the task, session, habit, quest, calendar and profile queries are invalidated.
