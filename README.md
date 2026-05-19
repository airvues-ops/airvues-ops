# Airvues Ops

Internal operations dashboard for Airvues LLC. Built by Lee + Claude, handing off to Enrique to extend.

**Live:** [airvues-ops.vercel.app](https://airvues-ops.vercel.app)
**Stack:** Next.js 14 App Router · TypeScript · Tailwind · NextAuth Google OAuth · Airtable

> ⚠️ Before touching code, read [`CLAUDE.md`](./CLAUDE.md) — it has the do's, don'ts, and patterns that already broke once.

## What it does

Single dashboard for the team to run Airvues. Reads + writes the operational Airtable base (`app4vhhWMbRFOloOU`).

| Page | What lives there |
|---|---|
| `/` Home | KPIs + 2026 goal bars ($500K target, $750K bonus stretch) + Jump-to |
| `/me` | Personal scorecard — commission, bonus tracker, "next to ship" |
| `/money` | Invoices, AR aging, MRR, top clients — full filter/drill-in |
| `/pipeline` | Quotes funnel, stalled quotes, pipeline value |
| `/engineering` | Stories grouped by engineer + leaderboard + orphan banner |
| `/backlog` | Flat sortable table, bulk-triage, inline drawer edit, create story |
| `/sprints` | Index + velocity sparkline + create sprint |
| `/sprints/[id]` | Kanban board with quick-advance + ship |
| `/sprints/[id]/plan` | Capacity planning per engineer + backlog plan chips |
| `/clients` | Companies, retainer tier, at-risk |
| `/team` | People, payments owed, onboarding |
| `/stack` | Internal SaaS subscriptions |
| `/hygiene` | Data quality blockers + orphan story triage |

## Local development

```bash
git clone git@github.com:leetsao1/airvues-ops.git
cd airvues-ops
cp .env.local.example .env.local
# Get real values from Lee — they live in ~/Desktop/claude-projects/.credentials/airvues/
npm install
npm run dev
```

Visit http://localhost:3000 and sign in with your `@airvues.com` Google account.

**Env vars needed:**
- `AIRTABLE_TOKEN` — server-only (token leak vector)
- `AIRTABLE_BASE_ID` — `app4vhhWMbRFOloOU`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Google Cloud OAuth client (project `airvues-ops`)
- `AUTH_SECRET` — random 32-byte hex for NextAuth JWT signing
- `NEXTAUTH_URL` — `http://localhost:3000` locally, `https://airvues-ops.vercel.app` in prod
- `ALLOWED_USERS` — JSON array of `{email|domain, role}` entries

## Auth model

- **Provider:** Google OAuth (no domain restriction at provider level — Lee's personal Gmail is allowed)
- **Allowlist:** `ALLOWED_USERS` env var combines per-email overrides + a domain wildcard
  ```json
  [
    {"email":"leetsao1@gmail.com","role":"admin"},
    {"email":"enrique.torreblanca@airvues.com","role":"admin"},
    {"domain":"airvues.com","role":"engineer"}
  ]
  ```
  New `@airvues.com` hires auto-onboard as `engineer` once their Workspace account exists.
- **Roles:** `admin` / `lead` / `engineer` / `client`. Page access + mutation rights derive from this.

Full design: [`docs/auth-architecture-2026-05-17.md`](./docs/auth-architecture-2026-05-17.md)

## Deploy

Vercel auto-deploys on push to `main` (once the GitHub integration is connected). Manual deploy:
```bash
vercel --prod
```

Env vars are set in the Vercel project (Settings → Environment Variables). Mirror with `.env.local`.

## Status (2026-05-19)

Built and shipped:
- ✅ Read dashboards for all 12 pages
- ✅ Full agile loop — backlog refinement, story creation, sprint kanban, planning, velocity
- ✅ Personal scorecard + gamification (leaderboard, bonus pool tracker)
- ✅ Data hygiene tooling (orphan triage UI + companies reclassification script)
- ✅ Google OAuth + role-based gating on all mutations
- ✅ 22 routes, all responding; TS strict + build clean

Deferred (handoff items, see [`CLAUDE.md`](./CLAUDE.md) "What's deferred"):
- Phase 2 auth — derive role from Airtable People table after duplicate cleanup
- Phase 3 auth — field-level redaction (hide Comp Amount, Equity %, Story.Cost from non-admins)
- Phase 4 auth — client portals
- Deep-link param hydration on remaining pages
- Drag-and-drop kanban
- Time Entries logging UI
- CSV exports + global search

## Repo conventions

See [`CLAUDE.md`](./CLAUDE.md) for the full set of do's, don'ts, and patterns.

Highlights:
- Field IDs from `lib/schema.ts`, never field names hardcoded in mutations
- All writes via `lib/mutations/*.ts` Server Actions, gated by `requireRole(...)`
- Cache invalidation via `revalidateTag("airtable")` (umbrella) after every write
- Single source of truth for nav at `lib/nav.ts`
- Client-safe types live in `lib/*-types.ts`, server-only logic in `lib/*.ts`
- Pages accept `searchParams` for deep-link filter state (Next.js 15 promise form)

## Contact

- **Lee Tsao** (COO, original builder) — ltsao@airvues.com
- **Enrique Torreblanca** (CTO, extending) — enrique.torreblanca@airvues.com
