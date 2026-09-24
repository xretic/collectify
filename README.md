# Collectify

Collectify is a full-stack web application for creating, managing, and sharing collections of items.

## Features

**Collections & items**

- Collections with predefined categories, public or private
- Add, edit, delete and drag-and-drop reorder items
- Likes, favorites, comments, per-collection statistics

**Social**

- Follow users, direct messages in realtime (Socket.IO or Pusher)
- Notifications for follows, likes, favorites, comments and moderation outcomes

**Discovery**

- Home feed (followed authors first), category filter, search, sorting
- Filters and pagination live in the URL, so every view is shareable

**Moderation**

- Reports on users, messages, comments and collections, with an evidence snapshot
- FIFO review queue with context (conversation around a message, prior reports, active sanctions)
- Atomic report review: sanctions never weaken a stronger one, duplicates close together
- Sanctions (account ban, comments/messenger mute), roles, audit log, impersonation

## Screenshots

| Home feed                                      | Collection                                                 |
| ---------------------------------------------- | ---------------------------------------------------------- |
| ![Home Feed](docs/screenshots/3-home-feed.png) | ![Collection Page](docs/screenshots/1-collection-page.png) |

| Chats                                  | Notifications                                          |
| -------------------------------------- | ------------------------------------------------------ |
| ![Chats](docs/screenshots/5-chats.png) | ![Notifications](docs/screenshots/2-notifications.png) |

## Architecture

The code follows [Feature-Sliced Design](https://feature-sliced.design); a layer may import only from
layers below it.

| Layer       | Contents                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------- |
| `app/`      | Next.js routing only: pages, layouts, thin API route handlers                             |
| `views/`    | Page compositions                                                                         |
| `widgets/`  | Large self-contained blocks (navbar, chat window, comments section…)                      |
| `features/` | User actions: UI + `server/` services (report review, sanctions, follow…)                 |
| `entities/` | Domain models, DTO types, client `api/`, server `server/` queries, presentational `ui/`   |
| `shared/`   | Framework glue: `server/` (db, http, rate limit, cache), UI primitives, validation, theme |

Conventions:

- Every API route is `route(handler)` + a zod schema (`readBody`/`readQuery`) + a service call.
  Errors are thrown as `ApiError` and mapped to JSON responses.
- Server-only modules start with `import 'server-only'`.
- Styles live in the component's `index.module.css`. One MUI theme (`shared/config/theme.ts`)
  holds global component overrides; colours are CSS variables from `app/globals.css`.
  No style objects in `.tsx` files.
- Server state is React Query; zustand is used only for tiny cross-tree UI state.

## Tech stack

Next.js 16 (App Router, custom server) · React 19 · TypeScript · MUI 7 · TanStack Query ·
zustand · zod · Prisma 7 (PostgreSQL / Neon) · Redis (Upstash or ioredis) · Socket.IO / Pusher ·
dnd-kit · Vitest

## Getting started

Requirements: Node.js ≥ 20.9, PostgreSQL.

```bash
git clone https://github.com/xretic/collectify.git
cd collectify
cp .env.example .env   # fill in DATABASE_URL at least
npm install
npm run db:migrate
npm run dev
```

Grant yourself admin rights (there is intentionally no HTTP endpoint for this):

```bash
npm run admin -- grant <username|id>
```

## Scripts

| Script                    | What it does                                        |
| ------------------------- | --------------------------------------------------- |
| `npm run dev`             | Next.js + Socket.IO on one origin (`server.mjs`)    |
| `npm run build` / `start` | Production build / server                           |
| `npm run lint`            | ESLint                                              |
| `npm run typecheck`       | Route types + `tsc`                                 |
| `npm run format:check`    | Prettier                                            |
| `npm test`                | Vitest (integration tests need `TEST_DATABASE_URL`) |
| `npm run db:migrate`      | Apply migrations (`prisma migrate deploy`)          |
| `npm run admin`           | Grant / revoke / list admins                        |

## Realtime

`npm run dev` and `npm start` run `server.mjs`, which serves Next.js and Socket.IO on the same
origin (`/socketio`). Sockets authenticate with the session cookie directly against the database.

On Vercel the custom server is not used — set the `PUSHER_*` / `NEXT_PUBLIC_PUSHER_*` variables and
the client switches to Pusher automatically.
