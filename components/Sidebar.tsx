// Left sidebar nav — operational dashboard rail.
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { getAppSession, isDevPreview } from "@/lib/session";
import { isSamlEnabled } from "@/lib/saml";
import { cookies } from "next/headers";
import { SAML_COOKIE_NAME } from "@/lib/samlSession";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function IconDollar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconLayers() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
function IconBriefcase() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: <IconHome /> },
  { href: "/money", label: "Earnings", icon: <IconDollar /> },
  { href: "/pipeline", label: "Sales Pipeline", icon: <IconChart /> },
  { href: "/clients", label: "Clients", icon: <IconBriefcase /> },
  { href: "/team", label: "Team", icon: <IconUsers /> },
  { href: "/stack", label: "Stack", icon: <IconLayers /> },
];

export async function Sidebar() {
  const session = await getAppSession();
  const role = session?.user?.role || "viewer";

  // If the user has a SAML session cookie, sign-out clears that and redirects to login.
  // Otherwise (NextAuth OAuth path) fall back to NextAuth's signOut.
  const samlCookie = (await cookies()).get(SAML_COOKIE_NAME)?.value;
  const samlActive = isSamlEnabled() && !!samlCookie;

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[208px] bg-sidebar border-r border-rule flex flex-col z-40">
      {/* Brand */}
      <div className="px-5 pt-5 pb-6">
        <div className="text-[15px] font-semibold text-ink-strong">Airvues</div>
        <div className="text-[11px] text-ink-muted mt-0.5">Operations</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] text-ink-muted hover:text-ink-strong hover:bg-surface/60 rounded-md transition-colors group"
              >
                <span className="text-ink-faint group-hover:text-ink-muted transition-colors">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer / user */}
      <div className="px-3 pb-3 pt-2 border-t border-rule mt-2 space-y-2">
        <div className="px-2.5 text-[10px] font-mono text-ink-faint tracking-wider uppercase">
          {isDevPreview ? "Dev Preview" : "Live"}
        </div>
        {session?.user?.email && (
          <div className="px-2.5">
            <div className="text-[11px] font-mono text-ink-muted truncate">
              {session.user.email}
            </div>
            <div className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">
              {role}
            </div>
          </div>
        )}
        {samlActive ? (
          <a
            href="/api/auth/saml/logout"
            className="block px-2.5 text-[11px] text-ink-muted hover:text-ink-strong transition-colors"
          >
            Sign out
          </a>
        ) : (
          <form action={doSignOut} className="px-2.5">
            <button
              type="submit"
              className="text-[11px] text-ink-muted hover:text-ink-strong transition-colors"
            >
              Sign out
            </button>
          </form>
        )}
        <div className="px-2.5 pt-2 text-[10px] font-mono text-ink-faint tracking-wider uppercase">
          Week 1 · v0.1
        </div>
      </div>
    </aside>
  );
}
