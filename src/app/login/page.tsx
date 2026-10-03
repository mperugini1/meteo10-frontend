import type { Metadata } from "next";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  // Apenas caminhos internos (evita redirecionamento aberto)
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Meteo10";
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={56} height={56} />
          <h1 className="text-2xl font-bold tracking-tight">{appName}</h1>
          <p className="text-sm text-ink-3">Acompanhe o clima da sua horta, lavoura ou jardim.</p>
        </div>
        <LoginForm next={safeNext(params.next)} />
      </div>
    </main>
  );
}
