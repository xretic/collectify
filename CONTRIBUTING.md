# Contributing to Collectify

Thanks for taking the time to contribute! This guide explains how to get set up and what we look for
in a pull request.

- [License](#license)
- [Code of conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Project conventions](#project-conventions)
- [Commit messages](#commit-messages)
- [Pull request checklist](#pull-request-checklist)

## License

Collectify is source-available under the [Collectify Source-Available License](LICENSE). By
submitting a pull request you agree that your contribution is licensed to the maintainer as
described in section 5 of the license.

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold
it.

## Ways to contribute

- **Report a bug** — open an issue with the _Bug report_ template. Include steps to reproduce.
- **Suggest a feature** — open an issue with the _Feature request_ template before writing code, so
  we can agree on the approach.
- **Fix something** — issues labelled `good first issue` are a great place to start.
- **Security issues** — never open a public issue; follow the [security policy](SECURITY.md).

## Development setup

```bash
git clone https://github.com/xretic/collectify.git
cd collectify
cp .env.example .env        # DATABASE_URL and DIRECT_URL are required
npm install                 # also runs prisma generate and installs git hooks
npm run db:migrate
npm run dev
```

Before pushing, make sure everything passes:

```bash
npm run lint
npm run typecheck
npm run format:check
```

A pre-commit hook runs Prettier on staged files.

## Project conventions

The full picture is in the [architecture guide](docs/ARCHITECTURE.md). The rules that matter most:

**Layers.** The code follows [Feature-Sliced Design](https://feature-sliced.design):
`app → views → widgets → features → entities → shared`. Import only from layers below; slices on
the same layer do not import each other.

**API routes** are thin: guard, rate limit, validate with zod, call a service.

```ts
export const POST = route(async (req) => {
  const viewer = await requireViewer(req);
  await enforceRateLimit(req, 'create', viewer.userId);

  const input = await readBody(req, createThingSchema);
  return json(await createThing(viewer.userId, input), 201);
});
```

Throw `ApiError` helpers (`badRequest`, `forbidden`, `notFound`, `conflict`) instead of building
responses by hand.

**Server code** starts with `import 'server-only'` and lives in a slice's `server/` segment.

**Styles** go in the component's `index.module.css`. Use theme tokens (`var(--accent)`,
`var(--text-color)`…) from `app/themes.css` — never hard-coded colors — and keep style objects out
of `.tsx` files. Global MUI overrides belong in `shared/config/theme.ts`.

**State.** Server state is TanStack Query. Reach for zustand only for small cross-tree UI state.

**Database changes** need a Prisma migration (`npm run db:migrate:dev -- --name <change>`). Prefer
indexes that serve the exact query, and keyset over offset pagination for large lists.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org):

```text
feat(chat): mute a conversation
fix(feed): keep board tabs in saved order
docs: add deployment guide
```

Common types: `feat`, `fix`, `refactor`, `perf`, `docs`, `chore`, `test`.

## Pull request checklist

- [ ] The PR does one thing and explains why
- [ ] `npm run lint`, `npm run typecheck` and `npm run format:check` pass
- [ ] Layer boundaries are respected
- [ ] New API input is validated with zod and rate limited where it makes sense
- [ ] UI works in light and dark themes and on mobile
- [ ] Screenshots are attached for visible changes
- [ ] Docs are updated when behaviour or configuration changes
