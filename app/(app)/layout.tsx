// Authenticated app shell — Sidebar (desktop) + MobileNav (mobile) + main content area.
import { getAppSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { signOut } from "@/lib/auth";
import { isSamlEnabled } from "@/lib/saml";
import { SAML_COOKIE_NAME } from "@/lib/samlSession";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  if (!session?.user?.role) {
    redirect("/login");
  }

  // Determine which sign-out path applies to this session.
  const samlCookie = (await cookies()).get(SAML_COOKIE_NAME)?.value;
  const samlActive = isSamlEnabled() && !!samlCookie;

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <>
      <Sidebar />
      <MobileNav
        userEmail={session.user.email}
        userRole={session.user.role}
        samlActive={samlActive}
        signOutAction={doSignOut}
      />
      <div className="md:ml-[208px] min-h-screen page-enter">{children}</div>
    </>
  );
}
