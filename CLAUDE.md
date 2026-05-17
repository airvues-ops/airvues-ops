# Airvues Ops — Claude Context
> Last Updated: 2026-04-26

Internal operations dashboard for Airvues LLC. Next.js 14, reads/writes Airtable base `app4vhhWMbRFOloOU`, Google Workspace auth (`@airvues.com` domain-restricted), deployed to Vercel.

## What this is

- **Purpose:** Lee + Enrique + the trio's daily home for running Airvues — KPIs, money in/out, pipeline, team, software stack. Phase 2 adds time entry, standups, kanban.
- **Replaces:** Direct Airtable views for non-Airtable-savvy users. Airtable remains source of truth for data; this is a polished read/write surface on top.
- **Target deploy:** Vercel — `ops.airvues.com` long-term, `airvues-ops.vercel.app` for dev.
- **Spec:** `docs/specs/2026-04-24-airvues-ops-dashboard-design.md` (v1, 14 sections, locked direction).
- **Mockup:** `mockups/founder-home-v2.html` (visual reference; do not edit without updating the spec).

## Stack

- Next.js 14 App Router (Server Components + Server Actions)
- TypeScript strict
- Tailwind CSS — Airvues brand colors (`tailwind.config.ts`); navy + cream + JetBrains Mono numerics
- NextAuth v5 with Google provider, `hd=airvues.com` Workspace restriction
- Airtable REST API — server-only via `lib/airtable.ts`
- Deployed to Vercel

## Security model

- `AIRTABLE_TOKEN` is server-only. `lib/airtable.ts` uses `"server-only"` import marker. Verified with `grep` on `.next/static` before deploy.
- Auth via Google OAuth — `hd=airvues.com` enforced at provider level; non-Workspace accounts can't complete sign-in.
- Role allowlist (`ALLOWED_USERS` env JSON) — admin / editor / viewer.
- Permission checks server-side only (middleware + `requireRole()` in server actions).
- All mutations via Server Actions — no exposed JSON write endpoints.
- `.env.local` gitignored.

## Local development

```bash
cp .env.local.example .env.local
# Fill in real values
npm install
npm run dev
# http://localhost:3000 → sign in with Google (must be @airvues.com or leetsao1@gmail.com)
```

Generate `AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploy to Vercel

1. Push this directory to its own GitHub repo.
2. Vercel → "Add New Project" → import.
3. Environment variables: `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `ALLOWED_USERS`, `NEXTAUTH_URL`.
4. Add Google OAuth authorized redirect URI: `https://<deployed-url>/api/auth/callback/google`.
5. Deploy.

## File map

```
airvues-ops/
├── app/
│   ├── (auth)/login/page.tsx        # Google sign-in
│   ├── (app)/
│   │   ├── layout.tsx                # Masthead + nav (auth-required)
│   │   ├── page.tsx                  # Founder home — KPIs / Money / Pipeline / Team / Stack
│   │   ├── pipeline/page.tsx         # Phase 2
│   │   ├── team/page.tsx             # Phase 2
│   │   ├── clients/page.tsx          # Phase 2
│   │   ├── money/page.tsx            # Phase 2
│   │   ├── stack/page.tsx            # Phase 2
│   │   └── settings/page.tsx         # Phase 2 — admin only
│   ├── api/auth/[...nextauth]/route.ts
│   ├── globals.css                   # Tailwind base + Google Fonts imports
│   └── layout.tsx                    # Root layout
├── components/
│   ├── kpi/                          # KPI tile components
│   ├── pipeline/                     # Pipeline lane widgets
│   ├── team/                         # Team panel components
│   └── stack/                        # Stack list rows
├── lib/
│   ├── airtable.ts                   # Server-only typed client
│   ├── auth.ts                       # NextAuth config + requireRole helper
│   ├── schema.ts                     # Field-ID map (canonical reference)
│   ├── kpi/                          # Per-KPI calculator modules
│   └── activity.ts                   # "Since yesterday" diff (Phase 2 — needs Vercel KV)
├── scripts/
│   └── verify-schema.ts              # CI: validates field IDs against live Meta API
├── docs/specs/
│   └── 2026-04-24-airvues-ops-dashboard-design.md
├── mockups/
│   ├── founder-home-v1.html
│   └── founder-home-v2.html
├── middleware.ts                     # Edge auth gate
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local.example
```

## Hard rules for this project

1. **Airtable token stays server-side.** Never `import` from `airtable.ts` in a client component. Pass data down from Server Components. Pre-deploy verification: `grep -r "patAir\|AIRTABLE_TOKEN" .next/static` should return nothing.
2. **Field IDs, not field names.** All Airtable queries reference field IDs from `lib/schema.ts`. Field renames in Airtable don't break the dashboard.
3. **`scripts/verify-schema.ts` runs as `prebuild`.** PR fails if the field-ID map drifts from live Meta API.
4. **Role check on every mutation.** `requireRole(session, 'admin'|'editor')` runs at the top of every Server Action. Don't trust client-side role.
5. **Rate limit: 5 req/sec per base.** Server-side fan-out caps concurrency at 4. KPI queries use Next.js `unstable_cache` with 5-min revalidation.
6. **Never put sensitive PII in code or logs.** Comp / equity numbers from People are admin-only at the rendering layer; never logged.
7. **Brand: lock the palette.** Tailwind config is the single source. New colors require spec update.

## Related docs

- Project home: `~/Desktop/claude-projects/Airvues/CLAUDE.md`
- Strategic context (5/10 year): `~/Desktop/claude-projects/Airvues/2026 Yearly Planning/Airvues_5_10_Year_Plan.md`
- Master plan / KPI targets: `~/Desktop/claude-projects/Airvues/2026 Yearly Planning/Airvues_2026_Master_Plan.md`
- Schema cache: `/tmp/airvues_schema.json` (refresh via Meta API)
- Credentials: `~/Desktop/claude-projects/.credentials/airvues/airvues_airtable_apiKey.txt`
- Sister project pattern: `~/Desktop/Coding Workspace/life-context-web/` (life-context dashboard, similar architecture)

## Current state (2026-04-26)

- ✅ Spec v1 written (locked direction, 14 sections)
- ✅ Mockups v1 + v2
- ✅ Subscriptions schema additions (Category, Health, URL, Owner) live in Airtable
- ✅ Project scaffolded (this commit)
- ⏳ Auth wiring — in progress
- ⏳ Founder home page — in progress
- ⏳ Other 6 routes — Phase 1.5 / 2
- ⏳ Vercel deploy — not yet
- ⏳ Phase 2 (time entry, standups, kanban) — not started
