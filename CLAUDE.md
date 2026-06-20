# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js Version Warning

This project uses **Next.js 16**, which has breaking changes from earlier versions. APIs, conventions, and file structure may differ from training data. Before writing any Next.js-specific code, check `node_modules/next/dist/docs/` for current behavior.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run format:check # Check formatting
npm run type-check   # TypeScript check (no emit)
```

Commits must follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) — enforced by commitlint + Husky pre-commit hooks.

## Architecture

**Gamified personal dashboard** — users complete tasks/habits as quests, earn rewards, and manage a hero profile. Full-stack: Next.js App Router handles both frontend and API routes, with MongoDB as the data layer.

### Routing

```
src/app/
├── api/v1/              # REST API — auth, tasks, habits, quests, rewards, profile, stats
└── [locale]/            # All UI routes wrapped in locale segment (next-intl)
    ├── (protected)/     # Auth-required pages: dashboard, tasks, habits, rewards, profile
    └── (public)/        # Login, register pages
```

Auth is enforced in [src/proxy.ts](src/proxy.ts) (Next.js middleware): strips locale prefix, checks JWT access token from cookies, redirects to login if missing.

### Feature Layout

```
src/
├── features/            # Page-level feature modules (auth, dashboard, tasks, habits, rewards, profile)
├── components/          # Shared UI (common/, forms/, layouts/, providers/, ui/)
├── server/
│   ├── models/          # Mongoose models: User, UserProfile, UserSetting, Task, Habit, Quest, Reward, Category, Stats
│   ├── async-handler.ts # Wraps API route handlers with try/catch
│   ├── validate.ts      # Zod request validation helper
│   └── response.ts      # Standardized API response formatter
├── services/endpoints/  # Axios API clients (frontend → /api/v1/*)
├── stores/              # Zustand stores (ui.store.ts for client UI state)
├── hooks/               # Custom React hooks
└── i18n/                # next-intl config, routing, locale JSON files
```

### Data & State

- **Database:** MongoDB via Mongoose. All models live in `src/server/models/`.
- **Server state:** TanStack React Query (data fetching, caching, mutations).
- **Client state:** Zustand (`src/stores/`) — lightweight UI-only state.
- **Forms:** React Hook Form + Zod validation.
- **Auth:** JWT access + refresh token rotation. Tokens stored in cookies. `/api/v1/auth/refresh` handles rotation.

### i18n

All pages must sit under `src/app/[locale]/`. Use `next-intl` hooks (`useTranslations`, `useLocale`). Translation files are in `src/i18n/locales/`.

### Path Aliases

```
@/*          → src/*
@/components → src/components
@/features   → src/features
@/services   → src/services
@/stores     → src/stores
@/hooks      → src/hooks
@/libs       → src/libs
@/constants  → src/constants
@/configs    → src/configs
@/types      → src/types
@/i18n       → src/i18n
@/server     → src/server
```

### Environment Variables

Copy `.env.example` to `.env.local`. Required vars:

- `MONGODB_URI` — MongoDB connection string
- `AUTH_SECRET` — JWT signing secret (min 32 chars)
- `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY` — e.g. `15m` / `7d`
- `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_API_URL`

Include exactly these sections in CLAUDE.md in this order:

1. Project Overview: what Goal stack does in 2–3 sentences.

2. Tech Stack: list with versions where relevant.

3. Dev Commands: how to install, run the dev server, and build.

4. Core Logic Summary: brief mention of the weight calculation.

5. Key Constraints: things Claude must never change or assume.

6. Additional Documentation: direct links pointing to the specific domain files created in the `rules/docs/requirements` folder.

Structure of docs and requirements.
<role></role>
<context></context>
<task></task>
<requirement></requirement>
<tone></tone>

- Limit 150 rows each file .md in folder rules/docs

- **Branch Management**: Before adding any features or fix bugs, always work on a new git branch. Never commit directly on main. Bug branches must follow naming convention bug/[desc], feature branches follow naming convention feature/[desc]

- **Responsive UI**: Every new feature or new page MUST be responsive across mobile, tablet, and desktop. Build mobile-first with Tailwind responsive prefixes (`sm:` / `md:` / `lg:`); never ship a layout that only works at desktop width. Verify the page reflows correctly at small viewports before considering the work done.
