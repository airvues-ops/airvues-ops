// Authenticated app shell — Sidebar + main content area.
import { getAppSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  if (!session?.user?.role) {
    redirect("/login");
  }

  return (
    <>
      <Sidebar />
      <div className="ml-[208px] min-h-screen">{children}</div>
    </>
  );
}
