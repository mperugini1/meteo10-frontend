import type { Metadata } from "next";

import { Dashboard } from "./Dashboard";

export const metadata: Metadata = { title: "Painel" };

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return <Dashboard noPermission={params.aviso === "sem-permissao"} />;
}
