// Top masthead — compact, dense, operational. No flair.
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { getAppSession, isDevPreview } from "@/lib/session";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/money", label: "Money" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/clients", label: "Clients" },
  { href: "/team", label: "Team" },
  { href: "/stack", label: "Stack" },
];

export async function Masthead() {
  const session = await getAppSession();
  const role = session?.user?.role || "viewer";

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <header className="border-b border-rule bg-white sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 h-12 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-4 h-4 bg-navy rounded-[3px]" />
            <span className="text-[14px] font-semibold text-ink-strong">Airvues Ops</span>
          </Link>
          <nav>
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="px-3 py-1.5 text-[13px] text-ink-muted hover:text-ink-strong hover:bg-rule-soft rounded transition-colors block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-ink-muted">
          <span className="font-mono">{session?.user?.email}</span>
          <span className="text-ink-faint">·</span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-navy">{role}</span>
          {isDevPreview && (
            <span className="px-1.5 py-0.5 bg-signal-warn/10 text-signal-warn font-mono text-[10px] uppercase tracking-wider rounded">
              Dev
            </span>
          )}
          <form action={doSignOut}>
            <button
              type="submit"
              className="text-[12px] text-ink-muted hover:text-ink-strong transition-colors"
            >
              Sign out
            </button>
          </form>
          {role === "admin" && (
            <Link
              href="/settings"
              className="text-[12px] text-ink-muted hover:text-ink-strong transition-colors"
            >
              Settings
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
