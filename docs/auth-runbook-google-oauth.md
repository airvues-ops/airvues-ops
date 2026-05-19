# OAuth Runbook — Switch airvues-ops to Google Sign-In

**Time required:** ~30 min, all in Google Cloud Console + Vercel
**Outcome:** team signs in with `@airvues.com` Google accounts (or Lee's `leetsao1@gmail.com`), each user gets their real identity + role.

This decommissions the shared password and the dormant SAML setup. After this, `/me` auto-resolves to the signed-in user — no more `?as=` query param.

## Prereqs

- Lee has Super Admin on `airvues.com` Google Workspace.
- Vercel project access to `airvues-ops`.

---

## Step 1 — Create the OAuth client (~10 min)

1. Open https://console.cloud.google.com/apis/credentials
2. Top dropdown: select an existing project or **+ NEW PROJECT** named `airvues-ops`.
3. Click **Configure OAuth consent screen** (left rail).
   - User Type: **Internal** (because you want only airvues.com accounts + the personal Gmail allowlist).
   - App name: `Airvues Ops`
   - User support email: `lee@airvues.com`
   - Developer contact: `lee@airvues.com`
   - Save and continue through scopes (no extras needed — `email`, `profile`, `openid` are default).
4. Back to **Credentials → + CREATE CREDENTIALS → OAuth client ID**.
   - Application type: **Web application**
   - Name: `airvues-ops production`
   - **Authorized JavaScript origins:** `https://airvues-ops.vercel.app`
   - **Authorized redirect URIs:**
     - `https://airvues-ops.vercel.app/api/auth/callback/google`
     - (optional, for local dev) `http://localhost:3000/api/auth/callback/google`
   - Create. Copy the **Client ID** and **Client secret** — you'll paste them into Vercel next.

## Step 2 — Set env vars in Vercel (~5 min)

In the Vercel dashboard → `airvues-ops` → Settings → Environment Variables. Add for **Production** scope:

| Key | Value |
|---|---|
| `AUTH_GOOGLE_ID` | (from Step 1) |
| `AUTH_GOOGLE_SECRET` | (from Step 1) |
| `NEXTAUTH_URL` | `https://airvues-ops.vercel.app` |
| `AUTH_SECRET` | (keep existing — same value as before; if missing, run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and set it) |
| `ALLOWED_USERS` | (see Step 3) |

**Delete** these from Vercel (they're no longer needed):
- `ACCESS_PASSWORD`
- `AUTH_METHOD`
- `AUTH_BYPASS` (only if currently set)
- Any `SAML_*` variables

## Step 3 — Define `ALLOWED_USERS` (the role map)

This is the source of truth for who gets in + what role they have. JSON array of `{email, role}`.

```json
[
  {"email":"leetsao1@gmail.com","role":"admin"},
  {"email":"lee@airvues.com","role":"admin"},
  {"email":"enrique@airvues.com","role":"admin"},
  {"email":"shania@airvues.com","role":"lead"},
  {"email":"jose@airvues.com","role":"lead"},
  {"email":"bracho@airvues.com","role":"lead"},
  {"email":"cody@airvues.com","role":"engineer"}
]
```

Roles:
- **admin** — Lee, Enrique. Everything visible, everything writeable.
- **lead** — Shania, Jose, Bracho. Most visible, can edit any story / quote. Sensitive comp fields hidden.
- **engineer** — Cody (and future ICs). Read mostly, edit only own assignments.
- **client** — reserved for Phase 4 portals.

Confirm the actual `@airvues.com` email addresses with Enrique before pasting. (Lee's domain `airvues.com` users — what's Cody's actual address? What about Bracho who may use a personal email?)

## Step 4 — Tell me you're done, I make the code changes

Once Steps 1-3 are saved in Vercel, ping me. I'll:

1. Remove `hd: "airvues.com"` restriction from `lib/auth.ts` (it blocks your personal Gmail).
2. Make `lib/session.ts` prefer NextAuth over the SAML cookie (so Google sign-in wins over leftover password cookies).
3. Update the login page to "Sign in with Google" instead of password form.
4. Delete `app/api/auth/password/login/route.ts`, `app/api/auth/saml/*`, `lib/saml.ts`, `lib/samlSession.ts`.
5. Strip `middleware.ts` of the SAML branch.

**Code change is ~30 LOC + deletions. No new bugs to introduce.**

## Step 5 — Verify (5 min)

After I deploy:

1. Open https://airvues-ops.vercel.app in a fresh incognito window.
2. You should see "Sign in with Google" — click it.
3. Sign in as `leetsao1@gmail.com`. You should land on `/`.
4. Visit `/me` — should auto-resolve to your engineer record (or show "no People record" if your email isn't matched to a People row yet).
5. Repeat with `enrique@airvues.com`. Confirm role=admin reflects.
6. Have Shania try — confirm role=lead, that `/team` hides Comp Amount fields.
7. Have Cody try — confirm role=engineer, that he can only edit stories assigned to him.

If any test fails, we troubleshoot via Vercel logs (`vercel logs airvues-ops --token <token>`).

## Why we're not using SAML

Previous SAML setup got blocked by Google's `app_not_configured_for_user` error. Per the audit, the most likely cause was:

> Google Admin → Apps → Web and mobile apps → `airvues-ops` → User access was set to "OFF for everyone" or limited to a specific OU that didn't include Lee.

Being Super Admin doesn't auto-grant access to a SAML app — the User access setting per-app is separate. If you want to revive SAML later, set User access to ON for the right OU. But Google OAuth is simpler for our scale.

## Why we're not using magic-link / email OTP

Adds infra (Resend/SES), worse UX than "Sign in with Google" for a Workspace team. The team is already in Google Workspace, so OAuth is the natural choice.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Error 400: redirect_uri_mismatch" | Google Console doesn't have the right callback URL | Add `https://airvues-ops.vercel.app/api/auth/callback/google` to the OAuth client's Authorized redirect URIs |
| "Access blocked: not approved" | Consent screen needs verification (only happens with External user type) | Use Internal user type when configuring consent screen |
| Sign-in works but you get 403 in app | Email isn't in `ALLOWED_USERS` | Add the email + role to the JSON in Vercel, redeploy |
| `/me` shows "no People record" after sign-in | Email doesn't match `People.Primary Email` in Airtable | Either add the email to a People record in Airtable, or set `PERSON_OVERRIDES` env JSON to map email → recId |

## When you're ready

Reply "auth flip ready" and I'll execute the code changes. Total downtime: ~2 min during the deploy.
