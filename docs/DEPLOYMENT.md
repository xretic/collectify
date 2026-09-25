# Deployment

- [Requirements](#requirements)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Option A — Node server](#option-a--node-server)
- [Option B — Vercel](#option-b--vercel)
- [OAuth](#oauth)
- [First admin](#first-admin)
- [Production checklist](#production-checklist)

## Requirements

- Node.js **≥ 20.9**
- A [Neon](https://neon.tech) Postgres database (pooled and direct connection strings)
- Optional: Redis (Upstash or any `redis://` server), Pusher, Uploadcare, GitHub / Google OAuth apps

## Environment variables

Copy [`.env.example`](../.env.example) to `.env` and fill it in.

| Variable                            | Required | Description                                                                  |
| ----------------------------------- | :------: | ---------------------------------------------------------------------------- |
| `DATABASE_URL`                      |    ✅    | Neon **pooled** connection string, used by the app                           |
| `DIRECT_URL`                        |    ✅    | Neon **direct** (non-pooler) connection string, used by `prisma migrate`     |
| `APP_URL`                           |          | Public origin, e.g. `https://collectify.app`. OAuth redirects and the WebSocket origin check; falls back to the request origin |
| `GOOGLE_CLIENT_ID` / `_SECRET`      |          | Google sign-in                                                               |
| `GITHUB_CLIENT_ID` / `_SECRET`      |          | GitHub sign-in                                                               |
| `PUSHER_APP_ID` / `PUSHER_SECRET`   |          | Pusher server credentials (Vercel realtime)                                  |
| `NEXT_PUBLIC_PUSHER_KEY` / `_CLUSTER` |        | Pusher client credentials; when set, the client uses Pusher instead of Socket.IO |
| `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` |          | Image uploads (avatars, banners, covers, items)                              |
| `REDIS_URL`                         |          | `redis://` server for cache and rate limits                                  |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` |          | Upstash REST — takes precedence over `REDIS_URL`                             |

Without Redis, rate limits fall back to an in-process counter and the cache is disabled.

## Database

```bash
npm run db:migrate      # prisma migrate deploy — uses DIRECT_URL
```

Run it on every deploy before starting the new version. Migrations include Postgres triggers and
`pg_trgm` indexes, so apply them with Prisma rather than `db push`.

## Option A — Node server

The custom server ([`server.mjs`](../server.mjs)) serves Next.js and Socket.IO on one origin, so
realtime works with no third-party service.

```bash
npm ci
npm run build
npm run db:migrate
npm start               # PORT (default 3000) and HOSTNAME (default 0.0.0.0) are honoured
```

Put it behind a reverse proxy that forwards WebSocket upgrades on `/socketio`, and set `APP_URL` to
the public origin.

## Option B — Vercel

Vercel does not run `server.mjs`, so realtime goes through Pusher:

1. Create a [Pusher Channels](https://pusher.com/channels) app.
2. Set `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`.
3. Set `DATABASE_URL`, `DIRECT_URL`, `APP_URL` and, ideally, the Upstash variables.
4. Add `npm run db:migrate` to your deploy pipeline.

Private channels are authorised by `app/api/realtime/pusher`.

## OAuth

Register one OAuth app per provider with this callback URL:

```text
<APP_URL>/api/auth/callback/github
<APP_URL>/api/auth/callback/google
```

A new OAuth account is linked to an existing user with the same email.

## First admin

Admin rights can only be granted by someone with database access:

```bash
npm run admin -- grant <username|id>
npm run admin -- list
npm run admin -- revoke <username|id>   # refuses to remove the last admin
```

Admins then manage moderators, verified badges, categories and tags from `/management`.

## Production checklist

- [ ] `DATABASE_URL` points at the **pooled** endpoint, `DIRECT_URL` at the direct one
- [ ] `npm run db:migrate` runs before the new version starts
- [ ] `APP_URL` is set to the public `https://` origin
- [ ] Redis is configured (shared rate limits across instances)
- [ ] Realtime works: Socket.IO behind a WebSocket-aware proxy, or Pusher on Vercel
- [ ] At least one admin exists
