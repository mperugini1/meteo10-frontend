import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";

// Segunda barreira (além do proxy): páginas de administração só para admin.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (user?.role !== "admin") redirect("/?aviso=sem-permissao");
  return children;
}
