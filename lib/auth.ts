// NextAuth v5 — Google Workspace auth + role allowlist.
// Domain restriction: hd=airvues.com forces the consent screen to only accept @airvues.com accounts.
// leetsao1@gmail.com is allowed via the explicit ALLOWED_USERS allowlist (Lee's personal Gmail predates the Workspace).

import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

export type AppRole = "admin" | "editor" | "viewer";

type AllowedUser = { email: string; role: AppRole };

function loadAllowedUsers(): AllowedUser[] {
  const raw = process.env.ALLOWED_USERS;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ALLOWED_USERS env must be set in production. JSON array of {email, role}.");
    }
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("ALLOWED_USERS must be a JSON array");
    return parsed
      .filter((u) => u && typeof u.email === "string" && typeof u.role === "string")
      .map((u) => ({ email: u.email.toLowerCase(), role: u.role as AppRole }));
  } catch (err) {
    throw new Error(`ALLOWED_USERS is not valid JSON: ${(err as Error).message}`);
  }
}

const allowedUsers = loadAllowedUsers();

function findRole(email: string | null | undefined): AppRole | null {
  if (!email) return null;
  const match = allowedUsers.find((u) => u.email === email.toLowerCase());
  return match ? match.role : null;
}

declare module "next-auth" {
  interface Session {
    user: {
      role: AppRole;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          // Workspace domain hint — Google enforces this at the consent screen for @airvues.com.
          // Personal-Gmail allowlisted users (e.g. leetsao1@gmail.com) bypass via the signIn callback below.
          hd: "airvues.com",
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      // Hard gate: must be on the allowlist. If not, deny — even if Google says they're authenticated.
      const role = findRole(user.email);
      if (!role) {
        console.warn(`[auth] Sign-in denied for ${user.email} — not on ALLOWED_USERS allowlist.`);
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      // First sign-in: set the role on the JWT. Persists across requests.
      if (user?.email) {
        const role = findRole(user.email);
        if (role) token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.role && session.user) {
        session.user.role = token.role as AppRole;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
});

/**
 * Server-side guard — call at the top of any Server Action / route handler that requires a role.
 * Throws if the session is missing or doesn't have the required role.
 */
export async function requireRole(...allowed: AppRole[]) {
  const session = await auth();
  if (!session?.user?.role) {
    throw new Error("Unauthenticated");
  }
  if (!allowed.includes(session.user.role)) {
    throw new Error(`Forbidden — requires role ${allowed.join("|")}, got ${session.user.role}`);
  }
  return session;
}
