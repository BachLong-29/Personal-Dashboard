# Second Brain — Project Documentation

A personal knowledge-management (PKM) web app built and used by a single person ("me"). The guiding idea: **everything is a connected node** — notes, tasks, clipped articles, and raw ideas all live in one substrate and can link to anything else.

This folder is the working specification. Treat it as a living set of documents — update it as the build teaches you things.

## How to read these docs

| #   | Document                                                                 | What it answers                                                           |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 1   | [01-vision-and-goals.md](./01-vision-and-goals.md)                       | Why this exists, the principles, and how I'll know it worked              |
| 2   | [02-use-cases-and-user-stories.md](./02-use-cases-and-user-stories.md)   | Who uses it and in what situations; user stories with acceptance criteria |
| 3   | [03-functional-requirements.md](./03-functional-requirements.md)         | What the system must _do_, by module, with traceable IDs                  |
| 4   | [04-non-functional-requirements.md](./04-non-functional-requirements.md) | How well it must do it — speed, portability, privacy, durability          |
| 5   | [05-data-model.md](./05-data-model.md)                                   | Entities, relationships, and schema (the node + link backbone)            |
| 6   | [06-architecture-and-tech-stack.md](./06-architecture-and-tech-stack.md) | Recommended stack and the key build decisions with tradeoffs              |
| 7   | [07-mvp-and-roadmap.md](./07-mvp-and-roadmap.md)                         | What ships first and the phase plan after                                 |
| 8   | [08-glossary.md](./08-glossary.md)                                       | Definitions of PKM and project terms used throughout                      |

## Project at a glance

- **Product type:** Single-user web application (personal second brain)
- **Differentiator:** A unified node + typed-link model — connection is a first-class feature, not an afterthought
- **Core scope (MVP):** Notes, `[[wikilinks]]` + backlinks, tags, full-text search, quick capture
- **Builder:** Solo developer (me)
- **Recommended stack:** React + TypeScript + Vite, TipTap editor, Supabase (Postgres/Auth/Storage), Postgres full-text search
- **Non-negotiables:** Capture in <3s, instant search, plain-markdown export from day one

## Requirement ID convention

- `FR-<MODULE>-<n>` — functional requirement (e.g. `FR-LINK-01`)
- `NFR-<CATEGORY>-<n>` — non-functional requirement (e.g. `NFR-PERF-01`)
- `US-<n>` — user story
- Priorities use MoSCoW: **Must / Should / Could / Won't (this release)**
