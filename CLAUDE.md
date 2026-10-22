# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project Overview

**Aetheria** is a gamified personal dashboard: tasks, habits and events are played as quests that
pay out XP and coins, alongside a finance module (wallets, budgets, gold, SePay bank sync), goals,
a reward marketplace and an AI task assistant. One Next.js app serves both the web UI and the
`/api/v1` REST API.

The API also serves the sibling mobile app (`../Dashboard-app`, Expo). It authenticates with a
Bearer token, not cookies — never make a route depend on cookies alone.

## Tech Stack

| Layer        | Technology                                                                  |
| ------------ | --------------------------------------------------------------------------- |
| Framework    | Next.js 16.2 (App Router), React 19.2                                       |
| Language     | TypeScript 5                                                                |
| Styling      | Tailwind CSS v4 + design tokens in `src/app/globals.css`                    |
| Server state | TanStack React Query 5                                                      |
| Client state | Zustand 5 (`src/stores/`, UI-only state)                                    |
| Forms        | React Hook Form 7 + Zod 4                                                   |
| Database     | MongoDB via Mongoose 9                                                      |
| Auth         | JWT access + refresh tokens (`jsonwebtoken`), Google ID-token login         |
| i18n         | next-intl 4 — locales `en`, `vi`, `th`                                      |
| Uploads      | Cloudinary                                                                  |
| AI assistant | OpenAI-compatible chat API (Gemini by default) in `src/server/agent/llm.ts` |
| Tooling      | ESLint 9, Prettier 3, Husky + lint-staged, commitlint                       |

## Dev Commands

```bash
npm install
npm run dev          # dev server on :3000
npm run build        # production build
npm run lint         # ESLint        (lint:fix to fix)
npm run format       # Prettier      (format:check to check)
npm run type-check   # tsc --noEmit
```

Environment lives in `.env`: `MONGODB_URI`, `AUTH_SECRET`, `ACCESS_TOKEN_EXPIRY`,
`REFRESH_TOKEN_EXPIRY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`,
`CLOUDINARY_*`, `LLM_API_KEY` (+ optional `LLM_MODEL`, `LLM_FALLBACK_MODEL`), `SEPAY_WEBHOOK_BASE_URL`.

## Architecture Summary

```
src/
├── app/api/v1/        REST API — one folder per resource (tasks, habits, events, finance, agent…)
├── app/[locale]/      every page sits under the locale segment: (public)/login|register, (protected)/…
├── features/<domain>/ page-level modules: components/, hooks/, utils/
├── components/        shared UI (ui/ primitives, common/, providers/)
├── server/            models/ (Mongoose), agent/ (assistant), services/, helpers/
├── services/endpoints Axios clients for /api/v1
├── hooks/ stores/ libs/ constants/ types/ i18n/
```

- **Auth:** the web keeps tokens in cookies; `src/proxy.ts` guards pages and refreshes the pair
  during navigation; the Axios client sends `Authorization: Bearer`. API routes read only the
  Bearer header through `getAuthUser` (`src/server/helpers/get-auth-user.ts`).
- **API shape:** handlers wrap in `asyncHandler`, validate with `validateBody` /
  `validateSearchParams` (Zod), and answer through `successResponse` / `errorResponse`.
- **Scheduling core:** tasks and quests are placed on the calendar by `ScheduleBlock` sessions;
  habits come from their own weekly schedule; events expand from a series plus overrides. See `schedule-block.md`, `block-driven-scheduling.md`
  and `event.md` before touching calendar code.
- **Theme:** light/dark/system, resolved from a cookie on the server. Colours come from CSS tokens
  only; filled gold surfaces use `--gold-fill*`, not `--gold` (see `theme.md`).

## Key Constraints

- **Read the Next.js 16 docs first.** It has breaking changes from what you may know; check
  `node_modules/next/dist/docs/` before writing Next-specific code (see `AGENTS.md`).
- **Branches:** never commit to `master`. Features on `feature/<desc>`, fixes on `bug/<desc>`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`…), enforced by commitlint + Husky.
- **Responsive:** every new page or feature is mobile-first and must work at phone, tablet and
  desktop widths (Tailwind `sm:` / `md:` / `lg:`). Verify small viewports before calling it done.
- **i18n:** user-facing text goes through next-intl and must exist in `en`, `vi` and `th`.
- **Keep the mobile app working:** changing an `/api/v1` response shape breaks `../Dashboard-app`.
  Add fields; don't rename or remove them without updating the app.
- **Mongoose in dev:** models are cached across hot reloads, so a new schema field is silently
  dropped until the dev server restarts.
- **Docs:** feature specs are shared with the mobile app and live in the sibling repo
  `../aetheria-docs` — never copy them back here. A change in behaviour updates its spec there in
  the same piece of work. Files under `rules/docs/` and `aetheria-docs` stay at or under 150 lines.

## Additional Documentation

**Frontend rules — `rules/fe/`.** Read the ones that match the change:
[general](rules/fe/general.md) · [react](rules/fe/react.md) · [nextjs](rules/fe/nextjs.md) ·
[typescript](rules/fe/typescript.md) · [naming](rules/fe/naming.md) ·
[folder-structure](rules/fe/folder-structure.md) · [tailwind](rules/fe/tailwind.md) ·
[ui-components](rules/fe/ui-components.md) · [forms](rules/fe/forms.md) ·
[state-management](rules/fe/state-management.md) · [data-fetching](rules/fe/data-fetching.md) ·
[api](rules/fe/api.md) · [accessibility](rules/fe/accessibility.md) ·
[performance](rules/fe/performance.md) · [security](rules/fe/security.md) ·
[testing](rules/fe/testing.md) · [code-review](rules/fe/code-review.md)

**Architecture — `rules/docs/architecture/`:**
[overview](rules/docs/architecture/README.md) ·
[api-conventions](rules/docs/architecture/api-conventions.md) ·
[auth](rules/docs/architecture/auth.md) · [data-flow](rules/docs/architecture/data-flow.md) ·
[database](rules/docs/architecture/database.md) ·
[mongodb-connection](rules/docs/architecture/mongodb-connection.md)

**Feature specs — `../aetheria-docs/requirements/` (shared with Dashboard-app):** start from the
[index](../aetheria-docs/requirements/README.md), which lists every spec by domain, and read the
[docs repo README](../aetheria-docs/README.md) for the conventions (shared part, then `## Web` /
`## Mobile` sections). Read the spec of the feature you are changing before you change it. If
`../aetheria-docs` is missing, clone it next to this repo.

**Known bugs — GitHub Issues of `aetheria-docs`:** shared with the app, labelled by platform
(`web` · `ios` · `android` · `server`) and `severity:*`. List them with
`gh issue list -R BachLong-29/aetheria-docs` and check the area you are touching. Reference the
issue (`BachLong-29/aetheria-docs#<n>`) in the commit that fixes it and close it once merged.

**Workflow:** [feature development guideline](rules/docs/feature_development_guideline.md) ·
[React component standards](rules/docs/react-component-standards.md) · commands
[/new-feature](rules/commands/new-feature.md), [/fix-bug](rules/commands/fix-bug.md),
[/translation](rules/commands/translation.md)
