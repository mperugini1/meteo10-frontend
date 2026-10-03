import { redirect } from "next/navigation";

import { AppNav } from "@/components/AppNav";
import { SessionProvider } from "@/components/SessionProvider";
import { getSessionUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <SessionProvider user={user}>
      <AppNav user={user} />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-5">{children}</main>
    </SessionProvider>
  );
}
