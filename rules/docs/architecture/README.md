# Architecture Overview

Aetheria Personal Dashboard là một full-stack RPG-gamified productivity app xây dựng trên Next.js App Router. Toàn bộ backend và frontend nằm trong cùng một repository (monorepo).

---

## Tech Stack

| Layer        | Technology                | Version        |
| ------------ | ------------------------- | -------------- |
| Framework    | Next.js (App Router)      | 16.2.4         |
| UI           | React                     | 19.2.4         |
| Language     | TypeScript                | 5              |
| Styling      | Tailwind CSS v4           | 4              |
| Server State | TanStack React Query      | 5.100.9        |
| Client State | Zustand                   | 5.0.13         |
| HTTP Client  | Axios                     | 1.16.0         |
| Database     | MongoDB via Mongoose      | 9.6.2          |
| Auth         | JSON Web Token + bcryptjs | 9.0.3 / 3.0.3  |
| Forms        | React Hook Form + Zod     | 7.75.0 / 4.4.3 |
| i18n         | next-intl                 | 4.11.1         |
| Animation    | Framer Motion             | 12.38.0        |
| Drag & Drop  | @dnd-kit/core             | 6.3.1          |

---

## Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/v1/                   # REST API routes
│   │   ├── auth/                 # login, register, refresh
│   │   ├── quests/               # CRUD + rollover
│   │   ├── habits/               # CRUD + habit-logs
│   │   ├── tasks/                # CRUD (single & multi-day)
│   │   ├── task-logs/            # daily session logs
│   │   ├── profile/              # hero profile + settings
│   │   ├── rewards/              # marketplace rewards
│   │   ├── categories/           # task/quest tags
│   │   ├── stats/                # analytics
│   │   ├── penalty/              # penalty state (GET, POST, complete, fail)
│   │   └── health/               # health check
│   │
│   └── [locale]/                 # i18n routing (en / vi / th)
│       ├── (public)/             # login, register
│       └── (protected)/          # dashboard, tasks, profile, marketplace
│           └── layout.tsx        # auth guard + PenaltyGate
│
├── features/                     # Feature-based modules
│   ├── dashboard/
│   │   ├── components/           # MainDashboard, QuestPanel, HabitPanel, PenaltyGate, ...
│   │   ├── hooks/                # useQuests, useHabits, useTasks, usePenaltyStatus, ...
│   │   ├── types/                # Quest, Habit, Task, Character, PenaltyState, ...
│   │   ├── constants/            # ESCALATIONS, RANKS, XP_MAP, QUEST_ROLLOVER_KEY, ...
│   │   └── data/                 # mock data (achievements)
│   ├── auth/                     # LoginForm, RegisterForm, auth store
│   ├── tasks/                    # TaskManagement, day/week/month views
│   ├── rewards/                  # RewardManagement, marketplace
│   ├── profile/                  # ProfilePage, hero identity editor
│   ├── user/                     # useMe hook
│   └── marketplace/              # Marketplace display
│
├── components/                   # Shared UI (Button, Card, Modal, Input, ...)
│   └── providers/                # QueryProvider, ThemeProvider
│
├── server/                       # Server-only utilities
│   ├── models/                   # Mongoose models (see database.md)
│   ├── helpers/                  # get-auth-user.ts
│   ├── async-handler.ts          # try-catch wrapper cho API routes
│   ├── response.ts               # successResponse, errorResponse, ...
│   └── validate.ts               # Zod body/query validation
│
├── libs/
│   ├── axios/                    # Axios instance + JWT interceptor
│   ├── jwt/                      # sign/verify access & refresh tokens
│   ├── mongodb/                  # Mongoose connection (singleton)
│   ├── cookies/                  # cookie read/write helpers
│   └── utils/                    # cn() (clsx + tailwind-merge)
│
├── stores/
│   ├── ui.store.ts               # toasts, sidebar state (non-persisted)
│   └── features/auth/            # auth store (persisted in localStorage)
│
├── constants/
│   ├── query-keys.ts             # React Query key factory
│   ├── auth.ts                   # TOKEN_KEYS, route guards
│   └── hero-data.ts              # classes, companions, badges, ranks, accents
│
├── types/                        # Global TypeScript types
│   ├── api.ts                    # ApiResponse<T>, PaginationMeta
│   ├── auth.ts                   # User, AuthTokens
│   ├── quest.ts, habit.ts, task.ts, profile.ts, reward.ts, ...
│   └── index.ts                  # re-exports
│
├── configs/
│   └── env.ts                    # env variable validation (client + server)
│
└── i18n/
    ├── config.ts                 # locales: ['en', 'vi', 'th'], defaultLocale: 'en'
    ├── routing.ts                # next-intl routing
    └── locales/                  # en/, vi/, th/ JSON message files
```

---

## Request Lifecycle

```
Browser
  │
  ▼
Next.js Middleware (i18n locale detection)
  │
  ▼
[locale]/(protected)/layout.tsx
  ├─ Server: verify JWT from cookie → redirect to /login if invalid
  └─ Client: <PenaltyGate> → fetch pending penalty → block if found
  │
  ▼
Page Component (Server Component)
  │
  ▼
Feature Client Component ('use client')
  │
  ├─ React Query (useQuery / useMutation)
  │     │
  │     ▼
  │   Axios instance
  │     ├─ Request interceptor: attach Authorization: Bearer <token>
  │     └─ Response interceptor: on 401 → refresh token → retry
  │           │
  │           ▼
  │         /api/v1/* (Next.js API Route Handler)
  │               ├─ asyncHandler (try-catch)
  │               ├─ getAuthUser (verify Bearer JWT)
  │               ├─ validateBody / validateSearchParams (Zod)
  │               ├─ Mongoose Model queries
  │               └─ successResponse / errorResponse (JSON)
  │
  └─ Zustand (UI state: toasts, sidebar)
```

---

## Environment Variables

```bash
# MongoDB
MONGODB_URI=

# JWT
AUTH_SECRET=          # min 32 chars, dùng cho cả access + refresh token signing
ACCESS_TOKEN_EXPIRY=  # e.g. "15m"
REFRESH_TOKEN_EXPIRY= # e.g. "7d"

# App
NEXT_PUBLIC_API_URL=  # base URL cho Axios (e.g. http://localhost:3000/api/v1)
```

---

## Further Reading

- [auth.md](./auth.md) — JWT flow, cookie strategy, token refresh
- [data-flow.md](./data-flow.md) — State management và data fetching patterns
- [database.md](./database.md) — MongoDB models và relationships
- [api-conventions.md](./api-conventions.md) — API route conventions và response format
