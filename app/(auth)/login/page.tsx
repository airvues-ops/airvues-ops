// Sign-in page. Google OAuth only.
// Password fallback was removed 2026-05-18 after Google OAuth was verified working.
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import { auth, signIn } from "@/lib/auth";
import { SAML_COOKIE_NAME, verifySamlSession } from "@/lib/samlSession";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const sp = await searchParams;

  // Already signed in via NextAuth?
  const nextSession = await auth();
  if (nextSession?.user?.email) {
    redirect(sp.from || "/");
  }

  // Already signed in via lingering SAML cookie (from previous password sessions)?
  const samlToken = (await cookies()).get(SAML_COOKIE_NAME)?.value;
  const samlSession = samlToken ? await verifySamlSession(samlToken) : null;
  if (samlSession) {
    redirect(sp.from || "/");
  }

  const errorMsg = sp.error ? decodeURIComponent(sp.error) : null;

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: sp.from || "/" });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-bg p-4">
      <div className="max-w-md w-full bg-surface border border-rule rounded-card p-10 shadow-card">
        <div className="flex items-center gap-3 mb-8">
          <Image src="/airvues-mark.png" alt="Airvues" width={36} height={38} priority />
          <span className="text-[15px] font-semibold text-ink-strong">Airvues Ops</span>
        </div>
        <h1 className="text-2xl font-semibold text-ink-strong mb-2 leading-tight">Sign in</h1>
        <p className="text-ink-muted text-[13px] mb-8 leading-relaxed">
          Internal tool for Airvues LLC. Sign in with your{" "}
          <span className="font-mono text-ink-strong">@airvues.com</span> Google account.
        </p>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-soft border border-red/30 rounded text-[12px] text-red leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full bg-white text-[#1f1f1f] py-2.5 px-5 rounded font-semibold text-[13px] hover:bg-white/90 transition-colors flex items-center justify-center gap-2.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </form>

        <p className="text-[11px] text-ink-faint mt-6 leading-relaxed">
          Allowlist: any <span className="font-mono text-ink-muted">@airvues.com</span> Workspace user, plus Lee's
          personal Gmail. Role is derived from your email — admin / lead / engineer.
        </p>
      </div>
    </div>
  );
}
