// Session helper. Resolves the current user via (in order):
//   1. DEV_PREVIEW bypass (dev only)
//   2. SAML session cookie (set by /api/auth/saml/sso after Google Workspace SSO)
//   3. NextAuth Google OAuth session (legacy / fallback)
//
// Both auth flows produce the same AppSession shape so all pages/components work unchanged.
//
// DEV_PREVIEW MODE:
//   When NODE_ENV !== 'production' AND process.env.DEV_PREVIEW === 'true',
//   returns a synthetic Lee-as-admin session. Bypasses auth entirely.
//   Middleware also checks this; in production it's ignored.

import "server-only";
import { cookies } from "next/headers";
import { auth } from "./auth";
import type { AppRole } from "./auth";
import { SAML_COOKIE_NAME, verifySamlSession } from "./samlSession";

const DEV_PREVIEW =
  process.env.NODE_ENV !== "production" && process.env.DEV_PREVIEW === "true";

export type AppSession = {
  user: {
    email: string;
    name?: string | null;
    image?: string | null;
    role: AppRole;
  };
} | null;

const SYNTHETIC_LEE_SESSION: AppSession = {
  user: {
    email: "leetsao1@gmail.com",
    name: "Lee Tsao",
    role: "admin",
  },
};

export async function getAppSession(): Promise<AppSession> {
  if (DEV_PREVIEW) {
    return SYNTHETIC_LEE_SESSION;
  }

  // 1. SAML cookie takes precedence — set by Google Workspace SSO callback
  try {
    const cookieStore = await cookies();
    const samlToken = cookieStore.get(SAML_COOKIE_NAME)?.value;
    if (samlToken) {
      const samlSession = await verifySamlSession(samlToken);
      if (samlSession) {
        return {
          user: {
            email: samlSession.email,
            name: samlSession.name,
            role: samlSession.role,
          },
        };
      }
    }
  } catch {
    // fall through to NextAuth
  }

  // 2. NextAuth Google OAuth fallback
  const s = await auth();
  if (!s?.user?.email || !(s.user as any).role) return null;
  return {
    user: {
      email: s.user.email,
      name: s.user.name,
      image: s.user.image,
      role: (s.user as any).role as AppRole,
    },
  };
}

export const isDevPreview = DEV_PREVIEW;
