# Airvues Ops

Internal operations dashboard for Airvues LLC. Next.js 14 + NextAuth (Google Workspace) + Airtable.

> See [`CLAUDE.md`](./CLAUDE.md) for full context, security model, and file map.
> See [`docs/specs/2026-04-24-airvues-ops-dashboard-design.md`](./docs/specs/2026-04-24-airvues-ops-dashboard-design.md) for the canonical design spec.

## Quick start

```bash
cp .env.local.example .env.local
# Fill in: AIRTABLE_TOKEN, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET, ALLOWED_USERS
npm install
npm run dev
```

Sign in at http://localhost:3000 with a `@airvues.com` Google account (or `leetsao1@gmail.com`).

## Spec status

- v1 (2026-04-24): Direction locked, 14 sections, mockup approved
- v1.1 (2026-04-26): Auth changed from Email magic link → Google Workspace OAuth

## Deploy

Push to GitHub → Vercel "Add New Project" → set env vars → deploy. See `CLAUDE.md` § "Deploy to Vercel".
